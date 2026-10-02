import { memo } from 'react'
import { project } from '../game/data'
import { worldRegions } from '../game/worldTerrain'
import { labelLines, visibleLabels } from '../game/mapView'
import type { LabelBox, MapLabel } from '../game/mapView'
import type { MapProjection } from '../game/mapProjection'
import { boundsIntersect } from '../game/mapViewport'

const riverLabels=[
  {id:'nile',name:'Nile',at:[31.0,27.0] as const},
  {id:'indus',name:'Indus',at:[68.6,28.1] as const},
  {id:'ganges',name:'Ganges',at:[82.7,25.6] as const},
  {id:'oxus',name:'Oxus',at:[66.1,37.4] as const},
] as const
export const WorldLabels=memo(function WorldLabels({projection,scale,view,obstacles,wide}:{projection:MapProjection;scale:number;view:LabelBox;obstacles:readonly LabelBox[];wide:boolean}){
  const candidates:MapLabel[]=[...worldRegions.map(r=>{
    const [x,y]=projection.point(project(r.at))
    return {id:`region-${r.id}`,text:r.name,x,y,size:wide?16:19,priority:2,kind:'province' as const,
      alternatives:[-20,20,-38,38].map(dy=>({x,y:y+dy/scale}))}
  }),...riverLabels.map(r=>{
    const [x,y]=projection.point(project(r.at))
    return {id:`river-${r.id}`,text:r.name,x,y,size:12,priority:1,kind:'local' as const}
  })].filter(p=>boundsIntersect({left:p.x-10,right:p.x+10,top:p.y-10,bottom:p.y+10},view))
  return <g className="map-labels map-region-labels" pointerEvents="none" aria-hidden="true">
    {visibleLabels(candidates,scale,obstacles).map(label=><text key={label.id} data-world-label={label.id} className={label.kind==='local'?'river-label':'region-label'} x={label.x} y={label.y} textAnchor="middle"
      style={{fontSize:label.size/scale,strokeWidth:2.6/scale}}>{labelLines(label.text).map((line,i)=><tspan key={i} x={label.x} dy={i?label.size*1.15/scale:0}>{line}</tspan>)}</text>)}
  </g>
})
