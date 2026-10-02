import { lakes } from './mapGeometry.ts'
import { worldLandPath, worldLakes } from './worldMapGeometry.ts'
import type { MapPoint } from './mapProjection.ts'

export const linearPathRings=(path:string): MapPoint[][]=>path.replaceAll('Z','').split('M').filter(Boolean)
  .map(line=>line.split('L').map(p=>p.split(',').map(Number) as [number,number]))
export const physicalLakes=[...lakes,...worldLakes]
const rings=linearPathRings(worldLandPath).map(points=>({points,
  left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
  top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1])),
}))
export function pointInPhysicalRing(p:MapPoint,ring:readonly MapPoint[]){
  let inside=false
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j]
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
  }
  return inside
}
// Same even-odd rings as the ground SVG. Bounds reject distant islands before
// ray casting. Scenery cannot be anchored in seas or the Caspian land hole.
export function isPhysicalLand(p:MapPoint){
  let inside=false
  for(const ring of rings)if(p[0]>=ring.left&&p[0]<=ring.right&&p[1]>=ring.top&&p[1]<=ring.bottom&&pointInPhysicalRing(p,ring.points))inside=!inside
  return inside
}
