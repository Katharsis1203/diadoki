import test from 'node:test'
import assert from 'node:assert/strict'
import { clipGroundRing, clipGroundSegment, groundGeometry } from '../src/game/groundGeometry.ts'
import { isPhysicalLand, linearPathRings, pointInPhysicalRing } from '../src/game/physicalLand.ts'
import { GROUND_CACHE_BYTES, GROUND_TILE_BLEED, GROUND_TILE_PIXELS, GroundTileCache, groundTileFromKey, planGroundTiles } from '../src/game/groundTiles.ts'
import type { GroundTexture, GroundTile, GroundTilePainter } from '../src/game/groundTiles.ts'
import type { MapPoint } from '../src/game/mapProjection.ts'

const tile=(x:number)=>groundTileFromKey(`province:1:${x}:0`)
const waitUntil=async(predicate:()=>boolean)=>{
  const limit=Date.now()+2000
  while(!predicate()){
    assert.ok(Date.now()<limit,'cache did not settle')
    await new Promise(resolve=>setTimeout(resolve,1))
  }
}
const texture=(key:string,released:string[],bytes=100):GroundTexture=>({href:key,bytes,release:()=>released.push(key)})

test('clipped ground preserves land, islands and lake holes throughout the theatre',()=>{
  for(const [x,y] of [[-490,60],[-150,180],[100,570],[600,370],[650,0],[1850,520]]){
    const box={left:x-90,right:x+90,top:y-90,bottom:y+90}
    const rings=linearPathRings(groundGeometry(box).landPath)
    for(let py=box.top+2;py<box.bottom;py+=7)for(let px=box.left+2;px<box.right;px+=7){
      const p:MapPoint=[px,py]
      const inside=rings.reduce((inside,ring)=>inside!==pointInPhysicalRing(p,ring),false)
      assert.equal(inside,isPhysicalLand(p),`land parity at ${p}`)
    }
  }
  assert.equal(groundGeometry({left:600,right:650,top:350,bottom:400}).coastPath,'','an inland rectangle must not acquire a coastline')
})

test('rectangle clipping preserves disconnected portions of a concave coast without new shore strokes',()=>{
  const ring:MapPoint[]=[[0,0],[10,0],[10,2],[2,2],[2,8],[10,8],[10,10],[0,10]]
  const box={left:4,right:8,top:1,bottom:9},clipped=clipGroundRing(ring,box)
  for(const p of [[5,1.5],[5,5],[5,8.5]] as MapPoint[])assert.equal(pointInPhysicalRing(p,clipped),pointInPhysicalRing(p,ring))
  assert.deepEqual(clipGroundSegment([-5,5],[15,5],{left:0,right:10,top:0,bottom:10}),[[0,5],[10,5]])
  assert.equal(clipGroundSegment([-5,-1],[15,-1],box),null)
  assert.equal(clipGroundSegment([2,3],[2,7],box),null)
})

test('stable tiles cover negative coordinates and keep high-DPI demand within the decoded budget',()=>{
  for(const scale of [.2,1,3,12])for(const ratio of [1,1.5,3]){
    const view={left:-135/scale,right:(3840-135)/scale,top:-81/scale,bottom:(2160-81)/scale}
    const tiles=planGroundTiles(view,scale,ratio,'province')
    assert.ok(tiles.length*(GROUND_TILE_PIXELS+2*GROUND_TILE_BLEED)**2*4<=GROUND_CACHE_BYTES*.75)
    for(const p of [[view.left+.001,view.top+.001],[view.right-.001,view.bottom-.001]] as MapPoint[]){
      assert.ok(tiles.some(t=>p[0]>=t.x&&p[0]<t.x+t.size&&p[1]>=t.y&&p[1]<t.y+t.size))
    }
    for(const t of tiles)assert.deepEqual(groundTileFromKey(t.key),t)
  }
  const view={left:8,right:100,top:8,bottom:100}
  assert.deepEqual(planGroundTiles(view,1,1,'province'),planGroundTiles({...view,left:9,right:101},1,1,'province'))
  assert.notEqual(planGroundTiles(view,1,1,'province')[0].key,planGroundTiles(view,1,1,'state')[0].key)
})

