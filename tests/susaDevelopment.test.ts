import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState, project } from '../src/game/data.ts'
import { gameReducer } from '../src/game/engine.ts'
import { pointInState, territoryAt } from '../src/game/geography.ts'
import { easternFrontierRiver, riverReach } from '../src/game/babyloniaGeography.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { campaignScenery, sceneryObjects } from '../src/game/babyloniaScenery.ts'
import { susaScenery } from '../src/game/susaScenery.ts'
import { susianaStateSettlements, susaFeederChannels, karunEasternBank, susaKarunRiverBank, elymaisNorthernRiver } from '../src/game/susaGeography.ts'
import { susaTerrainFeatures } from '../src/game/susaTerrain.ts'
import { prepareMapScene } from '../src/game/mapScene.ts'
import { DEFAULT_MAP_SETTINGS } from '../src/game/mapSettings.ts'
import { inCoreWater } from '../src/game/terrainBackbone.ts'
import { stateLand, mountainPassLines } from '../src/game/mountainGeometry.ts'
import { inMountainTerrain } from '../src/game/mountainTerrain.ts'
import { mapVertices, stateRings, provinceOutlines } from '../src/game/stateGeometry.ts'
import { riverCourses } from '../src/game/riverCourses.ts'
import { distanceToSegment } from '../src/game/terrainBackbone.ts'

const districtIds=['susa','karun','elymais','mountain-entrance','western-valley']

test('Susiana and Babylonia meet on the lower Tigris and Shatt channel with each province keeping its own bank',()=>{
  const rivers=[easternFrontierRiver,riverReach('Shatt al-Arab',[47.46851,30.96845],[48.53184,29.9612])]
  const game=createInitialState()
  for(const river of rivers){
    for(const at of river){
      const p=project(at)
      for(const id of ['susiana','babylonia']){
        const border=provinceOutlines[id]
        assert.ok(Math.min(...border.map((a,i)=>distanceToSegment(p,a,border[(i+1)%border.length]).distance))<.00001,`${id}: boundary stays on the displayed channel`)
      }
    }
    for(const i of [3,6,9]){
      const a=project(river[i-1]),b=project(river[i]),dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)
      const provinces=[-1,1].map(side=>territoryAt([(a[0]+b[0])/2-side*dy/length,(a[1]+b[1])/2+side*dx/length],game.states)?.provinceId)
      assert.deepEqual(provinces.sort(),['babylonia','susiana'],'Opposite banks belong to opposite provinces within one map unit of the channel')
    }
  }
})
test('Susiana and Western Valley have one settlement per state and sparse local Susa terrain',()=>{
  const game=createInitialState(),centres=campaignScenery.filter(p=>p.asset==='settlement'&&districtIds.includes(p.stateId))
  assert.deepEqual(centres.map(p=>p.stateId).sort(),[...districtIds].sort())
  assert.deepEqual(centres.filter(p=>p.isCapital).map(p=>p.name),['Susa'])
  for(const id of districtIds){
    const state=game.states.find(s=>s.id===id)!
    const centre=centres.find(p=>p.stateId===id)!
    assert.deepEqual(state.settlementIds,[centre.settlementId])
    assert.equal(centre.name,state.name)
    assert.ok(pointInState(centre.position,id))
    if(!centre.isCapital)assert.ok(!inCoreWater(centre.position,3),`${id}: settlement lies in water`)
  }
  for(const p of susaScenery)assert.ok(pointInState(p.position,p.asset==='settlement'?p.stateId:'susa'),p.id)
  for(const place of susianaStateSettlements)assert.ok(pointInState(project(place.position),place.stateId))
  for(const f of susaTerrainFeatures){
    assert.equal(f.stateId,'susa')
    assert.ok(f.opacity<=.5&&f.width<=14)
    for(const at of f.points)assert.ok(pointInState(project(at),'susa'),f.id)
  }
  for(const f of susaFeederChannels)for(const at of f.points)assert.ok(pointInState(project(at),'susa'),f.id)
  assert.equal(game.states.filter(s=>s.owner==='babylon').length,10)
  assert.equal(game.treasury,228)
})

