import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../src/game/data.ts'
import { gameReducer } from '../src/game/engine.ts'
import { pointInState } from '../src/game/geography.ts'
import { mapVertices, stateRings } from '../src/game/stateGeometry.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { prepareMapScene } from '../src/game/mapScene.ts'

test('prepared geometry preserves recorded point-query results at vertices, edges and interiors', () => {
  // Boundary results captured from checkpoint f4e4b9f, not calculated using the
  // optimized function under test. Keep the established ray-casting semantics.
  const boundaries: Record<string, readonly [boolean,boolean]> = {
    babylon:[true,false], ur:[true,false], susa:[false,false], cossaea:[false,false],
    nisaea:[false,true], zagros:[false,false], trapezus:[false,false],
    mazaca:[true,true], sophene:[false,false],
  }
  for (const [id, [vertexInside,edgeInside]] of Object.entries(boundaries)) {
    const [a,b] = stateRings[id].map(index => mapVertices[index])
    const midpoint: readonly [number,number] = [(a[0]+b[0])/2,(a[1]+b[1])/2]
    assert.equal(pointInState(a,id),vertexInside,`${id}: vertex`)
    assert.equal(pointInState(midpoint,id),edgeInside,`${id}: edge`)
  }
  for (const state of createInitialState().states) {
    assert.equal(pointInState([state.labelX,state.labelY],state.id),true,`${state.id}: interior`)
    assert.equal(pointInState([-2000,-2000],state.id),false,`${state.id}: outside bounds`)
  }
})

test('reset copies mutable game data while reusing identical immutable geometry', () => {
  const first=createInitialState(), second=createInitialState(), expected=JSON.stringify(second)
  first.provinces[0].stateIds.pop()
  first.states[0].neighbors.pop()
  first.states[0].settlementIds.push('temporary')
  first.states[0].buildings.market=99
  first.states[0].resolvedEventIds.push('temporary')
  first.commanders[0].troops=0
  first.log.push('temporary')
  assert.equal(JSON.stringify(second),expected)
  assert.equal(JSON.stringify(createInitialState()),expected)
})

test('repeat selection is a no-op while genuine selection remains available', () => {
  const game=createInitialState()
  assert.equal(gameReducer(game,{type:'selectState',id:null}),game)
  assert.equal(gameReducer(game,{type:'selectCommander',id:game.selectedCommanderId}),game)
  const selected=gameReducer(game,{type:'selectState',id:'sippar'})
  assert.notEqual(selected,game)
  assert.equal(gameReducer(selected,{type:'selectState',id:'sippar'}),selected)
})

test('scene preparation follows development, selection, commander and ownership changes', () => {
  const game=createInitialState(), before=JSON.stringify(game), projection=mapProjection(true)
  const original=prepareMapScene(game,projection,2.5,3,'state',true)
  const changed={...game,selectedStateId:'diyala',selectedCommanderId:'sarpedon',states:game.states.map(s =>
    s.id==='diyala' ? {...s,buildings:{...s.buildings,market:2}} : s.id==='mazaca' ? {...s,owner:'babylon'} : s)}
  const next=prepareMapScene(changed,projection,2.5,3,'state',true)
  assert.equal(next.state?.id,'diyala')
  assert.equal(next.province?.id,'babylonia')
  assert.equal(next.commander?.id,'sarpedon')
  assert.equal(next.labels.find(label => label.id==='diyala')?.priority,10)
  const centre=next.objects.find(o => o.placement.asset==='settlement' && o.placement.stateId==='diyala')!
  assert.equal(centre.placement.asset==='settlement' && centre.placement.tier,'fortress')
  assert.ok(original.seats.some(seat => seat.faction.id==='antigonus'))
  assert.ok(!next.seats.some(seat => seat.faction.id==='antigonus'))
  assert.equal(JSON.stringify(game),before)
})
