import { memo } from 'react'
import { labelLines } from '../game/mapView'
import type { MapLabel } from '../game/mapView'

export const WorldLabels=memo(function WorldLabels({labels,scale}:{labels:readonly MapLabel[];scale:number}){
  return <g className="map-labels map-region-labels" pointerEvents="none" aria-hidden="true">
    {labels.map(label=><text key={label.id} data-world-label={label.id} className={label.kind==='local'?'river-label':'region-label'} x={label.x} y={label.y} textAnchor="middle"
      style={{fontSize:label.size/scale,strokeWidth:2.6/scale}}>{labelLines(label.text).map((line,i)=><tspan key={i} x={label.x} dy={i?label.size*1.15/scale:0}>{line}</tspan>)}</text>)}
  </g>
})
