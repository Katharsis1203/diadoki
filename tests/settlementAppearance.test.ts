import test from 'node:test'
import assert from 'node:assert/strict'
import { DEVELOPMENT_POINT_THRESHOLDS, settlementAppearance } from '../src/game/settlementAppearance.ts'
import { createInitialState } from '../src/game/data.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { babyloniaScenery, sceneryObjects } from '../src/game/babyloniaScenery.ts'

test('development thresholds and adapted market levels increase visual size without changing capital status',()=>{
  for(const [value,tier] of [[0,'homestead'],[2,'homestead'],[3,'village'],[9,'village'],[10,'fortress'],[19,'fortress'],[20,'city']] as const)
    assert.equal(settlementAppearance(value,false,DEVELOPMENT_POINT_THRESHOLDS).tier,tier)
  const tiers=[0,1,2,3].map(value=>settlementAppearance(value,false))
  assert.deepEqual(tiers.map(p=>p.tier),['homestead','village','fortress','city'])
  assert.ok(tiers.every((p,i)=>i===0||p.scale>tiers[i-1].scale))
  for(const value of [0,1,2,3,25])assert.deepEqual(settlementAppearance(value,true),{tier:'city',scale:.72})
})

test('artwork reads live market development, ignores fort investment and leaves gameplay and anchors untouched',()=>{
  const game=createInitialState(),before=JSON.stringify(game),placements=JSON.stringify(babyloniaScenery)
  const tier=(market:number,fort:number)=>{
    const states=game.states.map(s=>s.id==='nippur'?{...s,buildings:{market,fort}}:s)
    const centre=sceneryObjects(mapProjection(true),2.5,3,'province',states).find(o=>o.placement.asset==='settlement'&&o.placement.stateId==='nippur')!
    assert.deepEqual(centre.placement.position,babyloniaScenery.find(p=>p.id==='nippur-centre')!.position)
    return centre.placement.asset==='settlement'?centre.placement.tier:undefined
  }
  assert.equal(tier(0,0),'homestead');assert.equal(tier(0,9),'homestead')
  assert.equal(tier(1,0),'village');assert.equal(tier(2,0),'fortress');assert.equal(tier(3,0),'city')
  assert.equal(JSON.stringify(game),before);assert.equal(JSON.stringify(babyloniaScenery),placements)
})
