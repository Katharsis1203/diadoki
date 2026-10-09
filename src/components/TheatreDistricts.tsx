import { persisCentres } from '../game/persisGeography'
import { theatreCentreLabel } from '../game/theatreScene'
import type { SceneryObject } from '../game/babyloniaScenery'
import { memo } from 'react'
import type { RefObject } from 'react'
import { theatreBorders, theatreDistricts, theatreDistrictById, theatreRegionById, theatreRegions } from '../game/theatreGeography'
import type { TheatreDistrict } from '../game/theatreGeography'
import { boundsIntersect } from '../game/mapViewport'
import { labelLines, visibleLabels } from '../game/mapView'
import type { LabelBox, MapLabel, MapLevel } from '../game/mapView'
import { atlasOwner, mapFactionById, mapFactions } from '../game/politicalContent'
import { factionSymbols } from '../game/factionSymbols'
import type { MapProjection } from '../game/mapProjection'

type Props = {view:LabelBox;selectedId:string|null}
export const TheatreTerritories = memo(function TheatreTerritories({view,selectedId,battle,onSelect,suppressClick}:Props&{
  battle:boolean;onSelect:(id:string)=>void;suppressClick:RefObject<boolean>
}) {
  return <g className="theatre-territories">
    {theatreDistricts.filter(s=>boundsIntersect(s.bounds,view)).map(state=><g key={state.id}
      className={`territory-state ${selectedId===state.id&&state.id!=='persepolis'?'selected':''}`} data-draft-state={state.id} data-draft-province={state.provinceId}
      data-full-selection={selectedId===state.id&&state.id==='persepolis'?true:undefined}
      role="button" tabIndex={battle?-1:0} aria-label={`${state.name}, ${theatreRegionById.get(state.provinceId)!.name}, ${mapFactionById.get(atlasOwner(state))!.name}`}
      aria-pressed={selectedId===state.id} aria-disabled={battle}
      onClick={event=>{event.stopPropagation();if(!battle&&!suppressClick.current)onSelect(state.id)}}
      onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!battle)onSelect(state.id)}}}>
      <title>{state.name} · {theatreRegionById.get(state.provinceId)!.name} · {mapFactionById.get(atlasOwner(state))!.name}</title>
      <path className="state-area" d={state.path} fillRule="evenodd"/>
    </g>)}
  </g>
})

export const TheatreBorders = memo(function TheatreBorders({view,selectedId,projection,level,provinceBorders=true,stateBorders=true}:Props&{projection:MapProjection;level:MapLevel;provinceBorders?:boolean;stateBorders?:boolean}) {
  const visible=theatreBorders.filter(b=>boundsIntersect(b.bounds,view))
  const state=selectedId?theatreDistrictById.get(selectedId):undefined
  const province=state?theatreRegionById.get(state.provinceId):undefined
  const fullHighlight=state?.id==='persepolis'
  return <>
  <g className="map-borders theatre-borders" clipPath="url(#mountain-border-clip)" transform={projection.groundTransform} pointerEvents="none" aria-hidden="true">
    {provinceBorders&&<path className="province-division" d={visible.filter(b=>b.provincial).map(b=>b.path).join('')}/>}
    {stateBorders&&level!=='dominion'&&<path className="state-division" d={visible.filter(b=>!b.provincial).map(b=>b.path).join('')}/>}
    {province&&<path className="selected-province-border" data-draft-selected-province={province.id} d={province.borderPath}/>}
    {state&&!fullHighlight&&<path className="state-selection" d={state.path}/>}
  </g>
  {state&&fullHighlight&&<g className="theatre-selection-overlay" data-draft-selection={state.id}
    transform={projection.groundTransform} pointerEvents="none" aria-hidden="true">
    <path className="district-selection-fill" d={state.administrativePath} fillRule="evenodd"/>
    <path className="state-selection" d={state.administrativePath}/>
  </g>}
  </>
})

