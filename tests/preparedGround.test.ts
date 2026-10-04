import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { mapBounds } from '../src/game/worldTerrain.ts'
import { preparedGroundTiles, PREPARED_GROUND_LEVELS, PREPARED_GROUND_RESOLUTIONS } from '../src/game/preparedGroundLayout.ts'
import { preparedGroundManifest } from '../src/game/preparedGroundManifest.ts'
import { groundTileClip, GROUND_TILE_BLEED, GROUND_CACHE_BYTES } from '../src/game/groundTiles.ts'
import { groundArtworkFingerprint } from '../scripts/ground-artwork-inputs.mjs'

const region=(x:number,y:number)=>({left:x+1,right:x+5,top:y+1,bottom:y+5})
test('prepared artwork covers every theatre chunk/detail profile and matches the painter sources',()=>{
  assert.equal(preparedGroundManifest.fingerprint,groundArtworkFingerprint())
  let count=0
  for(const level of PREPARED_GROUND_LEVELS)for(const resolution of PREPARED_GROUND_RESOLUTIONS){
    const tiles=preparedGroundTiles([mapBounds],level,resolution,false)
    for(const tile of tiles){
      const file=preparedGroundManifest.files[tile.key]
      assert.equal(path.basename(file),file)
      const bytes=fs.readFileSync(path.join('public/textures/ground',file))
      assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a')
      assert.equal(bytes.readUInt32BE(16),tile.size*resolution+2*GROUND_TILE_BLEED)
      assert.equal(bytes.readUInt32BE(20),tile.size*resolution+2*GROUND_TILE_BLEED)
      const digest=createHash('sha256').update(bytes).digest('hex').slice(0,16)
      assert.equal(file,`${tile.key.replaceAll(':','_')}-${digest}.png`)
      count++
    }
    for(let y=mapBounds.top+.1;y<mapBounds.bottom;y+=19)for(let x=mapBounds.left+.1;x<mapBounds.right;x+=23){
      assert.ok(tiles.some(t=>x>=t.x&&x<t.x+t.size&&y>=t.y&&y<t.y+t.size),`missing artwork at ${x},${y}`)
    }
  }
  assert.equal(count,Object.keys(preparedGroundManifest.files).length)
})
test('prepared artwork demand reserves cache headroom and uses coarse images for wide views',()=>{
  const decodedBytes=(tiles:ReturnType<typeof preparedGroundTiles>)=>tiles.reduce((total,tile)=>total+(tile.size*tile.resolution+2*GROUND_TILE_BLEED)**2*4,0)
  for(const level of PREPARED_GROUND_LEVELS){
    const unbounded=preparedGroundTiles([mapBounds],level,2,false)
    assert.ok(decodedBytes(unbounded)>GROUND_CACHE_BYTES*.75)
    const overview=preparedGroundTiles([mapBounds,mapBounds],level,2)
    assert.ok(overview.every(tile=>tile.resolution===.5))
    assert.ok(decodedBytes(overview)<=GROUND_CACHE_BYTES*.75)
    const close=preparedGroundTiles([region(20,20)],level,2)
    assert.ok(close.every(tile=>tile.resolution===2))
    assert.ok(decodedBytes(close)<=GROUND_CACHE_BYTES*.75)
    assert.equal(overview.length,unbounded.length)
    assert.deepEqual(overview.map(({x,y,size})=>({x,y,size})),unbounded.map(({x,y,size})=>({x,y,size})))
  }
})
test('prepared chunks are stable, deduplicated and selected only inside the crop',()=>{
  const a=region(-300,20),b=region(20,20)
  assert.deepEqual(preparedGroundTiles([a], 'province',2),preparedGroundTiles([{...a,left:a.left+1}], 'province',32))
  const combined=preparedGroundTiles([a,b,a], 'province',1)
  assert.equal(combined.length,2)
  assert.equal(new Set(combined.map(t=>t.key)).size,2)
  assert.deepEqual(preparedGroundTiles([{left:mapBounds.right+1,right:mapBounds.right+10,top:0,bottom:10}], 'province',1),[])
  assert.ok(preparedGroundTiles([a], 'dominion',.25).every(t=>t.resolution===.5&&t.level==='dominion'))
})
test('prepared ground clips keep adjacent map chunks aligned at fractional pan, zoom and high DPI',()=>{
  const [a,b]=preparedGroundTiles([{left:1,right:900,top:1,bottom:400}], 'province',1)
  for(const ratio of [1,1.5,3])for(const scale of [.27,1.45,9.5]){
    const camera={x:411.85,y:321.93},size={width:1440,height:900}
    const first=groundTileClip(a,camera,scale,.84,size,ratio),second=groundTileClip(b,camera,scale,.84,size,ratio)
    assert.equal(first.right,second.left)
    assert.equal(first.top,second.top)
    assert.equal(first.bottom,second.bottom)
  }
})
