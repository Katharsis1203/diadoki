import test from 'node:test'
import { movementPath, unavailable } from '../src/game/engine.ts'
import assert from 'node:assert/strict'
import { createInitialState, project } from '../src/game/data.ts'
import { pointInState } from '../src/game/geography.ts'
import { campaignScenery, sceneryObjects } from '../src/game/babyloniaScenery.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { ridgeBaseLine } from '../src/game/ridgeBorders.ts'

test('mountain entrance belongs to Susiana and follows the eastern valley into the plateau',()=>{
  const game=createInitialState(),state=game.states.find(s=>s.id==='mountain-entrance')!
  assert.equal(state.provinceId,'susiana')
  assert.equal(state.owner,game.states.find(s=>s.id==='susa')!.owner)
  const province=game.provinces.find(p=>p.id===state.provinceId)!
  assert.equal(province.mainSettlementId,'susa-city')
  assert.ok(province.stateIds.includes(state.id))
  assert.ok(['paraitakene','elymais','susa','western-valley'].every(id=>state.neighbors.includes(id)))
  assert.ok(pointInState(project([49.95,32.65]),state.id))
  assert.ok(pointInState(project([51.20,32.20]),state.id),'Approach follows the basin between the ridges')
  assert.ok(!pointInState(project([51.80,31.20]),state.id),'The oversized eastern tail is removed')
  assert.ok(!pointInState(project([49.05,32.05]),state.id),'The approach stays out of Susa’s river plain')
  assert.ok(!pointInState(project([49.36,33.60]),state.id),'Old northern wedge returns to Media')
  assert.ok(!state.neighbors.includes('ecbatana'))
  assert.equal(state.settlementIds.length,1)
  const settlement=game.settlements.find(s=>s.id===state.settlementIds[0])!
  assert.ok(pointInState([settlement.x,settlement.y],state.id))
  const art=campaignScenery.filter(s=>s.asset==='settlement'&&s.stateId===state.id)
  assert.equal(art.length,1)
  assert.equal(art[0].asset,'settlement')
  if(art[0].asset==='settlement')assert.equal(art[0].isCapital,false)
  const objects=sceneryObjects(mapProjection(true),4,4,'state',game.states)
  assert.equal(objects.filter(o=>o.placement.asset==='settlement'&&o.placement.stateId===state.id).length,1)
})

test('the Susian approach stays reachable while its northern mountain crossing is closed',()=>{
  const game=createInitialState()
  assert.ok(movementPath(game,'mountain-entrance'))
  game.states=game.states.map(s=>s.id==='paraitakene'?{...s,owner:'babylon'}:s)
  game.commanders=game.commanders.map(c=>c.id===game.selectedCommanderId?{...c,locationStateId:'mountain-entrance'}:c)
  assert.deepEqual(movementPath(game,'paraitakene'),['mountain-entrance','western-valley','paraitakene'],'The newly friendly valley supplies an indirect approach')
  game.states=game.states.map(s=>s.id==='western-valley'?{...s,owner:'antigonus'}:s)
  assert.equal(movementPath(game,'paraitakene'),null)
  game.selectedStateId='paraitakene'
  game.states=game.states.map(s=>s.id==='paraitakene'?{...s,owner:'antigonus'}:s)
  assert.match(unavailable(game,'invade')!,/Mountains block/)
})

test('ridge guides follow both bases, with narrower margins as the relief tapers',()=>{
  const points=[[0,0],[20,0],[40,0]] as const
  assert.deepEqual(ridgeBaseLine(points,20,1),[[0,9],[20,9],[40,9]])
  assert.deepEqual(ridgeBaseLine(points,20,-1),[[0,-9],[20,-9],[40,-9]])
  const tapered=ridgeBaseLine(points,20,1,[1,.4])
  assert.ok(tapered[0][1]>tapered[1][1]&&tapered[1][1]>tapered[2][1])
  for(const p of ridgeBaseLine([[0,0],[20,20],[40,0]],100,1))assert.ok(p.every(Number.isFinite))
})

test('the separate western valley belongs to Susiana and retains the Cossaean shoulder',()=>{
  const game=createInitialState(),valley=game.states.find(s=>s.id==='western-valley')!
  assert.equal(valley.provinceId,'susiana')
  assert.equal(valley.owner,game.states.find(s=>s.id==='susa')!.owner)
  assert.equal(game.provinces.find(p=>p.id==='media')!.mainSettlementId,'ecbatana-city')
  for(const at of [[48.15,33.85],[49.14,33.18],[48.63,33.33]] as const){
    assert.ok(pointInState(project(at),valley.id),'Western valley and old northern shoulder remain in their own Susian state')
    assert.ok(!pointInState(project(at),'susa'),'Susa must not peek into the valley')
  }
  assert.equal(valley.settlementIds.length,1)
  const settlement=game.settlements.find(s=>s.id===valley.settlementIds[0])!
  assert.ok(pointInState([settlement.x,settlement.y],valley.id))
  const centres=campaignScenery.filter(s=>s.asset==='settlement'&&s.stateId===valley.id)
  assert.equal(centres.length,1)
  assert.ok(centres[0].asset==='settlement'&&!centres[0].isCapital)
  assert.ok(valley.neighbors.includes('mountain-entrance'))
})

test('Western Valley shares the Karkheh with the northern Median states', async()=>{
  const {westernValleyRiver}=await import('../src/game/mountainEntranceGeography.ts')
  const {mapVertices,stateRings}=await import('../src/game/stateGeometry.ts')
  const {coreRivers,distanceToSegment}=await import('../src/game/riverGeometry.ts')
  const {territoryAt}=await import('../src/game/geography.ts')
  const game=createInitialState(),valley=game.states.find(s=>s.id==='western-valley')!
  const susiana=game.provinces.find(p=>p.id==='susiana')!,media=game.provinces.find(p=>p.id==='media')!
  assert.equal(susiana.stateIds.length,5);assert.equal(media.stateIds.length,4)
  assert.ok(susiana.stateIds.includes(valley.id)&&!media.stateIds.includes(valley.id))
  const ring=stateRings[valley.id].map(i=>mapVertices[i])
  for(const at of westernValleyRiver){
    const p=project(at),matches=(q:readonly number[])=>Math.hypot(q[0]-p[0],q[1]-p[1])<.00001
    assert.ok(ring.some(matches),'Valley reuses the river-bank frontage')
    assert.ok(['nisaea','ecbatana'].some(id=>stateRings[id].map(i=>mapVertices[i]).some(matches)),'The opposite river bank belongs to another Median state')
  }
  const river=coreRivers.find(r=>r.id==='karkheh')!
  for(const at of westernValleyRiver){
    const p=project(at)
    assert.ok(river.mapLines.some(line=>line.slice(1).some((b,i)=>distanceToSegment(p,line[i],b).distance<.001)))
  }
  // The old straight chord left these southern-bank shoulders outside the valley.
  for(const at of [[47.75,34.30],[48.45,34.25]] as const){
    const match=territoryAt(project(at),game.states)
    assert.equal(match?.state.id,'western-valley');assert.equal(match?.provinceId,'susiana')
  }
})
