import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState, project } from '../src/game/data.ts'
import { territoryAt } from '../src/game/geography.ts'
import { rivers } from '../src/game/mapGeometry.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { MAP_HEIGHT, MAP_WIDTH, MIN_ZOOM, visibleLabels, worldOverviewCamera } from '../src/game/mapView.ts'
import { isPhysicalLand, physicalLakes } from '../src/game/physicalLand.ts'
import { boundsIntersect, mapViewport } from '../src/game/mapViewport.ts'
import { WORLD_EXTENT, worldBounds, worldRegionAt, worldRidgeSections } from '../src/game/worldTerrain.ts'
import { babyloniaScenery, campaignScenery, sceneryObjects } from '../src/game/babyloniaScenery.ts'
import { backbonePeaks, coreRivers, coreRangeGround, distanceToSegment, inCoreWater, ridgeSections } from '../src/game/terrainBackbone.ts'

test('river backbone retains territorial river vertices and connects upper reaches and major tributaries',()=>{
  for(const original of rivers)assert.equal(coreRivers.find(r=>r.name===original.name)?.path,original.path)
  for(const id of ['upper-euphrates','upper-tigris','halys','iris-kelkit','ceyhan','seyhan','orontes','aras','murat','greater-zab','lesser-zab','diyala','karun','karkheh','shatt-al-arab','po','tiber','axios','evros','nile','rosetta','damietta','jordan','amu-darya','syr-darya','helmand','indus','chenab','sutlej','jhelum','ravi','beas','ganges','yamuna','chambal','son','gandak','ghaghara','kabul','kura','narmada','brahmaputra']){
    const river=coreRivers.find(r=>r.id===id)!
    assert.ok(river?.path.length,`${id}: missing major course`)
    assert.ok(river.mapLines.every(l=>l.length>=2&&l.every(p=>p.every(Number.isFinite))))
    if(river.joins){
      const parent=coreRivers.find(r=>r.id===river.joins)!
      let gap=Infinity
      for(const line of river.mapLines)for(const end of [line[0],line.at(-1)!])for(const reach of parent.mapLines){
        for(let i=1;i<reach.length;i++)gap=Math.min(gap,distanceToSegment(end,reach[i-1],reach[i]).distance)
      }
      assert.ok(gap<1e-8,`${id}: disconnected mouth`)
    }
  }
  // The upper Euphrates must extend through Syria and Armenia rather than
  // connecting the Murat straight to the old lower Mesopotamian reach.
  const upper=coreRivers.find(r=>r.id==='upper-euphrates')!
  assert.ok(upper.mapLines.flat().some(([x,y])=>x<400&&y<200))
  assert.ok(upper.mapLines.flat().some(([x,y])=>x>400&&y>330))
  for(const line of upper.mapLines)for(let i=1;i<line.length;i++)assert.ok(Math.hypot(line[i][0]-line[i-1][0],line[i][1]-line[i-1][1])<50)
})

test('major mountain systems share ground axes, keep water valleys open and leave Babylonian relief unchanged',()=>{
  const game=createInitialState()
  const systems=new Set(ridgeSections.map(r=>r.system))
  for(const name of ['alborz','amanus','anti-lebanon','armenia','lebanon','media','pontic','taurus','zagros','caucasus','alps','apennines','pindus','rhodope','crete','cyprus','red-sea','hindu-kush','pamir','sulaiman','himalaya','aravalli','vindhya'])assert.ok(systems.has(name),`${name}: missing core system`)
  for(const section of ridgeSections){
    assert.ok(backbonePeaks.some(p=>p.rangeId===section.id),`${section.id}: no illustrated relief`)
    assert.deepEqual(coreRangeGround.find(r=>r.id===section.id)?.axis,section.axis)
  }
  for(const peak of backbonePeaks){
    assert.ok(!inCoreWater(peak.position),`${peak.id}: blocks a river/lake`)
    assert.notEqual(territoryAt(peak.position,game.states)?.provinceId,'babylonia')
  }
  for(const original of babyloniaScenery)assert.equal(campaignScenery.find(p=>p.id===original.id),original)
  assert.equal(new Set(campaignScenery.map(p=>p.id)).size,campaignScenery.length)
  assert.equal(campaignScenery.filter(p=>p.asset==='settlement'&&babyloniaScenery.some(original=>original.id===p.id)).length,5)
})

