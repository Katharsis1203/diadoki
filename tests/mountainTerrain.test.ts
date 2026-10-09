import test from 'node:test'
import assert from 'node:assert/strict'
import clipping from 'polygon-clipping'
import { createInitialState, project } from '../src/game/data.ts'
import { gameReducer, movementPath, unavailable } from '../src/game/engine.ts'
import { territoryAt, pointInState } from '../src/game/geography.ts'
import { theatreStateAt } from '../src/game/theatreGeography.ts'
import { mountainLand, stateLand, atlasLand, travelRegions, stateAnchorRegions } from '../src/game/mountainGeometry.ts'
import { backbonePeaks } from '../src/game/terrainBackbone.ts'
import { inMountainTerrain, canTravelDirectly } from '../src/game/mountainTerrain.ts'

const closed=(m:number[][][][])=>m.map(p=>p.map(r=>[...r,r[0]])) as clipping.MultiPolygon
const ringArea=(r:readonly (readonly number[])[])=>Math.abs(r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1]},0))/2
const area=(m:clipping.MultiPolygon)=>m.reduce((s,p)=>s+ringArea(p[0])-p.slice(1).reduce((a,h)=>a+ringArea(h),0),0)

test('independent mountain terrain belongs to no core or atlas state',()=>{
  const game=createInitialState()
  for(const at of [[46.30,35.16],[48.76,32.73],[50.90,32.80],[57.0,30.4]] as const){
    const p=project(at)
    assert.ok(inMountainTerrain(p),`Mountain fixture ${at}`)
    assert.equal(territoryAt(p,game.states),null)
    assert.equal(theatreStateAt(p),undefined)
  }
  const mountains=closed(mountainLand)
  for(const [id,m] of Object.entries({...stateLand,...atlasLand}))
    assert.ok(area(clipping.intersection(closed(m),mountains))<.002,`${id}: owns mountain terrain`)
})

test('a mountain border rejects direct movement and invasion without spending an order',()=>{
  let game=createInitialState()
  assert.ok(game.states.find(s=>s.id==='arbela')!.neighbors.includes('ganzak'),'Administrative neighbours')
  assert.equal(canTravelDirectly('arbela','ganzak'),false)
  game={...game,selectedStateId:'ganzak',commanders:game.commanders.map(c=>c.id===game.selectedCommanderId?{...c,locationStateId:'arbela'}:c),states:game.states.map(s=>({...s,owner:s.id==='arbela'||s.id==='ganzak'?'babylon':'antigonus'}))}
  assert.equal(movementPath(game,'ganzak'),null,'No teleport across the ridge')
  assert.match(unavailable(game,'move')!,/passes/)
  assert.equal(gameReducer(game,{type:'move'}),game)
  const invasion={...game,states:game.states.map(s=>s.id==='ganzak'?{...s,owner:'antigonus'}:s)}
  assert.match(unavailable(invasion,'invade')!,/Mountains block/)
  assert.equal(gameReducer(invasion,{type:'invade'}),invasion)
})

test('authored passes connect valleys and preserve routes through all opening holdings',()=>{
  const initial=createInitialState()
  for(const state of initial.states.filter(s=>s.owner==='babylon'))assert.ok(movementPath(initial,state.id),state.id)
  assert.equal(canTravelDirectly('mountain-entrance','paraitakene'),false,'Northern approach is closed')
  assert.ok(canTravelDirectly('susa','western-valley'),'Western valley pass stays open')
  const approach={...initial,selectedStateId:'western-valley',states:initial.states.map(s=>({...s,owner:['susa','western-valley'].includes(s.id)?'babylon':'antigonus'})),commanders:initial.commanders.map(c=>c.id===initial.selectedCommanderId?{...c,locationStateId:'susa'}:c)}
  assert.deepEqual(movementPath(approach,'western-valley'),['susa','western-valley'])
  const moved=gameReducer(approach,{type:'move'})
  assert.equal(moved.orders,approach.orders-1)
  assert.equal(moved.commanders.find(c=>c.id===approach.selectedCommanderId)!.locationStateId,'western-valley')
  assert.ok(canTravelDirectly('elymais','mountain-entrance'),'The shared middle pass stays open')
  const seen=new Set<string>(),queue=[stateAnchorRegions.babylon]
  while(queue.length){const id=queue.pop()!;if(seen.has(id))continue;seen.add(id);queue.push(...travelRegions[id].neighbors)}
  for(const state of initial.states)assert.ok(seen.has(stateAnchorRegions[state.id]),`Unreachable ${state.id}`)
})

test('the two valley states replace Paraitakene’s tongue and Western Persis ends below its ridge',()=>{
  for(const [at,id] of [[[49.48,33.20],'western-valley'],[[50.05,32.95],'mountain-entrance']] as const){
    const p=project(at)
    assert.ok(!pointInState(p,'paraitakene'))
    assert.ok(!inMountainTerrain(p))
    assert.ok(pointInState(p,id))
  }
  const western=atlasLand['western-persis'].flat(2)
  assert.ok(western.every(p=>p[1]>project([51,31.2])[1]),'No long northern arm across the mountain belt')
})


test('River Basin includes its open river pockets while the illustrated Median mountains stay impassable',()=>{
  const game=createInitialState()
  for(const at of [[47.80,37.20],[48.10,36.50],[48.35,36.40],[47.96,36.23]] as const){
    const p=project(at)
    assert.equal(inMountainTerrain(p),false,`Empty ridge extension ${at} must stay open`)
    assert.equal(territoryAt(p,game.states)?.state.id,'atropatene-river-basin')
  }
  for(const peak of backbonePeaks.filter(p=>['media-north','media-east'].includes(p.rangeId))){
    assert.ok(inMountainTerrain(peak.position),`${peak.id}: real relief remains impassable`)
    assert.equal(territoryAt(peak.position,game.states),null)
  }
  assert.equal(stateLand['atropatene-river-basin'].length,1,'The former artificial southern pocket is part of the contiguous basin')
})
