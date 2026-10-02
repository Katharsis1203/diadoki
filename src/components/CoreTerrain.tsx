import { memo } from 'react'
import { backbonePeaks, coreRangeGround, inCoreWater } from '../game/terrainBackbone'
import type { MapProjection } from '../game/mapProjection'
import { boundsIntersect, pointBounds } from '../game/mapViewport'
import type { LabelBox } from '../game/mapView'

// A few feathered brush marks per section share the relief axes. No per-object
// filters: the same lightweight radial wash handles every zoom level.
const ridgeWashes=coreRangeGround.map(({id,mapPoints,width})=>({id,bounds:pointBounds(mapPoints),marks:mapPoints.flatMap((p,i)=>{
  if(!i)return [p]
  const a=mapPoints[i-1],count=Math.max(1,Math.ceil(Math.hypot(p[0]-a[0],p[1]-a[1])/(width*.5)))
  return Array.from({length:count},(_,j)=>[a[0]+(p[0]-a[0])*(j+1)/count,a[1]+(p[1]-a[1])*(j+1)/count] as const)
}).map(([x,y],i)=>({x,y,rx:width*(.72+.08*Math.sin(i*1.8)),ry:width*.62}))
  .filter(p=>!inCoreWater([p.x,p.y],width*.35)).map((p,i)=><ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="url(#terrain-wash-mountain)" opacity=".9"/>)}))
export const CoreTerrainGround = memo(function CoreTerrainGround({view}:{view:LabelBox}) {
  return <g className="core-terrain-ground" pointerEvents="none" aria-hidden="true" clipPath="url(#physical-land)">
    {ridgeWashes.filter(r=>boundsIntersect(r.bounds,view)).map(({id,marks})=><g key={id} data-terrain-ridge={id}>
      {marks}
    </g>)}
  </g>
})

// At overview, a single connected outline per ridge replaces fine peak art.
// The ground is projected first; the small relief rise stays upright.
const overviewRanges=coreRangeGround.map(range=>({...range,peaks:backbonePeaks.filter(p=>p.rangeId===range.id)}))
  .toSorted((a,b)=>Math.max(...a.mapPoints.map(p=>p[1]))-Math.max(...b.mapPoints.map(p=>p[1])))
export const OverviewRanges = memo(function OverviewRanges({projection}:{projection:MapProjection}) {
  return <g className="overview-ranges" pointerEvents="none" aria-hidden="true">
    {overviewRanges.map(({id,name,mapPoints,scale,peaks})=>{
      if(peaks.length){
        const triangles=peaks.map(p=>{
          const [x,y]=projection.point(p.position),w=15*p.scale,h=22*p.scale
          return {base:`M${x-w},${y+2}L${x-2},${y-h}L${x+w},${y+2}Z`,shade:`M${x-2},${y-h}L${x+w},${y+2}L${x+1},${y+1}Z`}
        })
        return <g key={id} data-range={id}><title>{name}</title>
          <path d={triangles.map(p=>p.base).join('')} fill="#a79575" fillOpacity=".82" stroke="#796951" strokeWidth=".35"/>
          <path d={triangles.map(p=>p.shade).join('')} fill="#6d6150" fillOpacity=".30"/>
        </g>
      }
      const points=mapPoints.map(projection.point)
      const top=points.map(([x,y],i)=>[x-12,y-(i%3===0?14:8)] as const)
      const base=points.toReversed().map(([x,y])=>[x+10,y+5] as const)
      return <g key={id} data-range={id}>
        <title>{name}</title>
        <path d={`M${[...top,...base].map(p=>p.join(',')).join('L')}Z`} fill="#9b886a" fillOpacity=".62" stroke="#796951" strokeWidth=".6"/>
        <path d={`M${top.map(p=>p.join(',')).join('L')}`} stroke="#e4cda0" strokeWidth={scale*1.6} fill="none"/>
      </g>
    })}
  </g>
})