test('each Susiana settlement supplies its own state label with simple markers as a fallback',()=>{
  const game={...createInitialState(),selectedStateId:'susa'},projection=mapProjection(true)
  for(const settlements of [true,false])for(const level of ['province','state'] as const){
    const scene=prepareMapScene(game,projection,4.5,4.5,level,true,false,{...DEFAULT_MAP_SETTINGS,settlements})
    for(const id of districtIds){
      const state=game.states.find(s=>s.id===id)!,labels=scene.labels.filter(l=>l.text===state.name)
      assert.equal(labels.length,1)
      assert.equal(labels[0].id,id)
      assert.equal(labels[0].size,id==='susa'?17:15)
      assert.ok(scene.illustratedSeats.has(state.settlementIds[0]))
    }
    assert.equal(scene.labels.find(l=>l.id==='susa')!.priority,10)
  }
})

test('development grows only the selected Susiana settlement and preserves capital status and anchors',()=>{
  const projection=mapProjection(true),initial=createInitialState(),authored=JSON.stringify(susaScenery)
  let game=gameReducer(initial,{type:'selectState',id:'karun'})
  const verify=(expected:string)=>{
    const objects=sceneryObjects(projection,4.5,4.5,'state',game.states).filter(o=>o.placement.asset==='settlement'&&districtIds.includes(o.placement.stateId))
    assert.equal(objects.length,5)
    for(const object of objects){
      const p=object.placement
      if(p.asset!=='settlement')assert.fail('settlement expected')
      assert.equal(p.tier,p.stateId==='karun'?expected:p.isCapital?'city':['mountain-entrance','western-valley'].includes(p.stateId)?'homestead':'village')
      assert.deepEqual(p.position,campaignScenery.find(a=>a.id===p.id)!.position)
    }
    const capital=objects.find(o=>o.placement.asset==='settlement'&&o.placement.isCapital)!
    assert.ok(objects.every(o=>o===capital||o.size<capital.size))
  }
  verify('homestead')
  game=gameReducer(game,{type:'fortify'});verify('homestead')
  game=gameReducer(game,{type:'develop'});verify('village')
  game=gameReducer(game,{type:'develop'});verify('fortress')
  game=gameReducer(game,{type:'endTurn'})
  game=gameReducer(game,{type:'develop'});verify('city')
  assert.equal(initial.states.find(s=>s.id==='karun')!.buildings.market,0)
  for(const id of ['susa','elymais'])assert.deepEqual(game.states.find(s=>s.id===id)!.buildings,initial.states.find(s=>s.id===id)!.buildings)
  assert.equal(JSON.stringify(susaScenery),authored)
})

test('Susiana combines its southern hinterland and keeps a smaller river-bounded middle district',()=>{
  const game=createInitialState(),province=game.provinces.find(p=>p.id==='susiana')!
  assert.deepEqual([...province.stateIds].sort(),[...districtIds].sort())
  assert.ok(!game.states.some(s=>s.id==='cossaea'))
  assert.ok(!game.settlements.some(p=>p.id==='cossaea-centre'))
  assert.ok(pointInState(project([47.25,33.12]),'susa'),'Former Cossaean centre now belongs to Susa')
  const ringArea=(r:number[][])=>Math.abs(r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1]},0)/2)
  const areas=Object.fromEntries(districtIds.map(id=>[id,stateLand[id].reduce((s,p)=>s+ringArea(p[0])-p.slice(1).reduce((s,r)=>s+ringArea(r),0),0)]))
  assert.ok(areas.karun>900&&areas.karun<areas.susa*.4,'Karun retains its main floodplain and western pocket')
  assert.ok(areas.elymais>areas.susa&&areas.elymais>areas.karun*3,'Elymais combines the broad southern hinterland')
  assert.ok(areas.susa>areas['mountain-entrance']*1.4,'The capital retains its larger plain')
  for(const id of districtIds)assert.equal(stateLand[id].filter(p=>ringArea(p[0])>20).length,1,`${id}: no detached mainland district`)
  const border=provinceOutlines.susiana
  for(const at of riverCourses.find(r=>r.id==='shatt-al-arab')!.lines[0].slice(1,-1)){
    const point=project(at)
    const distance=Math.min(...border.map((a,i)=>distanceToSegment(point,a,border[(i+1)%border.length]).distance))
    assert.ok(distance<3.2,'Lower province border hugs the Shatt al-Arab bank')
  }
  assert.ok(inMountainTerrain(project([49.02,32.53])),'The middle Susian crossing is closed mountain terrain')
  assert.ok(!inMountainTerrain(project([48.20,33.18])),'The western valley pass remains open')
  assert.ok(!mountainPassLines.some(p=>p.id==='susian-valley-pass'))
  assert.ok(!mountainPassLines.some(p=>p.id==='plateau-saddle'))
  assert.ok(inMountainTerrain(project([50.03,33.43])),'Northern approach is closed')
  assert.ok(inMountainTerrain(project([49.05,32.05])),'The ground above Elymais’s upper river edge is independent mountain terrain')
  assert.ok(pointInState(project([51.20,32.20]),'mountain-entrance'),'Eastern valley floor is included')
  assert.ok(mountainPassLines.some(p=>p.id==='western-valley-pass'))
})