test('Italy-to-Ganges context preserves coasts and islands while excluded outer regions remain bare',()=>{
  assert.equal(new Set(physicalLakes.map(l=>l.name)).size,physicalLakes.length,'multipart lakes share one stable rendering key')
  for(const at of [[12.5,41.9],[14,37.4],[24.8,35.2],[33,34.9],[31,29],[54,32],[67,36],[74,31],[83,26]] as const)assert.ok(isPhysicalLand(project(at)),`${at}: land missing`)
  for(const at of [[24,36.8],[35.5,25],[88,18],[51.1,41]] as const)assert.ok(!isPhysicalLand(project(at)),`${at}: sea incorrectly filled`)
  for(const range of worldRidgeSections)for(const [lon,lat] of range.axis){
    assert.ok(lat<=47&&lat>=23,`${range.id}: enters deeper Balkans/steppe/southern India`)
    assert.ok(lon<=WORLD_EXTENT.east)
  }
  const game=createInitialState()
  assert.equal(game.states.length,50)
  assert.equal(game.provinces.length,11)
  assert.equal(worldRegionAt(...project([13.7,37.2]))?.id,'sicily')
  assert.equal(worldRegionAt(...project([83.5,25.3]))?.id,'ganges')
})

test('world Overview fits Italy through northern India on desktop and mobile in both projections',()=>{
  for(const size of [{width:1440,height:900},{width:1600,height:1000},{width:390,height:844},{width:320,height:568},{width:844,height:390}])for(const perspective of [false,true]){
    const projection=mapProjection(perspective),camera=worldOverviewCamera(size,perspective)
    const scale=Math.min(size.width/MAP_WIDTH,size.height/MAP_HEIGHT)*camera.zoom
    const [cx,cy]=projection.point([camera.x,camera.y])
    assert.ok(camera.zoom>=MIN_ZOOM&&camera.zoom<.65)
    for(const point of [[worldBounds.left,worldBounds.top],[worldBounds.right,worldBounds.bottom]] as const){
      const [x,y]=projection.point(point),sx=size.width/2+(x-cx)*scale,sy=size.height/2+(y-cy)*scale
      assert.ok(sx>0&&sx<size.width&&sy>0&&sy<size.height,`${JSON.stringify(size)}: theatre cropped`)
    }
    const view=mapViewport(camera,projection,scale,size)
    assert.ok(boundsIntersect(view,worldBounds))
    assert.ok(view.left<worldBounds.left&&view.right>worldBounds.right&&view.top<worldBounds.top&&view.bottom>worldBounds.bottom)
  }
})

test('campaign-wide relief keeps projected anchors and depth order stable through detail changes',()=>{
  const game=createInitialState(),before=JSON.stringify(game)
  for(const zoom of [1.4,2.5,4.5,7]){
    const objects=sceneryObjects(mapProjection(true),zoom,zoom*1.2,'province',game.states)
    assert.deepEqual(objects,sceneryObjects(mapProjection(true),zoom,zoom*1.2,'province',game.states))
    for(let i=0;i<objects.length;i++){
      const o=objects[i]
      assert.deepEqual([o.x,o.y],mapProjection(true).point(o.placement.position))
      if(i)assert.ok(objects[i-1].y<=o.y)
    }
  }
  assert.deepEqual(sceneryObjects(mapProjection(true),1,1,'dominion',game.states),[])
  assert.equal(JSON.stringify(game),before)
})

test('mountain district captions prefer open ground and survive dense relief without covering other labels',()=>{
  const caption={id:'trapezus',text:'Trapezus',x:100,y:100,size:15,priority:6,kind:'state' as const,alternatives:[{x:100,y:140}]}
  const peak={left:60,right:140,top:75,bottom:110}
  assert.equal(visibleLabels([caption],1,[],[peak])[0].y,140)
  const mountainDistrict={left:0,right:200,top:0,bottom:200}
  assert.equal(visibleLabels([caption],1,[],[mountainDistrict])[0].y,100)
  assert.deepEqual(visibleLabels([caption],1,[mountainDistrict],[peak]),[])
  const other={...caption,id:'sibling',priority:4}
  assert.deepEqual(visibleLabels([caption,other],1,[],[mountainDistrict]).map(l=>[l.id,l.y]),[['trapezus',100],['sibling',140]])
})
