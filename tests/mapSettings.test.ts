import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_MAP_SETTINGS, LIGHT_MAP_SETTINGS, parseMapSettings } from '../src/game/mapSettings.ts'
import { createInitialState } from '../src/game/data.ts'
import { sceneryObjects } from '../src/game/babyloniaScenery.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { prepareMapScene } from '../src/game/mapScene.ts'
import { GroundTileCache, groundTileFromKey, planGroundTiles, groundTileClip } from '../src/game/groundTiles.ts'
import type { GroundTexture } from '../src/game/groundTiles.ts'

const waitUntil=async(predicate:()=>boolean)=>{
  const deadline=Date.now()+2000
  while(!predicate()){assert.ok(Date.now()<deadline,'cache did not settle');await new Promise(resolve=>setTimeout(resolve,1))}
}
test('display preferences tolerate corrupt or outdated storage and retain safe defaults',()=>{
  for(const raw of [null,'invalid','[]','null','2'])assert.deepEqual(parseMapSettings(raw),DEFAULT_MAP_SETTINGS)
  assert.deepEqual(parseMapSettings('{"mountains":false,"labels":"false","unknown":true}'),{...DEFAULT_MAP_SETTINGS,mountains:false})
  const saved=parseMapSettings(JSON.stringify(LIGHT_MAP_SETTINGS))
  assert.deepEqual(saved,LIGHT_MAP_SETTINGS)
  saved.labels=false
  assert.equal(DEFAULT_MAP_SETTINGS.labels,true)
  assert.equal(LIGHT_MAP_SETTINGS.labels,true)
})
test('switching visual layers omits artwork and label preparation without changing campaign content',()=>{
  const game=createInitialState(),before=JSON.stringify(game),projection=mapProjection(true)
  const full=sceneryObjects(projection,2.5,3,'state',game.states)
  assert.ok(full.some(s=>s.placement.asset==='mountain'))
  assert.ok(full.some(s=>s.placement.asset==='trees'))
  assert.equal(full.filter(s=>s.placement.asset==='settlement').length,7)
  const bare={...DEFAULT_MAP_SETTINGS,mountains:false,vegetation:false,settlements:false,labels:false}
  assert.deepEqual(sceneryObjects(projection,2.5,3,'state',game.states,bare),[])
  for(const level of ['province','dominion','state'] as const){
    const scene=prepareMapScene(game,projection,2.5,3,level,true,true,bare)
    assert.deepEqual(scene.labels,[]);assert.deepEqual(scene.dominionLabels,[]);assert.deepEqual(scene.localDetails,[])
    assert.deepEqual(scene.objects,[])
    assert.equal(scene.simpleCentres.length,level==='dominion'?0:7,'Every primary centre has a simplified replacement')
    assert.equal(scene.provinceSeats.length,10,'Primary centre markers remain available')
  }
  const mountainsOff=sceneryObjects(projection,2.5,3,'state',game.states,{...DEFAULT_MAP_SETTINGS,mountains:false})
  assert.ok(mountainsOff.some(s=>s.placement.asset==='trees'))
  assert.ok(!mountainsOff.some(s=>['mountain','hill'].includes(s.placement.asset)))
  assert.equal(JSON.stringify(game),before)
})
test('plain and shaded ground textures have distinct identities with identical geographic coverage',()=>{
  const view={left:-50,right:460,top:10,bottom:500}
  const shaded=planGroundTiles(view,1,1,'province'),plain=planGroundTiles(view,1,1,'province',undefined,false)
  assert.equal(shaded.length,plain.length)
  for(let i=0;i<plain.length;i++){
    assert.notEqual(plain[i].key,shaded[i].key)
    assert.equal(plain[i].shading,false)
    assert.deepEqual(groundTileFromKey(plain[i].key),plain[i])
    for(const property of ['x','y','size','resolution'] as const)assert.equal(plain[i][property],shaded[i][property])
  }
})
test('new tile demand retains decoded ground and publishes progress before the full window is ready',async()=>{
  const a=groundTileFromKey('province:1:0:0'),b=groundTileFromKey('province:1:1:0')
  let finish:((texture:GroundTexture)=>void)|undefined,notifications=0,releases=0
  const bitmap=(id:string):GroundTexture=>({href:id,bytes:100,release:()=>releases++})
  const cache=new GroundTileCache(t=>t.key===a.key?Promise.resolve(bitmap(a.key)):new Promise(resolve=>{finish=resolve}))
  const unsubscribe=cache.subscribe(()=>notifications++)
  cache.activate();cache.setDemand([a])
  try{
    await waitUntil(()=>cache.ready([a]))
    const retained=cache.texture(a.key),version=cache.version
    cache.setDemand([a,b]);await waitUntil(()=>!!finish)
    assert.equal(cache.ready([a,b]),false)
    assert.equal(cache.texture(a.key),retained)
    assert.equal(releases,0)
    finish!(bitmap(b.key));await waitUntil(()=>cache.ready([a,b]))
    assert.ok(cache.version>version)
    assert.equal(notifications,2)
  }finally{unsubscribe();cache.dispose()}
  assert.equal(releases,2)
})
test('bitmap and fallback rectangles share exact device-pixel seams under fractional pan and zoom',()=>{
  for(const ratio of [1,1.5,3])for(const scale of [.39,1.27,4.3]){
    const camera={x:641.231,y:398.671},size={width:1440,height:900}
    const a=groundTileFromKey('province:1:-1:0'),b=groundTileFromKey('province:1:0:0'),c=groundTileFromKey('province:1:0:1')
    const first=groundTileClip(a,camera,scale,.84,size,ratio),second=groundTileClip(b,camera,scale,.84,size,ratio),below=groundTileClip(c,camera,scale,.84,size,ratio)
    assert.equal(first.right,second.left);assert.equal(second.bottom,below.top)
    assert.ok(first.right>first.left&&first.bottom>first.top)
  }
})
