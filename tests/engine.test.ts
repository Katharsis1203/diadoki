import test from 'node:test'
import assert from 'node:assert/strict'
import { battlePreview, controlled, dominionSummary, createInitialState, gameReducer, income, leader, movementPath, phase, provinceControl, provinceIncome, provinceStates, provinceSummary, stateDefense, stateIncome, unavailable, victoryTarget } from '../src/game/engine.ts'
import type { GameState } from '../src/game/data.ts'
const select = (s: GameState, id: string) => gameReducer(s, { type: 'selectState', id })
const refresh = (s: GameState) => s.orders ? s : gameReducer(s, { type: 'endTurn' })
function borderArmy(s: GameState, id: string) {
  const target = s.states.find((p) => p.id === id)!
  if (!target.neighbors.includes(leader(s)!.locationStateId)) {
    const origin = target.neighbors.find((neighbor) => movementPath(s, neighbor))
    assert.ok(origin, `${id} has no reachable friendly border`)
    s = gameReducer(select(refresh(s), origin), { type: 'move' })
  }
  return select(refresh(s), id)
}
const invade = (s: GameState, id: string) => gameReducer(borderArmy(s, id), { type: 'invade' })

test('50 unique states belong to eleven connected administrative provinces with valid local references', () => {
  const s = createInitialState()
  assert.equal(s.provinces.length, 11); assert.equal(s.states.length, 50); assert.equal(controlled(s).length, 10)
  assert.equal(new Set(s.states.map((p) => p.id)).size, 50)
  assert.equal(new Set(s.states.map((p) => p.owner)).size, 5)
  const membership = s.provinces.flatMap((p) => {
    assert.ok(p.stateIds.length >= 2 && p.stateIds.length <= 9)
    assert.deepEqual(provinceStates(s, p).map((state) => state.id), p.stateIds)
    assert.ok(p.borderPath.length > 0)
    return p.stateIds
  })
  assert.equal(membership.length, 50); assert.equal(new Set(membership).size, 50)
  assert.equal(new Set([...s.commanders, ...s.recruitables].map((c) => c.id)).size, 7)
  for (const c of [...s.commanders, ...s.recruitables]) {
    assert.ok(s.states.some((p) => p.id === c.homeState))
    assert.ok(s.states.some((p) => p.id === c.locationStateId))
  }
  for (const place of s.settlements) assert.ok(s.states.find((p) => p.id === place.stateId)!.settlementIds.includes(place.id))
  for (const p of s.states) for (const id of p.neighbors) assert.ok(s.states.find((n) => n.id === id)?.neighbors.includes(p.id))
})
test('invalid actions and unknown selection never spend orders or treasury', () => {
  const s = select(createInitialState(), 'babylon')
  for (const state of [{ ...s, treasury: 0 }, { ...s, orders: 0 }]) for (const type of ['develop','fortify','recruit'] as const) assert.equal(gameReducer(state,{type}),state)
  assert.equal(select(s, 'not-a-state'), s)
  const distant = select(s, 'amasia')
  assert.match(unavailable(distant, 'invade')!, /border/); assert.equal(gameReducer(distant, { type: 'invade' }), distant)
  const enemy = select(s, 'assur')
  for (const type of ['develop','fortify','recruit','move'] as const) assert.equal(gameReducer(enemy,{type}),enemy)
})
test('local market construction updates state and province income without changing siblings', () => {
  const s = select(createInitialState(), 'babylon'), province = s.provinces.find((p) => p.id === 'babylonia')!
  assert.equal(income(s), 106); assert.equal(s.treasury, 228)
  const next = gameReducer(s, { type: 'develop' })
  assert.equal(next.treasury, s.treasury - 25); assert.equal(next.orders, 2)
  assert.equal(income(next), income(s) + 4); assert.equal(provinceIncome(next, province), provinceIncome(s, province) + 4)
  assert.deepEqual(next.states.find((p) => p.id === 'chaldaea'), s.states.find((p) => p.id === 'chaldaea'))
  const turn = gameReducer(next, { type: 'endTurn' })
  assert.equal(turn.turn, 2); assert.equal(turn.orders, 3); assert.equal(turn.treasury, next.treasury + income(next))
  assert.ok(turn.log.find((l) => l.includes('Ptolemies holds position')))
})
test('forts strengthen only the selected state', () => {
  const s = select(createInitialState(), 'sippar'), next = gameReducer(s, { type: 'fortify' })
  assert.equal(next.treasury,s.treasury-30); assert.equal(next.orders,2)
  assert.equal(stateDefense(next.states.find(p=>p.id==='sippar')!),stateDefense(s.states.find(p=>p.id==='sippar')!)+3)
  assert.deepEqual(next.states.find(p=>p.id==='babylon'),s.states.find(p=>p.id==='babylon'))
  assert.equal(income(next),income(s))
})
test('marching follows friendly state edges and invasions require a local army', () => {
  let s = select(createInitialState(), 'assur')
  assert.match(unavailable(s,'invade')!, /Move your commander/)
  assert.equal(gameReducer(s,{type:'invade'}),s)
  const path = movementPath(s,'susa')!
  assert.ok(path.length>2)
  for(let i=1;i<path.length;i++) assert.ok(s.states.find(p=>p.id===path[i-1])!.neighbors.includes(path[i]))
  s=gameReducer(select(s,'sippar'),{type:'move'})
  assert.equal(leader(s)!.locationStateId,'sippar'); assert.equal(s.orders,2)
  assert.equal(leader(s)!.homeState,'babylon')
  assert.equal(unavailable(select(s,'assur'),'invade'),null)
  assert.equal(gameReducer(select(s,'sippar'),{type:'move'}).orders,2)
})
test('movement cannot cross an enemy-held corridor', () => {
  let s=select(createInitialState(),'susa')
  // Separate the Susian holdings from the lower Mesopotamian network.
  s={...s,states:s.states.map(p=>['nippur','diyala','chaldaea'].includes(p.id)?{...p,owner:'antigonus'}:p)}
  assert.equal(movementPath(s,'susa'),null)
  assert.match(unavailable(s,'move')!,/connected route/)
  assert.equal(gameReducer(s,{type:'move'}),s)
})
test('recruitment remains local and creates a commander at the target state', () => {
  let s = select(createInitialState(), 'karun')
  assert.match(unavailable(s, 'recruit')!, /No local/)
  s = gameReducer(select(s, 'susa'), { type: 'recruit' })
  assert.equal(s.selectedCommanderId, 'cleitus'); assert.equal(leader(s)!.locationStateId,'susa')
  assert.equal(s.commanders.filter((c) => c.id === 'cleitus').length, 1)
  assert.ok(!s.recruitables.some((c) => c.id === 'cleitus'))
  assert.equal(gameReducer(s, { type: 'recruit' }), s)
  assert.equal(invade(s,'zagros').battle?.playerCommander.id,'cleitus')
})
test('battle blocks actions and retreat preserves state ownership, garrisons and army position', () => {
  const s=invade(createInitialState(),'assur')
  assert.equal(phase(s), 'battle')
  for (const type of ['develop','fortify','move','recruit','invade','endTurn'] as const) assert.equal(gameReducer(s,{type}),s)
  assert.equal(select(s,'ecbatana'),s); assert.equal(gameReducer(s,{type:'selectCommander',id:'sarpedon'}),s)
  const retreat=gameReducer(s,{type:'resolve',plan:'retreat'})
  assert.equal(retreat.orders,s.orders); assert.equal(retreat.battle,null)
  assert.deepEqual(retreat.states,s.states); assert.deepEqual(retreat.commanders,s.commanders)
})
test('conquest changes one state, moves the army, and updates a divided province and dominion', () => {
  const s=invade(createInitialState(),'assur'), province=s.provinces.find(p=>p.id==='assyria')!
  for (const plan of ['assault','guard'] as const) {
    const preview=battlePreview(s,plan)!, next=gameReducer(s,{type:'resolve',plan})
    assert.equal(next.treasury,s.treasury+preview.coin)
    assert.equal(leader(next)!.troops,40-preview.casualties)
    assert.equal(next.states.find(p=>p.id==='assur')!.owner,preview.won?'babylon':'antigonus')
    assert.equal(leader(next)!.locationStateId,preview.won?'assur':'sippar')
    assert.equal(next.states.find(p=>p.id==='assur')!.garrison,preview.won?13:26)
    assert.deepEqual(next.states.find(p=>p.id==='nineveh'),s.states.find(p=>p.id==='nineveh'))
    assert.equal(provinceControl(next,province),preview.won?null:'antigonus')
    assert.equal(income(next),income(s)+(preview.won?stateIncome(s.states.find(p=>p.id==='assur')!):0))
    assert.equal(provinceSummary(next,province).playerStates,preview.won?1:0)
  }
  assert.ok(battlePreview(s,'guard')!.casualties<battlePreview(s,'assault')!.casualties)
})
test('province ownership is derived only after every child state is captured', () => {
  let s=createInitialState();const p=s.provinces.find(p=>p.id==='assyria')!
  assert.equal(provinceControl(s,p),'antigonus')
  for(const [i,id] of ['assur','nineveh','arbela','nisibis','upper-euphrates'].entries()){
    s=invade(s,id);assert.ok(s.battle);assert.equal(battlePreview(s,'guard')!.won,true)
    s=gameReducer(s,{type:'resolve',plan:'guard'})
    assert.equal(provinceControl(s,p),i===4?'babylon':null)
  }
})
test('local events target one state, resolve once, and their coin is included in the battle preview', () => {
  let s=select(createInitialState(),'susa')
  s=gameReducer(s,{type:'develop'})
  assert.deepEqual(s.states.find(p=>p.id==='susa')!.resolvedEventIds,['susa-workshops'])
  assert.ok(s.states.filter(p=>p.id!=='susa').every(p=>p.resolvedEventIds.length===0))
  s=gameReducer(s,{type:'develop'})
  assert.equal(s.log.filter(entry=>entry.includes('Susa’s workshops')).length,1)
  let capture=createInitialState()
  capture={...capture,states:capture.states.map(p=>p.id==='nippur'?{...p,owner:'antigonus'}:p)}
  capture=invade(capture,'nippur')
  const preview=battlePreview(capture,'guard')!, next=gameReducer(capture,{type:'resolve',plan:'guard'})
  assert.equal(preview.coin,28); assert.equal(next.treasury,capture.treasury+28)
  assert.deepEqual(next.states.find(p=>p.id==='nippur')!.resolvedEventIds,['nippur-accounts'])
})
test('a complete campaign reaches 26 states through marching and adjacent conquest', () => {
  let s=gameReducer(select(createInitialState(),'susa'),{type:'recruit'}), captures=0
  assert.equal(victoryTarget(s),26)
  while(phase(s)!=='victory'){
    const candidates=s.states.filter(p=>p.owner!=='babylon'&&p.neighbors.some(id=>movementPath(s,id)))
      .map(p=>invade(s,p.id))
    const next=candidates.find(candidate=>candidate.battle&&battlePreview(candidate,'guard')?.won)
    assert.ok(next,'No reachable winning border invasion')
    s=gameReducer(next,{type:'resolve',plan:'guard'});assert.ok(++captures<=16)
  }
  assert.equal(captures,16);assert.equal(controlled(s).length,26)
  assert.equal(gameReducer(s,{type:'endTurn'}),s); assert.equal(gameReducer(s,{type:'move'}),s)
  assert.deepEqual(gameReducer(s,{type:'reset'}),createInitialState())
})
test('zero troops cannot invade and loss of all states is defeat', () => {
  let s=borderArmy(createInitialState(),'assur')
  s={...s,commanders:s.commanders.map(c=>({...c,troops:0}))}
  assert.equal(gameReducer(s,{type:'invade'}),s)
  s={...s,states:s.states.map(p=>({...p,owner:'ptolemy'}))}
  assert.equal(phase(s),'defeat')
})


test('dominions contain their own states and distinguish partial from complete provinces', () => {
  const s=createInitialState(), before=dominionSummary(s,'babylon')
  assert.deepEqual(before.completeProvinceIds,['susiana'])
  const conquered=gameReducer(invade(s,'assur'),{type:'resolve',plan:'guard'}), after=dominionSummary(conquered,'babylon')
  assert.ok(after.stateIds.includes('assur'));assert.ok(after.provinceIds.includes('assyria'))
  assert.ok(!after.completeProvinceIds.includes('assyria'));assert.notEqual(after.borderPath,before.borderPath)
  assert.equal(after.income,income(conquered))
  const enemy=dominionSummary(conquered,'antigonus')
  assert.ok(!enemy.stateIds.includes('assur'));assert.ok(enemy.provinceIds.includes('assyria'))
})
