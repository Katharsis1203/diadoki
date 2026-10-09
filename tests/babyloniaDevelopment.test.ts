import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState, project } from '../src/game/data.ts'
import { income, movementPath, victoryTarget } from '../src/game/engine.ts'
import { territoryAt } from '../src/game/geography.ts'
import { stateRings } from '../src/game/stateGeometry.ts'
import { stateLand } from '../src/game/mountainGeometry.ts'
import { babyloniaScenery } from '../src/game/babyloniaScenery.ts'
import { diyalaTributaryBank, middleTigrisBank } from '../src/game/babyloniaGeography.ts'
import { coreRivers, distanceToSegment } from '../src/game/riverGeometry.ts'

test('Babylonia has five river-led states plus Nicanor’s Zagros district and a single merged lower-country district',()=>{
  const game=createInitialState(),province=game.provinces.find(p=>p.id==='babylonia')!
  assert.deepEqual([...province.stateIds].sort(),['babylon','chaldaea','diyala','nippur','sippar','zagros'])
  for(const id of ['ur','uruk']){
    assert.ok(!game.states.some(s=>s.id===id))
    assert.ok(!(id in stateRings)&&!(id in stateLand))
    assert.ok(!babyloniaScenery.some(p=>p.asset==='settlement'&&p.stateId===id))
  }
  for(const [id,stateId] of [['ur-city','chaldaea'],['uruk-city','nippur'],['larsa-city','nippur']]){
    const place=game.settlements.find(p=>p.id===id)!
    assert.equal(place.stateId,stateId)
    assert.equal(territoryAt([place.x,place.y],game.states)?.state.id,stateId)
  }
  assert.equal(income(game),106);assert.equal(game.treasury,228)
  assert.equal(game.states.filter(s=>s.owner==='babylon').length,10)
  assert.equal(victoryTarget(game),26)
  for(const id of province.stateIds.filter(id=>id!=='zagros'))assert.ok(movementPath(game,id),`${id}: reachable friendly district`)
})

test('western Babylon, expanded Sippar and the remaining interfluve resolve to their intended states',()=>{
  const game=createInitialState()
  for(const [at,id] of [
    [[43.8,32.12],'babylon'],[[44,32],'babylon'],[[43.8,31.95],'babylon'],[[44.25,31.94],'babylon'], // former western Nippur peninsula
    [[44.8,34],'sippar'],[[45.1,34.25],'sippar'], // former northwestern Diyala
    [[45.35,33.5],'diyala'],[[46.2,33.2],'diyala'],
    [[45.7,32],'nippur'],[[45.8,31.8],'nippur'],
    [[44.25,30.93],'chaldaea'],[[47.1,30.45],'chaldaea'],
  ] as const)assert.equal(territoryAt(project(at),game.states)?.state.id,id,`${at}: incorrect district`)
})

test('Diyala divides the northwestern river country and joins the Tigris without a political gap',()=>{
  const river=coreRivers.find(r=>r.id==='diyala')!
  const mouth=project(diyalaTributaryBank.at(-1)!)
  assert.ok(distanceToSegment(mouth,river.mapLines[0].at(-2)!,river.mapLines[0].at(-1)!).distance<.001)
  assert.deepEqual(middleTigrisBank[0],diyalaTributaryBank.at(-1))
  const tigris=coreRivers.find(r=>r.id==='tigris')!
  assert.ok(tigris.mapLines.some(line=>line.slice(1).some((b,i)=>distanceToSegment(mouth,line[i],b).distance<.001)))
  const game=createInitialState()
  // Probe either bank along the northern tributary, below the province frontage.
  for(let i=5;i<diyalaTributaryBank.length-2;i++){
    const a=project(diyalaTributaryBank[i]),b=project(diyalaTributaryBank[i+1])
    const length=Math.hypot(b[0]-a[0],b[1]-a[1])
    const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2]
    const at=(side:number)=>[mid[0]-side*(b[1]-a[1])/length*1.5,mid[1]+side*(b[0]-a[0])/length*1.5] as const
    assert.equal(territoryAt(at(1),game.states)?.state.id,'sippar')
    assert.equal(territoryAt(at(-1),game.states)?.state.id,43-(mid[1]-35)/40>33.87?'zagros':'diyala','Zagros takes the upper eastern bank; Diyala retains the lower basin')
  }
})

test('Chaldaea ends at the Euphrates without a settlement detour or western Nippur sliver',()=>{
  const game=createInitialState()
  const bank=coreRivers.find(r=>r.id==='euphrates')!.mapLines
  for(const line of bank)for(let i=1;i<line.length;i++){
    const a=line[i-1],b=line[i]
    if(a[0]<project([44.55,31])[0]||a[0]>project([47.3,31])[0])continue
    const length=Math.hypot(b[0]-a[0],b[1]-a[1])
    const middle=[(a[0]+b[0])/2,(a[1]+b[1])/2]
    const north=[middle[0]+(b[1]-a[1])/length*.7,middle[1]-(b[0]-a[0])/length*.7] as const
    const south=[middle[0]-(b[1]-a[1])/length*.7,middle[1]+(b[0]-a[0])/length*.7] as const
    assert.equal(territoryAt(north,game.states)?.state.id,'nippur',`North bank ${north}`)
    assert.equal(territoryAt(south,game.states)?.state.id,'chaldaea',`South bank ${south}`)
  }
  const nippur=stateLand.nippur.flatMap(poly=>poly[0])
  assert.ok(nippur.every(p=>p[0]>=project([44.47,31])[0]),'Nippur has no western mainland tongue')
})