test('cached textures survive camera returns and evict old regions within a hard memory budget',async()=>{
  const released:string[]=[],painted:string[]=[]
  const cache=new GroundTileCache(async t=>{painted.push(t.key);return texture(t.key,released)},200)
  cache.activate()
  try{
    for(const t of [tile(0),tile(1),tile(0),tile(2)]){cache.setDemand([t]);await waitUntil(()=>cache.ready([t]))}
    assert.deepEqual(painted,[tile(0).key,tile(1).key,tile(2).key])
    assert.deepEqual(released,[tile(1).key])
    assert.equal(cache.stats.bytes,200)
    assert.ok(cache.texture(tile(0).key))
  }finally{cache.dispose()}
  assert.equal(released.length,3)
  assert.equal(cache.stats.bytes,0)
})

test('changing demand cancels obsolete queued work and releases an obsolete in-flight bitmap',async()=>{
  const released:string[]=[],started:string[]=[]
  let complete:((value:GroundTexture)=>void)|undefined
  const painter:GroundTilePainter=t=>{
    started.push(t.key)
    return t.key===tile(0).key?new Promise(resolve=>{complete=resolve}):Promise.resolve(texture(t.key,released))
  }
  const cache=new GroundTileCache(painter)
  cache.activate();cache.setDemand([tile(0),tile(1)])
  try{
    await waitUntil(()=>!!complete)
    cache.setDemand([tile(2)])
    complete!(texture(tile(0).key,released))
    await waitUntil(()=>cache.ready([tile(2)]))
    assert.deepEqual(started,[tile(0).key,tile(2).key])
    assert.deepEqual(released,[tile(0).key])
    assert.equal(cache.stats.entries,1)
  }finally{cache.dispose()}
})

test('disposal and React-style reactivation cannot publish a stale in-flight bitmap',async()=>{
  const released:string[]=[],completions:((value:GroundTexture)=>void)[]=[]
  const cache=new GroundTileCache(()=>new Promise(resolve=>completions.push(resolve)))
  cache.activate();cache.setDemand([tile(0)])
  await waitUntil(()=>completions.length===1)
  cache.dispose();cache.activate();cache.setDemand([tile(0)])
  completions[0](texture('old',released))
  await waitUntil(()=>completions.length===2)
  assert.equal(cache.ready([tile(0)]),false)
  completions[1](texture('new',released))
  await waitUntil(()=>cache.ready([tile(0)]))
  assert.deepEqual(released,['old'])
  assert.equal(cache.texture(tile(0).key)?.href,'new')
  cache.dispose();assert.deepEqual(released,['old','new'])
})

test('failed raster jobs keep vector fallback without retrying on every render',async()=>{
  let attempts=0
  const cache=new GroundTileCache(async()=>{attempts++;throw new Error('unsupported raster')})
  cache.activate();cache.setDemand([tile(0)])
  try{
    await waitUntil(()=>attempts===1)
    cache.setDemand([tile(0)])
    await new Promise(resolve=>setTimeout(resolve,15))
    assert.equal(attempts,1)
    assert.equal(cache.ready([tile(0)]),false)
    assert.equal(cache.stats.bytes,0)
    cache.setDemand([]);cache.setDemand([tile(0)])
    await waitUntil(()=>attempts===2)
  }finally{cache.dispose()}
})

test('oversized visible demand falls back rather than exceeding the cache budget',async()=>{
  const released:string[]=[]
  const cache=new GroundTileCache(async(t:GroundTile)=>texture(t.key,released,101),100)
  cache.activate();cache.setDemand([tile(0)])
  try{
    await waitUntil(()=>released.length===1)
    assert.equal(cache.ready([tile(0)]),false)
    assert.equal(cache.stats.bytes,0)
  }finally{cache.dispose()}
})

