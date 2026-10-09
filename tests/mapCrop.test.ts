import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createInitialState, project } from '../src/game/data.ts'
import { clampMapCamera, MAP_HEIGHT, MAP_WIDTH, worldOverviewCamera } from '../src/game/mapView.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { isPhysicalLand, physicalCoastLines, physicalLandRings } from '../src/game/physicalLand.ts'
import { mapBounds } from '../src/game/worldTerrain.ts'
import { GROUND_TILE_PIXELS, planGroundTiles } from '../src/game/groundTiles.ts'
import { clipGroundLine } from '../src/game/rectangleClip.ts'

const sizes=[{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}]

test('source crop preserves recorded land queries inside the Alps-to-Bengal theatre',()=>{
  // Recorded from the untrimmed coastline before this crop. Source vertices
  // inside the retained theatre must keep the same land/sea classification.
  let bits=''
  for(let lat=21;lat<48;lat+=.8)for(let lon=6;lon<93.5;lon+=.8)bits+=isPhysicalLand(project([lon,lat]))?'1':'0'
  assert.equal(bits.length,3740)
  assert.equal(createHash('sha256').update(bits).digest('hex'),'9f6141f1bded6f1212518d33ef3e215c8a5dddf72de5f215c6e122ce23af26cc')
  for(const at of [[2.35,48.9],[37.62,55.75],[32.5,15.6],[72.9,19.1],[96,22]] as const)assert.equal(isPhysicalLand(project(at)),false,`${at}: excluded land retained`)
})

test('embedded background contains only the crop while all playable state centres remain',()=>{
  assert.ok(physicalLandRings.length<100,'global islands must be omitted')
  for(const ring of physicalLandRings)for(const [x,y] of ring.points){
    assert.ok(x>=mapBounds.left-1e-6&&x<=mapBounds.right+1e-6)
    assert.ok(y>=mapBounds.top-1e-6&&y<=mapBounds.bottom+1e-6)
  }
  const game=createInitialState()
  assert.equal(game.states.length,50);assert.equal(game.provinces.length,11)
  for(const state of game.states)assert.ok(isPhysicalLand([state.labelX,state.labelY]),state.id)
})

test('crop cuts never become coastlines and disjoint shore reaches remain separate',()=>{
  for(const {points} of physicalCoastLines)for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i]
    for(const edge of [mapBounds.left,mapBounds.right])assert.ok(!(Math.abs(a[0]-edge)<1e-6&&Math.abs(b[0]-edge)<1e-6),'false vertical shore')
    for(const edge of [mapBounds.top,mapBounds.bottom])assert.ok(!(Math.abs(a[1]-edge)<1e-6&&Math.abs(b[1]-edge)<1e-6),'false horizontal shore')
  }
  assert.deepEqual(clipGroundLine([[-2,1],[2,1],[6,1],[6,3],[2,3],[-2,3]],{left:0,right:4,top:0,bottom:4}),[[[0,1],[2,1],[4,1]],[[4,3],[2,3],[0,3]]])
})

test('camera edge limits use screen-sized margins at every zoom, aspect and projection',()=>{
  for(const size of sizes)for(const perspective of [false,true])for(const zoom of [.2,.6,2.3,7])for(const sign of [-1,1]){
    const camera=clampMapCamera({x:sign*1e6,y:sign*1e6,zoom},size,perspective)
    const scale=Math.min(size.width/MAP_WIDTH,size.height/MAP_HEIGHT)*zoom,yScale=mapProjection(perspective).yScale
    const width=(mapBounds.right-mapBounds.left)*scale,height=(mapBounds.bottom-mapBounds.top)*scale*yScale
    assert.deepEqual(clampMapCamera(camera,size,perspective),camera,'clamp must be idempotent')
    assert.equal(camera.zoom,zoom)
    if(width<=size.width)assert.equal(camera.x,(mapBounds.left+mapBounds.right)/2)
    else{
      const left=size.width/2+(mapBounds.left-camera.x)*scale,right=size.width/2+(mapBounds.right-camera.x)*scale
      assert.ok(left<=32+1e-7&&right>=size.width-32-1e-7)
    }
    if(height<=size.height)assert.equal(camera.y,(mapBounds.top+mapBounds.bottom)/2)
    else{
      const top=size.height/2+(mapBounds.top-camera.y)*scale*yScale,bottom=size.height/2+(mapBounds.bottom-camera.y)*scale*yScale
      assert.ok(top<=32+1e-7&&bottom>=size.height-32-1e-7)
    }
  }
})

test('interior camera moves are untouched and constrained Overview fits the entire crop',()=>{
  const interior={x:584,y:497,zoom:3}
  for(const size of sizes)for(const perspective of [false,true]){
    assert.deepEqual(clampMapCamera(interior,size,perspective),interior)
    const camera=clampMapCamera(worldOverviewCamera(size,perspective),size,perspective)
    const scale=Math.min(size.width/MAP_WIDTH,size.height/MAP_HEIGHT)*camera.zoom,projection=mapProjection(perspective)
    for(const [x,y] of [[mapBounds.left,mapBounds.top],[mapBounds.right,mapBounds.bottom]]){
      const sx=size.width/2+(x-camera.x)*scale,sy=size.height/2+(y-camera.y)*scale*projection.yScale
      assert.ok(sx>0&&sx<size.width&&sy>0&&sy<size.height)
    }
  }
})

test('tile requests omit blank margins and distant regions while covering the retained crop',()=>{
  const large={left:-10000,right:10000,top:-10000,bottom:10000}
  const tiles=planGroundTiles(large,.5,1,'dominion',mapBounds)
  assert.ok(tiles.length<30)
  for(const t of tiles){
    assert.ok(t.x<mapBounds.right&&t.x+t.size>mapBounds.left&&t.y<mapBounds.bottom&&t.y+t.size>mapBounds.top)
  }
  for(const [x,y] of [[mapBounds.left+.1,mapBounds.top+.1],[mapBounds.right-.1,mapBounds.bottom-.1]])assert.ok(tiles.some(t=>x>=t.x&&x<t.x+t.size&&y>=t.y&&y<t.y+t.size))
  assert.deepEqual(planGroundTiles({left:10000,right:20000,top:10000,bottom:20000},1,1,'province',mapBounds),[])
  assert.ok(tiles.every(t=>t.size===GROUND_TILE_PIXELS/t.resolution))
})
