import { memo } from 'react'
import { coreGroundBrushes } from '../game/groundBrushes'
import { overviewRanges } from '../game/overviewRelief'
import { mapProjection } from '../game/mapProjection'
import type { MapProjection } from '../game/mapProjection'
import { boundsIntersect } from '../game/mapViewport'
import type { LabelBox } from '../game/mapView'

// A few feathered brush marks per section share the relief axes. No per-object
// filters: the same lightweight radial wash handles every zoom level.
const ridgeWashes=coreGroundBrushes.map(({id,bounds,marks})=>({id,bounds,marks:marks.map((p,i)=><ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="url(#terrain-wash-mountain)" opacity=".9"/>)}))
export const CoreTerrainGround = memo(function CoreTerrainGround({view}:{view:LabelBox}) {
  return <g className="core-terrain-ground" pointerEvents="none" aria-hidden="true" clipPath="url(#physical-land)">
    {ridgeWashes.filter(r=>boundsIntersect(r.bounds,view)).map(({id,marks})=><g key={id} data-terrain-ridge={id}>
      {marks}
    </g>)}
  </g>
})

// Fixed projection lets us prepare overview artwork once, rather than rebuild
// all peaks when the viewport changes. Culling retains the full relief height.
const projection=mapProjection(true)
const rangeArtwork=overviewRanges.flatMap(({id,name,peaks,relief})=>{
  if(!peaks.length)return []
  const points=peaks.map(p=>{
    const [x,y]=projection.point(p.position),w=15*p.scale,h=(relief==='hill'?12:22)*p.scale
    return {position:p.position,w,h,base:relief==='hill'?`M${x-w},${y+2}Q${x-2},${y-h*1.5} ${x+w},${y+2}Z`:`M${x-w},${y+2}L${x-2},${y-h}L${x+w},${y+2}Z`,shade:relief==='hill'?`M${x-1},${y+1-h*.75}Q${x+w*.45},${y+1-h*.3} ${x+w},${y+2}L${x+1},${y+1}Z`:`M${x-2},${y-h}L${x+w},${y+2}L${x+1},${y+1}Z`}
  })
  const bounds={left:Math.min(...points.map(p=>p.position[0]-p.w)),right:Math.max(...points.map(p=>p.position[0]+p.w)),
    top:Math.min(...points.map(p=>p.position[1]-p.h/projection.yScale)),bottom:Math.max(...points.map(p=>p.position[1]+2))}
  return [{id,bounds,artwork:<g key={id} data-range={id}><title>{name}</title>
    <path d={points.map(p=>p.base).join('')} fill="#a79575" fillOpacity=".82" stroke="#796951" strokeWidth=".35"/>
    <path d={points.map(p=>p.shade).join('')} fill="#6d6150" fillOpacity=".30"/>
  </g>}]
})
export const OverviewRanges = memo(function OverviewRanges({view}:{projection:MapProjection;view:LabelBox}) {
  return <g className="overview-ranges" pointerEvents="none" aria-hidden="true">
    {rangeArtwork.filter(r=>boundsIntersect(r.bounds,view)).map(r=>r.artwork)}
  </g>
})