test('the open passage belongs to its valley states up to the visible southern mountains',()=>{
  for(const [at,id] of [[[49.85,32.10],'mountain-entrance'],[[50.01,32.05],'mountain-entrance'],[[49.85,31.99],'elymais'],[[50.03,31.90],'elymais']] as const){
    assert.ok(!inMountainTerrain(project(at)),`Open valley ground ${at}`)
    assert.ok(pointInState(project(at),id),`${id}: valley ground excluded`)
  }
  assert.ok(inMountainTerrain(project([50.40,31.76])),'The first visible southern peak remains unowned mountain terrain')
})


test('Karun stays east of the lower Karkheh while the whole western river pocket belongs to Susa',()=>{
  const edges=(id:string)=>stateRings[id].map(i=>mapVertices[i])
  const distance=(at:readonly number[],id:string)=>{const r=edges(id);return Math.min(...r.map((p,i)=>distanceToSegment(at,p,r[(i+1)%r.length]).distance))}
  for(const at of karunEasternBank.slice(3,-1)){
    const p=project(at)
    assert.ok(distance(p,'karun')<.00001,'Karun ends at the displayed channel')
    assert.ok(distance(p,'elymais')<.00001,'Elymais shares the same channel')
  }
  for(const at of susaKarunRiverBank.slice(0,-1)){
    const p=project(at)
    assert.ok(distance(p,'susa')<.00001,'Susa uses the Karkheh centreline')
    assert.ok(distance(p,'karun')<.00001,'Karun shares the Karkheh centreline')
  }
  for(const at of [[48.58,31.13],[48.41,30.84]] as const){
    assert.ok(pointInState(project([at[0]-.04,at[1]]),'karun'),'West bank belongs to the middle state')
    assert.ok(pointInState(project([at[0]+.04,at[1]]),'elymais'),'East bank belongs to the southern state')
  }
  for(const at of [[47.50,31.20],[47.48,31.10],[47.53,31.28]] as const){
    assert.ok(pointInState(project(at),'susa'),'The complete western pocket belongs to Susa')
    assert.ok(!pointInState(project(at),'karun'),'Karun cannot cross the lower Karkheh into the pocket')
  }
  for(const at of [[47.68,30.78],[48.15,31.15],[48.54,31.13]] as const){
    assert.ok(pointInState(project(at),'karun'),'Karun keeps its main eastern area')
  }
  for(const at of [[48.9,30.2],[49.50,31.02],[48.95,31.32]] as const){
    assert.ok(pointInState(project(at),'elymais'),'Old southern Karun land joins Elymais')
    assert.ok(!pointInState(project(at),'karun'),'No Karun tail extends to the coast')
  }
})


test('Elymais follows the western upper Karun bend while preserving the main approach valley',()=>{
  for(const at of [[49.95,32.50],[49.85,32.10],[50.01,32.05]] as const){
    assert.ok(pointInState(project(at),'mountain-entrance'),'The main approach valley stays in Mountain Entrance')
    assert.ok(!inMountainTerrain(project(at)),'The reserved valley remains traversable')
  }
  const ring=stateLand.elymais.flat(1)
  for(const at of elymaisNorthernRiver.slice(1)){
    const p=project(at),distance=Math.min(...ring.flatMap(r=>r.map((a,i)=>distanceToSegment(p,a,r[(i+1)%r.length]).distance)))
    assert.ok(distance<.00001,'Elymais land uses the displayed upper river edge')
  }
  for(const at of [[49.52,32.02],[49.44,31.78],[49.15,31.83]] as const){
    const p=project(at)
    assert.ok(inMountainTerrain(p),'North bank belongs to independent terrain')
    for(const id of districtIds)assert.ok(!pointInState(p,id),'No Susiana state owns the mountain shoulder')
    assert.ok(pointInState(project([at[0],at[1]-.16]),'elymais'),'South bank belongs to Elymais')
  }
})
