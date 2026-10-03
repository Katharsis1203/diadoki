import { physicalLandRings, physicalCoastLines } from './physicalLand.ts'
import { boundsIntersect } from './mapViewport.ts'
import { clipGroundLine, clipGroundRing } from './rectangleClip.ts'
export { clipGroundRing, clipGroundSegment } from './rectangleClip.ts'
import type { MapPoint } from './mapProjection.ts'
import type { LabelBox } from './mapView.ts'

const landRings=physicalLandRings.map(ring=>({points:ring.points,bounds:ring}))
export type GroundGeometry={landPath:string;coastPath:string}
const path=(points:readonly MapPoint[],close=false)=>points.length?`M${points.map(p=>p.join(',')).join('L')}${close?'Z':''}`:''
export function groundGeometry(box:LabelBox):GroundGeometry {
  const fills:string[]=[],coasts:string[]=[]
  for(const ring of landRings){
    if(!boundsIntersect(ring.bounds,box))continue
    const fill=clipGroundRing(ring.points,box)
    if(fill.length>=3)fills.push(path(fill,true))
  }
  for(const line of physicalCoastLines){
    if(boundsIntersect(line.bounds,box))coasts.push(...clipGroundLine(line.points,box).map(points=>path(points)))
  }
  return {landPath:fills.join(''),coastPath:coasts.join('')}
}