export const TheatreLabels = memo(function TheatreLabels({view,selectedId,projection,scale,level,obstacles,centres=[],labelsEnabled=true}:Props&{
  projection:MapProjection;scale:number;level:MapLevel;obstacles:readonly LabelBox[];centres?:readonly SceneryObject[];labelsEnabled?:boolean
}) {
  const centreByState=new Map(centres.flatMap(o=>o.placement.asset==='settlement'?[[o.placement.stateId,o] as const]:[]))
  const districts=theatreDistricts.filter(s=>boundsIntersect(s.bounds,view))
  const seats=mapFactions.filter(f=>f.kind==='successor').flatMap(f=>{const s=theatreDistrictById.get(f.seatStateId);return s&&boundsIntersect(s.bounds,view)?[{f,s}]:[]})
  const projected=(point:readonly [number,number])=>projection.point(point)
  const candidates:MapLabel[]=!labelsEnabled?[]:level==='dominion'?theatreRegions.filter(p=>boundsIntersect(p.bounds,view)).map(p=>{
    const [x,y]=projected(p.label)
    return {id:p.id,text:p.name,x,y,size:scale<.6?11:15,priority:selectedId&&p.stateIds.includes(selectedId)?8:2,kind:'province'}
  }):districts.map(s=>theatreCentreLabel(s,projection,scale,selectedId,centreByState.get(s.id)))
  if(labelsEnabled&&level==='dominion')candidates.push(...seats.map(({s})=>{const [x,y]=projected(s.anchor);return {id:`seat-${s.id}`,text:s.name,x,y:y+20/scale,size:12,priority:5,kind:'city' as const}}))
  const seatObstacles=seats.map(({s})=>{const [x,y]=projected(s.anchor);return {left:x-11/scale,right:x+11/scale,top:y-11/scale,bottom:y+11/scale}})
  const labels=labelsEnabled?visibleLabels(candidates,scale,[...obstacles,...seatObstacles]):[]
  return <g className="map-labels theatre-labels" pointerEvents="none" aria-hidden="true">
    {level!=='dominion'&&districts.filter(s=>!centreByState.has(s.id)&&!seats.some(seat=>seat.s.id===s.id)).toSorted((a,b)=>a.anchor[1]-b.anchor[1]).map(s=>{
      const [x,y]=projected(s.anchor),r=(s.isCapital?3:1.8)/scale
      return <g key={s.id} data-draft-centre={s.id} data-capital={s.isCapital} transform={`translate(${x} ${y})`}>
        <ellipse cx={r*.5} cy={r*.5} rx={r*1.8} ry={r*.65} fill="#584733" opacity=".17"/>
        <circle r={r} fill={mapFactionById.get(atlasOwner(s))!.color} stroke="#f2dfb4" strokeWidth={.8/scale}/>
        {s.isCapital&&<path d={`M${-r*1.6},${-r*1.3}L0,${-r*2.7}L${r*1.6},${-r*1.3}`} fill="none" stroke="#604d34" strokeWidth={1/scale}/>}
      </g>
    })}
    {seats.map(({f,s})=>{const [x,y]=projected(s.anchor);return <g key={f.id} data-atlas-faction-seat={f.id} data-draft-centre={s.id} className="faction-seal" color={f.color} transform={`translate(${x} ${y}) scale(${1/scale})`}>
      <title>{f.name} principal seat · {s.name}</title><circle className="capital-outer" r="13"/><circle className="seal-ring" r="10"/><use href={`#seal-${factionSymbols[f.id].symbol}`} x="-8" y="-8" width="16" height="16"/>
    </g>})}
    {labels.map(label=><text key={label.id} data-draft-label={label.id} x={label.x} y={label.y} textAnchor="middle"
      className={label.kind==='province'?'province-label':label.id===selectedId?'state-label active-state':'state-label'}
      style={{fontSize:label.size/scale,strokeWidth:2.6/scale}}>{labelLines(label.text).map((line,i)=><tspan key={i} x={label.x} dy={i?label.size*1.15/scale:0}>{line}</tspan>)}</text>)}
  </g>
})

export function TheatreInspector({state,onSelect,onDismiss,onFocus}:{state:TheatreDistrict;onSelect:(id:string)=>void;onDismiss:()=>void;onFocus:()=>void}) {
  const province=theatreRegionById.get(state.provinceId)!
  const faction=mapFactionById.get(atlasOwner(state))!
  const landscape=persisCentres.find(p=>p.stateId===state.id)?.landscape
  return <aside className="panel command-panel theatre-inspector" aria-labelledby="draft-title">
    <button className="close-panel" aria-label="Close map draft details" onClick={onDismiss}>×</button>
    <p className="eyebrow">{province.name} · Map draft</p><h2 id="draft-title">{state.name}</h2>
    <p className="subtle">{state.isCapital?'Proposed provincial capital. ':''}Political atlas territory; campaign balance and playable integration remain planned.</p>
    {landscape&&<p className="subtle" data-district-landscape={state.id}>{landscape}</p>}
    <p className="atlas-owner" data-atlas-owner={faction.id}><i style={{background:faction.color}} aria-hidden="true"/>{faction.name}{faction.kind==='satrap'?' · Independent satrap':''}</p>
    <div className="province-summary"><h3>{province.name} <small>province</small></h3>
      <button className="focus-province secondary" onClick={onFocus}>Focus province</button>
      <p className="subtle">{province.stateIds.length} states · Seat: {theatreDistrictById.get(province.capitalStateId)!.name}</p>
      <div className="province-members" aria-label={`States in ${province.name}`}>{province.districts.map(s=><button key={s.id} className="secondary" aria-pressed={state.id===s.id} onClick={()=>onSelect(s.id)}>{s.name}</button>)}</div>
    </div>
    <p className="subtle">{state.neighbors.some(id=>theatreDistrictById.has(id))?'Borders ': 'Coastal or island district.'}
      {state.neighbors.filter(id=>theatreDistrictById.has(id)).map((id,i)=><span key={id}>{i>0&&', '}<button className="state-link" onClick={()=>onSelect(id)}>{theatreDistrictById.get(id)!.name}</button></span>)}</p>
  </aside>
}
