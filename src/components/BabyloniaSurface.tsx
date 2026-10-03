import { memo } from 'react'
import { earthPatches, surfaceColors } from '../game/groundSurface'
import { project } from '../game/data'
import type { MapLevel } from '../game/mapView'

// Broad, fixed earth patches are intentionally unequal and not tiled. The
// same map-space anchors serve the surface and the upright ridge silhouettes.
const fields = [
  {id:'sippar-fields',state:'sippar',at:[44.06,33.21],angle:20},
  {id:'babylon-fields-west',state:'babylon',at:[44.20,32.60],angle:-12},
  {id:'babylon-fields-south',state:'babylon',at:[44.62,32.20],angle:25},
  {id:'nippur-fields',state:'nippur',at:[45.63,32.15],angle:18},
  {id:'uruk-fields',state:'uruk',at:[45.89,31.48],angle:-15},
] as const
const soilMarks = [[43.93,31.65,15],[44.30,30.83,-8],[44.43,30.55,22],[45.87,33.30,30],[47.10,32.76,-10]] as const

export function SurfaceSymbols() {
  return <>{Object.entries(surfaceColors).map(([id,color])=>
    <radialGradient key={id} id={`surface-${id}`}>
      <stop stopColor={color} stopOpacity=".22"/><stop offset=".4" stopColor={color} stopOpacity=".12"/>
      <stop offset=".75" stopColor={color} stopOpacity=".035"/><stop offset="1" stopColor={color} stopOpacity="0"/>
    </radialGradient>)}</>
}

export const BabyloniaSurface = memo(function BabyloniaSurface({level,cachedGround=false,groundOnly=false,shading=true,detailEnabled=true}:{level:MapLevel;cachedGround?:boolean;groundOnly?:boolean;shading?:boolean;detailEnabled?:boolean}) {
  return <g className="babylonia-surface" pointerEvents="none" aria-hidden="true" clipPath="url(#physical-land)">
    {!cachedGround&&shading&&earthPatches.map(({at,rx,ry,color,angle},i)=>{
      const [x,y]=project(at)
      return <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${angle} ${x} ${y})`} fill={`url(#surface-${color})`}/>
    })}
    {!groundOnly&&detailEnabled&&level!=='dominion'&&<g className="cultivated-patches" opacity={level==='state'?.75:.58}>
      {fields.map(({id,state,at,angle})=>{
        const [x,y]=project(at)
        return <g key={id} data-field={id} clipPath={`url(#state-clip-${state})`}>
          <g transform={`translate(${x} ${y}) rotate(${angle})`}>
            <path d="M-5 -3L-.8 -3.5L-.3 .5L-4.5 1ZM.1 -2.5L4.7 -2L4.1 2L.7 1.5ZM-4 2L-.2 1.7L.8 5L-3.3 5.3Z" fill="#74854c" fillOpacity=".26" stroke="#697448" strokeOpacity=".25" strokeWidth=".3"/>
            <path d="M-4.4 -1.8l3.2 -.3m-3 1.4l3.1 -.3M1 -1l3 .4m-2.8 .8l2.7 .3M-3.2 3l2.6 -.2m-2.3 1.2l2.5 -.2" fill="none" stroke="#526e42" strokeOpacity=".45" strokeWidth=".25"/>
          </g>
        </g>
      })}
      {soilMarks.map(([lon,lat,angle],i)=>{
        const [x,y]=project([lon,lat])
        return <path key={i} d="M-6 0q3 -2 7 -1m-4 3q3 -1 5 -.6M2 -3l1.2 -.3" transform={`translate(${x} ${y}) rotate(${angle})`} stroke="#9c7941" strokeOpacity=".35" strokeWidth=".35" fill="none"/>
      })}
    </g>}
  </g>
})
