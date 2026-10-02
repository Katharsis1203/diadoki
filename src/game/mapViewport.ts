import type { Camera, LabelBox } from './mapView.ts'
import type { MapPoint, MapProjection } from './mapProjection.ts'

export const pointBounds=(points:readonly MapPoint[]):LabelBox=>({
  left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
  top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1])),
})
export const boundsIntersect=(a:LabelBox,b:LabelBox)=>a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top
// Actual screen bounds account for SVG meet scaling and the shared ground tilt.
// Padding retains relief whose anchor lies just outside the visible rectangle.
export function mapViewport(camera:Camera,projection:MapProjection,scale:number,size:{width:number;height:number}):LabelBox {
  const halfWidth=size.width/(2*scale)+40,halfHeight=size.height/(2*scale*projection.yScale)+50
  return {left:camera.x-halfWidth,right:camera.x+halfWidth,top:camera.y-halfHeight,bottom:camera.y+halfHeight}
}
