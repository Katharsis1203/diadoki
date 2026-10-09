import type { Camera } from './mapView.ts'
import { mapProjection } from './mapProjection.ts'

export const PAN_OVERSCAN=192
export const PAN_BUFFER_BYTES=32*1024*1024

// Bound extra RGBA surface pixels at the browser's actual device ratio. The
// visible viewport itself is unavoidable and is outside this extra budget.
export function panOverscan(size:{width:number;height:number},ratio:number){
  const extraPixels=PAN_BUFFER_BYTES/(4*Math.max(1,ratio)**2)
  const sum=size.width+size.height
  const memoryLimit=(Math.sqrt(sum*sum+4*extraPixels)-sum)/4
  return Math.max(0,Math.floor(Math.min(PAN_OVERSCAN,Math.min(size.width,size.height)/2,memoryLimit)))
}

// Camera differences become a screen translation of the retained SVG layer.
// Zoom always redraws at native resolution; canonical camera limits stay in App.
export function panTranslation(scene:Camera,camera:Camera,scale:number){
  return {x:(scene.x-camera.x)*scale,y:(scene.y-camera.y)*scale*mapProjection(true).yScale}
}

export function panSceneCamera(scene:Camera,camera:Camera,scale:number,overscan:number):Camera{
  if(scene.x===camera.x&&scene.y===camera.y&&scene.zoom===camera.zoom)return scene
  const shift=panTranslation(scene,camera,scale)
  // Refresh before the buffered edge reaches the screen. A large pointer jump
  // refreshes in the same render, so no uncovered strip can be published.
  if(scene.zoom===camera.zoom&&Math.max(Math.abs(shift.x),Math.abs(shift.y))<=overscan*.75)return scene
  return camera
}
