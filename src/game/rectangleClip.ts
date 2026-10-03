import type { MapPoint } from './mapProjection.ts'
import type { LabelBox } from './mapView.ts'

// Clip fills independently from real shoreline segments. Rectangle cuts never
// become coastline strokes. Even-odd fill preserves lake holes and concavities.
export function clipGroundRing(ring:readonly MapPoint[],box:LabelBox):MapPoint[] {
  let points=[...ring]
  for(const [axis,edge,sign] of [[0,box.left,1],[0,box.right,-1],[1,box.top,1],[1,box.bottom,-1]] as const){
    const input=points;points=[]
    if(!input.length)break
    let a=input.at(-1)!,aInside=sign*(a[axis]-edge)>=0
    for(const b of input){
      const bInside=sign*(b[axis]-edge)>=0
      if(aInside!==bInside){const t=(edge-a[axis])/(b[axis]-a[axis]);points.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])}
      if(bInside)points.push(b)
      a=b;aInside=bInside
    }
  }
  return points
}
export function clipGroundSegment(a:MapPoint,b:MapPoint,box:LabelBox):readonly [MapPoint,MapPoint]|null {
  const dx=b[0]-a[0],dy=b[1]-a[1];let lo=0,hi=1
  for(const [p,q] of [[-dx,a[0]-box.left],[dx,box.right-a[0]],[-dy,a[1]-box.top],[dy,box.bottom-a[1]]]){
    if(!p){if(q<0)return null;continue}
    const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t)
    if(lo>hi)return null
  }
  return [[a[0]+lo*dx,a[1]+lo*dy],[a[0]+hi*dx,a[1]+hi*dy]]
}
// Open polylines are clipped independently from filled polygons, preserving
// original coasts without turning rectangle cuts into shoreline strokes.
export function clipGroundLine(line:readonly MapPoint[],box:LabelBox):MapPoint[][] {
  const reaches:MapPoint[][]=[]
  let reach:MapPoint[]=[]
  for(let i=1;i<line.length;i++){
    const clipped=clipGroundSegment(line[i-1],line[i],box)
    if(!clipped){if(reach.length)reaches.push(reach);reach=[];continue}
    const [a,b]=clipped,last=reach.at(-1)
    if(last&&(Math.abs(last[0]-a[0])>1e-7||Math.abs(last[1]-a[1])>1e-7)){reaches.push(reach);reach=[]}
    if(!reach.length)reach.push(a)
    reach.push(b)
  }
  if(reach.length)reaches.push(reach)
  return reaches
}
