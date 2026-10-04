import type { Camera } from './mapView.ts'
import { mapProjection } from './mapProjection.ts'

export const PAN_OVERSCAN=128

// Camera differences become a screen translation of the retained SVG layer.
// Zoom always redraws at native resolution; canonical camera limits stay in App.
export function panTranslation(scene:Camera,camera:Camera,scale:number){
  return {x:(scene.x-camera.x)*scale,y:(scene.y-camera.y)*scale*mapProjection(true).yScale}
}

export function panSceneCamera(scene:Camera,camera:Camera,panning:boolean,scale:number,overscan:number):Camera{
  if(scene.x===camera.x&&scene.y===camera.y&&scene.zoom===camera.zoom)return scene
  const shift=panTranslation(scene,camera,scale)
  // Refresh before the buffered edge reaches the screen. A large pointer jump
  // refreshes in the same render, so no uncovered strip can be published.
  if(panning&&scene.zoom===camera.zoom&&Math.max(Math.abs(shift.x),Math.abs(shift.y))<=overscan*.75)return scene
  return camera
}
