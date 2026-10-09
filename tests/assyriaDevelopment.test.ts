import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState, project } from '../src/game/data.ts'
import { gameReducer } from '../src/game/engine.ts'
import { pointInState } from '../src/game/geography.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { sceneryObjects } from '../src/game/babyloniaScenery.ts'
import { assyriaScenery } from '../src/game/assyriaScenery.ts'
import { assyriaTerrainFeatures, assyriaWaterways } from '../src/game/assyriaTerrain.ts'
import { assyriaBoundaryCuts } from '../src/game/assyriaGeography.ts'
import { coreRivers } from '../src/game/terrainBackbone.ts'
import { prepareMapScene } from '../src/game/mapScene.ts'
import { DEFAULT_MAP_SETTINGS } from '../src/game/mapSettings.ts'

const ids=['upper-euphrates','nisibis','nineveh','arbela','assur']
test('Assyria has one centre per state, one capital and restrained state-clipped terrain',()=>{
  const game=createInitialState(),centres=assyriaScenery.filter(p=>p.asset==='settlement'),province=game.provinces.find(p=>p.id==='assyria')!
  assert.deepEqual(centres.map(p=>p.stateId).sort(),[...province.stateIds].sort())
  assert.deepEqual(centres.filter(p=>p.isCapital).map(p=>p.settlementId),[province.mainSettlementId])
  for(const id of ids){
    const state=game.states.find(s=>s.id===id)!,centre=centres.find(p=>p.stateId===id)!
    assert.deepEqual(state.settlementIds,[centre.settlementId])
    assert.equal(centre.name,state.name)
    assert.ok(pointInState(centre.position,id))
    assert.ok(state.landscape)
  }
  for(const object of assyriaScenery)assert.ok(pointInState(object.position,object.asset==='settlement'?object.stateId:object.id.startsWith('nisibis')?'nisibis':object.id.startsWith('nineveh')?'nineveh':object.id.startsWith('arbela')?'arbela':'assur'),object.id)
  for(const f of [...assyriaTerrainFeatures,...assyriaWaterways]){
    assert.ok(ids.includes(f.stateId!))
    assert.ok(f.opacity<=.5&&f.width<=15)
    for(const at of f.points)assert.ok(pointInState(project(at),f.stateId!),f.id)
  }
  assert.equal(game.treasury,228)
  assert.equal(game.states.filter(s=>s.owner==='babylon').length,10)
})

test('Assyria state names stay attached to their own centres with artwork enabled or disabled',()=>{
  const game=createInitialState(),projection=mapProjection(true)
  for(const settlements of [true,false])for(const level of ['province','state'] as const){
    const scene=prepareMapScene({...game,selectedStateId:'nineveh'},projection,4.5,4.5,level,true,false,{...DEFAULT_MAP_SETTINGS,settlements})
    for(const id of ids){
      const state=game.states.find(s=>s.id===id)!,labels=scene.labels.filter(l=>l.text===state.name)
      assert.equal(labels.length,1)
      assert.equal(labels[0].id,id)
      assert.equal(labels[0].size,id==='nineveh'?17:15)
      assert.ok(scene.illustratedSeats.has(state.settlementIds[0]))
    }
    assert.equal(scene.labels.find(l=>l.id==='nineveh')!.priority,10)
  }
})

test('Assyria Zab cuts reuse the displayed water axes rather than unrelated scenery positions',()=>{
  for(const [pair,riverId] of [[['nineveh','arbela'],'greater-zab'],[['arbela','assur'],'lesser-zab']] as const){
    const cut=assyriaBoundaryCuts.find(c=>c.states[0]===pair[0]&&c.states[1]===pair[1])!
    const vertices=coreRivers.find(r=>r.id===riverId)!.mapLines.flat()
    const shared=cut.via.map(project).filter(p=>vertices.some(v=>Math.hypot(p[0]-v[0],p[1]-v[1])<.001))
    assert.ok(shared.length>=3,`${riverId}: boundary must share a substantial river reach`)
  }
})

test('capturing and developing Assur changes only its local settlement while Nineveh keeps its capital appearance',()=>{
  const initial=createInitialState(),projection=mapProjection(true),authored=JSON.stringify(assyriaScenery)
  let game=gameReducer(initial,{type:'selectState',id:'sippar'})
  game=gameReducer(game,{type:'move'})
  game=gameReducer(game,{type:'selectState',id:'assur'})
  game=gameReducer(game,{type:'invade'})
  game=gameReducer(game,{type:'resolve',plan:'assault'})
  assert.equal(game.states.find(s=>s.id==='assur')!.owner,'babylon')
  const verify=(expected:string)=>{
    const centres=sceneryObjects(projection,4.5,4.5,'state',game.states).filter(o=>o.placement.asset==='settlement'&&ids.includes(o.placement.stateId))
    assert.equal(centres.length,5)
    for(const object of centres){
      const p=object.placement
      if(p.asset!=='settlement')assert.fail('settlement expected')
      assert.equal(p.tier,p.stateId==='assur'?expected:p.isCapital?'city':'homestead')
      assert.deepEqual(p.position,assyriaScenery.find(a=>a.id===p.id)!.position)
    }
    const capital=centres.find(o=>o.placement.asset==='settlement'&&o.placement.isCapital)!
    assert.ok(centres.every(o=>o===capital||o.size<capital.size))
  }
  verify('homestead')
  game=gameReducer(game,{type:'endTurn'})
  game=gameReducer(game,{type:'fortify'});verify('homestead')
  game=gameReducer(game,{type:'develop'});verify('village')
  game=gameReducer(game,{type:'develop'});verify('fortress')
  game=gameReducer(game,{type:'endTurn'})
  game=gameReducer(game,{type:'develop'});verify('city')
  for(const id of ids.filter(id=>id!=='assur'))assert.deepEqual(game.states.find(s=>s.id===id)!.buildings,initial.states.find(s=>s.id===id)!.buildings)
  assert.equal(JSON.stringify(assyriaScenery),authored)
  assert.equal(initial.states.find(s=>s.id==='assur')!.buildings.market,0)
})
