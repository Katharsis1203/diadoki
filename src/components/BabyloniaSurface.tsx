import { memo } from 'react'
import { earthPatches, surfaceColors, surfaceOpacity } from '../game/groundSurface'
import { project } from '../game/data'
import type { MapLevel } from '../game/mapView'

// Broad, fixed earth patches are intentionally unequal and not tiled. The
// same map-space anchors serve the surface and the upright ridge silhouettes.
const fields = [
  {id:'persis-basin-fields',state:'pasargadae',at:[53.52,30.66],angle:14},
  {id:'southern-plateau-basin-fields',state:'pasargadae',at:[53.52,31.63],angle:-14},
  {id:'persepolis-fields',state:'persepolis',at:[52.72,29.78],angle:22},
  {id:'pasargadae-fields',state:'pasargadae',at:[54.54,31.18],angle:-12},
  {id:'western-persis-fields',state:'western-persis',at:[51.23,30.33],angle:18},
  {id:'western-entry-fields-edge',state:'western-foothills',at:[51.80,31.45],angle:19},
  {id:'western-persis-valley-fields',state:'western-persis',at:[51.58,30.28],angle:-16},
  {id:'western-entry-fields',state:'western-foothills',at:[51.57,31.62],angle:-8},
  {id:'sippar-fields',state:'sippar',at:[44.06,33.21],angle:20},
  {id:'babylon-fields-west',state:'babylon',at:[44.20,32.60],angle:-12},
  {id:'babylon-fields-south',state:'babylon',at:[44.62,32.20],angle:25},
  {id:'nippur-fields',state:'nippur',at:[45.63,32.15],angle:18},
  {id:'upper-euphrates-fields',state:'upper-euphrates',at:[39.37,36.09],angle:-10},
  {id:'nisibis-fields',state:'nisibis',at:[41.01,36.94],angle:10},
  {id:'nineveh-fields-west',state:'nineveh',at:[42.92,36.28],angle:-14},
  {id:'arbela-fields',state:'arbela',at:[44.18,36.03],angle:22},
  {id:'assur-fields',state:'assur',at:[43.09,35.62],angle:8},
  {id:'susa-fields-north',state:'susa',at:[48.00,32.38],angle:12},
  {id:'susa-fields-west',state:'susa',at:[47.89,32.08],angle:-18},
  {id:'susa-fields-south',state:'susa',at:[48.42,31.98],angle:24},
  {id:'uruk-fields',state:'nippur',at:[45.89,31.48],angle:-15},
] as const
const soilMarks = [[43.93,31.65,15],[44.30,30.83,-8],[44.43,30.55,22],[45.87,33.30,30],[47.10,32.76,-10]] as const

export function SurfaceSymbols() {
  return <>{Object.entries(surfaceColors).map(([id,color])=>
    <radialGradient key={id} id={`surface-${id}`}>
      <stop stopColor={color} stopOpacity={surfaceOpacity[id as keyof typeof surfaceColors]}/><stop offset=".4" stopColor={color} stopOpacity={surfaceOpacity[id as keyof typeof surfaceColors]*6/11}/>
      <stop offset=".75" stopColor={color} stopOpacity={surfaceOpacity[id as keyof typeof surfaceColors]*7/44}/><stop offset="1" stopColor={color} stopOpacity="0"/>
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
