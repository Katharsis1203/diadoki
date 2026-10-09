import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../src/game/data.ts'
import { territoryAt } from '../src/game/geography.ts'
import { cameraPan, mapProjection, PERSPECTIVE_Y_SCALE } from '../src/game/mapProjection.ts'
import { focusCamera, MAP_HEIGHT, MAP_WIDTH } from '../src/game/mapView.ts'
import { babyloniaScenery, inSceneryZone, sceneryObjects } from '../src/game/babyloniaScenery.ts'

test('projected state/settlement coordinates round-trip to the same interactive territory',()=>{
  const game=createInitialState(), projection=mapProjection(true)
  assert.ok(PERSPECTIVE_Y_SCALE>.75&&PERSPECTIVE_Y_SCALE<1)
  for(const state of game.states){
    const at: [number,number]=[state.labelX,state.labelY]
    const restored=projection.inverse(projection.point(at))
    assert.ok(Math.hypot(restored[0]-at[0],restored[1]-at[1])<1e-9)
    assert.equal(territoryAt(restored,game.states)?.state.id,state.id)
    assert.deepEqual(mapProjection(false).point(at),at)
  }
  for(const place of game.settlements){
    const restored=projection.inverse(projection.point([place.x,place.y]))
    assert.equal(territoryAt(restored,game.states)?.state.id,place.stateId)
  }
})

test('dragging pans the projected ground by the exact screen displacement at different zooms',()=>{
  for(const enabled of [false,true])for(const scale of [.5,1,3,7]){
    const projection=mapProjection(enabled), start=projection.point([584,497])
    const [x,y]=cameraPan(83,-61,scale,projection)
    const moved=projection.point([584-x,497-y])
    assert.ok(Math.abs((start[0]-moved[0])*scale-83)<1e-8)
    assert.ok(Math.abs((start[1]-moved[1])*scale+61)<1e-8)
  }
})

test('projected province cameras fit actual ground polygons on desktop and mobile',()=>{
  const game=createInitialState(), projection=mapProjection(true)
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}])for(const panel of [false,true])for(const province of game.provinces){
    const shapes=game.states.filter(s=>s.provinceId===province.id).map(s=>s.shape)
    const camera=focusCamera(shapes,viewport,panel,true), [cx,cy]=projection.point([camera.x,camera.y])
    const scale=Math.min(viewport.width/MAP_WIDTH,viewport.height/MAP_HEIGHT)*camera.zoom
    for(const point of shapes.flatMap(shape=>shape.split(' ').map(p=>p.split(',').map(Number) as [number,number]))){
      const [x,y]=projection.point(point),sx=viewport.width/2+(x-cx)*scale,sy=viewport.height/2+(y-cy)*scale
      assert.ok(sx>0&&sx<viewport.width&&sy>0&&sy<viewport.height,`${province.name}: ${viewport.width}×${viewport.height}`)
      if(panel&&viewport.width>=600)assert.ok(sx<viewport.width-370)
    }
  }
})

test('scenery has stable anchors, bottom-centre footprints, depth order and geographically limited relief',()=>{
  const game=createInitialState(), before=JSON.stringify(game),projection=mapProjection(true)
  assert.equal(new Set(babyloniaScenery.map(p=>p.id)).size,babyloniaScenery.length)
  for(let i=0;i<babyloniaScenery.length;i++){
    const p=babyloniaScenery[i]
    assert.ok(inSceneryZone(p.position),p.id)
    if(i)assert.ok(babyloniaScenery[i-1].position[1]<=p.position[1])
    if(p.asset==='mountain')assert.ok(!['babylon','sippar','diyala','nippur','chaldaea'].includes(territoryAt(p.position,game.states)?.state.id??''),'The river plain remains free of mountain artwork')
    if(p.settlementId){const s=game.settlements.find(s=>s.id===p.settlementId)!;assert.deepEqual(p.position,[s.x,s.y])}
  }
  assert.deepEqual(sceneryObjects(projection,1,1,'dominion'),[])
  const regional=sceneryObjects(projection,2.5,3,'province'),local=sceneryObjects(projection,4.5,5,'state')
  assert.ok(local.length>regional.length)
  assert.deepEqual(local,sceneryObjects(projection,4.5,5,'state'))
  for(const o of [...regional,...local]){
    assert.deepEqual([o.x,o.y],projection.point(o.placement.position))
    assert.ok(o.box.top<o.y&&o.box.bottom>=o.y)
    assert.ok(Math.abs(o.box.right-o.x-(o.x-o.box.left))<1e-9)
    assert.ok(o.opacity>0&&o.opacity<=1)
  }
  assert.equal(JSON.stringify(game),before)
})

test('Babylonia has one primary centre per lower river state and one capital, with development-based visual tiers',()=>{
  const game=createInitialState(), province=game.provinces.find(p=>p.id==='babylonia')!
  const riverStateIds=province.stateIds.filter(id=>id!=='zagros')
  const primary=babyloniaScenery.filter(p=>p.asset==='settlement')
  assert.equal(primary.length,riverStateIds.length)
  assert.deepEqual(primary.map(p=>p.stateId).sort(),[...riverStateIds].sort())
  assert.deepEqual(primary.filter(p=>p.isCapital).map(p=>p.stateId),['babylon'])
  assert.equal(primary.find(p=>p.isCapital)!.settlementId,province.mainSettlementId)
  assert.deepEqual([...new Set(primary.map(p=>p.tier))].sort(),['city','homestead','village'])
  for(const p of primary){
    assert.equal(territoryAt(p.position,game.states)?.state.id,p.stateId)
    assert.equal(p.name,game.states.find(s=>s.id===p.stateId)!.name)
    assert.ok(!p.detail,`${p.name}: primary centre must not depend on local detail`)
  }
  for(const level of ['province','state'] as const)for(const zoom of [1.4,2.5,4.5,7]){
    const rendered=sceneryObjects(mapProjection(true),zoom,zoom*1.2,level).filter(o=>o.placement.asset==='settlement'&&province.stateIds.includes(o.placement.stateId))
    assert.equal(rendered.length,riverStateIds.length)
    assert.ok(rendered.every(o=>o.opacity===1))
    const capital=rendered.find(o=>o.placement.asset==='settlement'&&o.placement.isCapital)!
    const homesteads=rendered.filter(o=>o.placement.asset==='settlement'&&o.placement.tier==='homestead')
    const villages=rendered.filter(o=>o.placement.asset==='settlement'&&o.placement.tier==='village')
    assert.equal(homesteads.length,3)
    assert.equal(villages.length,1)
    assert.ok(villages.every(o=>o.size<capital.size&&homesteads.every(v=>v.size<o.size)))
  }
})