test('parallel prepared loading respects demand order, pool size and decode reservations',async()=>{
  const small=(x:number)=>({...tile(x),size:8,resolution:1})
  const tiles=[0,1,2,3,4].map(small),released:string[]=[],started:string[]=[]
  const completions=new Map<string,(value:GroundTexture)=>void>()
  const cache=new GroundTileCache(t=>new Promise(resolve=>{started.push(t.key);completions.set(t.key,resolve)}),8192,3)
  const bounded=()=>{assert.ok(cache.stats.active<=3);assert.ok(cache.stats.bytes+cache.stats.reservedBytes<=8192)}
  const unsubscribe=cache.subscribe(bounded)
  cache.activate();cache.setDemand(tiles)
  try{
    await waitUntil(()=>started.length===3)
    assert.deepEqual(started,tiles.slice(0,3).map(t=>t.key));bounded()
    assert.equal(cache.stats.reservedBytes,3*1024)
    completions.get(tiles[1].key)!(texture(tiles[1].key,released,1024))
    await waitUntil(()=>started.length===4);bounded()
    for(const t of [tiles[0],tiles[2],tiles[3]])completions.get(t.key)!(texture(t.key,released,1024))
    await waitUntil(()=>started.length===5)
    completions.get(tiles[4].key)!(texture(tiles[4].key,released,1024))
    await waitUntil(()=>cache.ready(tiles));bounded()
    assert.equal(cache.stats.bytes,5*1024)
    assert.equal(cache.stats.reservedBytes,0)
  }finally{unsubscribe();cache.dispose()}
  assert.equal(released.length,5)
})

test('obsolete parallel jobs abort and a late rejection cannot poison a replacement of the same key',async()=>{
  const released:string[]=[],signals:AbortSignal[]=[],rejects:((error:Error)=>void)[]=[],completions:((value:GroundTexture)=>void)[]=[]
  const cache=new GroundTileCache((_t,signal)=>new Promise((resolve,reject)=>{signals.push(signal!);completions.push(resolve);rejects.push(reject)}))
  cache.activate();cache.setDemand([tile(0)])
  try{
    await waitUntil(()=>signals.length===1)
    cache.setDemand([]);cache.setDemand([tile(0)])
    assert.equal(signals[0].aborted,true)
    rejects[0](new Error('obsolete download rejected late'))
    await waitUntil(()=>signals.length===2)
    assert.equal(cache.stats.failed,0)
    completions[1](texture('replacement',released))
    await waitUntil(()=>cache.ready([tile(0)]))
    assert.equal(cache.texture(tile(0).key)?.href,'replacement')
  }finally{cache.dispose()}
  assert.deepEqual(released,['replacement'])
})

test('parallel disposal releases stale textures and retains the pool limit through reactivation',async()=>{
  const released:string[]=[],completions:((value:GroundTexture)=>void)[]=[],signals:AbortSignal[]=[]
  const cache=new GroundTileCache((_t,signal)=>new Promise(resolve=>{signals.push(signal!);completions.push(resolve)}),GROUND_CACHE_BYTES,3)
  cache.activate();cache.setDemand([tile(0),tile(1),tile(2)])
  await waitUntil(()=>completions.length===3)
  cache.dispose();assert.ok(signals.every(s=>s.aborted))
  cache.activate();cache.setDemand([tile(3)])
  completions[0](texture('stale-0',released));completions[1](texture('stale-1',released));completions[2](texture('stale-2',released))
  try{
    await waitUntil(()=>completions.length===4)
    assert.equal(cache.stats.bytes,0)
    assert.ok(cache.stats.active<=3)
    completions[3](texture('new',released));await waitUntil(()=>cache.ready([tile(3)]))
  }finally{cache.dispose()}
  assert.deepEqual(released,['stale-0','stale-1','stale-2','new'])
})
