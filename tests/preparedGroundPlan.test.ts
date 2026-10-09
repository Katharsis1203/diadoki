import test from 'node:test'
import assert from 'node:assert/strict'
import { planPreparedGround, preparedTileBytes, coarseGroundKey } from '../src/game/preparedGroundPlan.ts'
import { GROUND_CACHE_BYTES } from '../src/game/groundTiles.ts'
import { mapBounds } from '../src/game/worldTerrain.ts'

test('prepared loading prioritises visible coarse coverage and visible detail before buffer and neighbours',()=>{
  const visible={left:20,right:80,top:20,bottom:80},view={left:-100,right:200,top:-100,bottom:200}
  const plan=planPreparedGround(view,visible,'province',2)
  assert.equal(plan.demand[0].key,'province:0.5:0:0')
  assert.equal(plan.demand[1].key,'province:2:0:0')
  assert.ok(plan.prefetch.length>0)
  for(const tile of plan.tiles){
    assert.ok(plan.demand.some(t=>t.key===tile.key))
    assert.ok(plan.demand.some(t=>t.key===coarseGroundKey(tile)))
    assert.ok(plan.demand.indexOf(tile)<plan.demand.indexOf(plan.prefetch[0]))
  }
  assert.equal(new Set(plan.demand.map(t=>t.key)).size,plan.demand.length)
})

test('coarse theatre coverage and neighbour prefetch remain inside the shared decoded budget',()=>{
  for(const level of ['dominion','province','state'] as const)for(const resolution of [.2,1,2,8])for(const view of [mapBounds,{left:20,right:80,top:20,bottom:80},{left:-700,right:1500,top:-180,bottom:800}]){
    const plan=planPreparedGround(view,view,level,resolution)
    assert.equal(plan.bytes,plan.demand.reduce((sum,tile)=>sum+preparedTileBytes(tile),0))
    assert.ok(plan.bytes<=GROUND_CACHE_BYTES*.875)
    assert.ok(plan.demand.every(tile=>tile.level===level))
    for(let y=mapBounds.top+1;y<mapBounds.bottom;y+=51)for(let x=mapBounds.left+1;x<mapBounds.right;x+=57){
      assert.ok(plan.demand.some(t=>t.resolution===.5&&x>=t.x&&x<t.x+t.size&&y>=t.y&&y<t.y+t.size))
    }
  }
})

test('prepared demand is deterministic and blank margins request no artwork',()=>{
  const view={left:20,right:80,top:20,bottom:80}
  assert.deepEqual(planPreparedGround(view,view,'province',2),planPreparedGround({...view},{...view},'province',2))
  const outside={left:mapBounds.right+100,right:mapBounds.right+200,top:20,bottom:80}
  assert.deepEqual(planPreparedGround(outside,outside,'province',2),{tiles:[],demand:[],prefetch:[],bytes:0})
})
