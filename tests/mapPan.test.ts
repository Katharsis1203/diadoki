import test from 'node:test'
import assert from 'node:assert/strict'
import { PAN_OVERSCAN, panSceneCamera, panTranslation } from '../src/game/mapPan.ts'
import { cameraPan, mapProjection } from '../src/game/mapProjection.ts'
import { clampMapCamera } from '../src/game/mapView.ts'

test('retained map translation matches canonical panning at desktop and mobile scales',()=>{
  const scene={x:584,y:497,zoom:2.3},projection=mapProjection(true)
  for(const scale of [.25,.7,1,3,12])for(const [dx,dy] of [[75,-61],[-85,43],[0,0]]){
    const [panX,panY]=cameraPan(dx,dy,scale,projection)
    const camera={...scene,x:scene.x-panX,y:scene.y-panY}
    const shift=panTranslation(scene,camera,scale)
    assert.ok(Math.abs(shift.x-dx)<1e-8)
    assert.ok(Math.abs(shift.y-dy)<1e-8)
    const anchor=projection.point([610,525])
    const original=projection.point([scene.x,scene.y]),moved=projection.point([camera.x,camera.y])
    assert.ok(Math.abs((anchor[0]-original[0])*scale+shift.x-(anchor[0]-moved[0])*scale)<1e-8)
    assert.ok(Math.abs((anchor[1]-original[1])*scale+shift.y-(anchor[1]-moved[1])*scale)<1e-8)
  }
})

test('small drags retain the scene while large jumps refresh before buffered artwork runs out',()=>{
  const scene={x:584,y:497,zoom:2.3}
  for(const overscan of [80,PAN_OVERSCAN])for(const scale of [.4,2,8]){
    for(const [dx,dy] of [[overscan*.7,0],[0,-overscan*.7]]){
      const [x,y]=cameraPan(dx,dy,scale,mapProjection(true))
      const camera={...scene,x:scene.x-x,y:scene.y-y}
      assert.equal(panSceneCamera(scene,camera,true,scale,overscan),scene)
    }
    for(const [dx,dy] of [[overscan,0],[0,-overscan],[overscan*10,overscan*10]]){
      const [x,y]=cameraPan(dx,dy,scale,mapProjection(true))
      const camera={...scene,x:scene.x-x,y:scene.y-y}
      assert.equal(panSceneCamera(scene,camera,true,scale,overscan),camera)
    }
  }
})

test('release, zoom and camera limits preserve the exact current camera',()=>{
  const scene={x:584,y:497,zoom:2.3},moved={...scene,x:580,y:490}
  assert.equal(panSceneCamera(scene,moved,false,3,PAN_OVERSCAN),moved)
  assert.equal(panSceneCamera(scene,{...scene},false,3,PAN_OVERSCAN),scene)
  const zoomed={...moved,zoom:4}
  assert.equal(panSceneCamera(scene,zoomed,true,5,PAN_OVERSCAN),zoomed)
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const bounded=clampMapCamera({...scene,x:-10000,y:10000},viewport,true)
    const refreshed=panSceneCamera(scene,bounded,true,3,PAN_OVERSCAN)
    assert.deepEqual(refreshed,bounded)
    assert.deepEqual(panTranslation(refreshed,bounded,3),{x:0,y:0})
  }
})
