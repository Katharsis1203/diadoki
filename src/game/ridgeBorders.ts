import type { MapPoint } from './mapProjection.ts'

// Offset the geographic axis to either foothill margin. These fixed map-space
// guides never depend on individual peak symbols or camera zoom.
export function ridgeBaseLine(points:readonly MapPoint[],width:number,side:number,endScale?:readonly [number,number]):MapPoint[] {
  return points.map((p,i)=>{
    const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)]
    const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1
    const taper=endScale?endScale[0]+(endScale[1]-endScale[0])*i/(points.length-1):1
    const offset=Math.min(12,width*.45)*taper*side
    return [p[0]-dy/length*offset,p[1]+dx/length*offset]
  })
}
