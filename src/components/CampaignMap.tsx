import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { GameState } from '../game/data'
import { factions, project } from '../game/data'
import { babyloniaWaterways } from '../game/babyloniaTerrain'
import { factionSymbols } from '../game/factionSymbols'
import { dominionLabel, leader, ownerName, selectedProvince, selectedState } from '../game/engine'
import { mapBorderPaths, pointInState } from '../game/geography'
import { campaignOutline } from '../game/stateGeometry'
import { lakes, landPath, rivers } from '../game/mapGeometry'
import { labelLines, MAP_HEIGHT, MAP_WIDTH, visibleLabels } from '../game/mapView'
import { mapProjection } from '../game/mapProjection'
import type { MapPoint } from '../game/mapProjection'
import { sceneryObjects } from '../game/babyloniaScenery'
import type { Camera, MapLabel, MapLevel } from '../game/mapView'
import { FactionSealSymbols } from './FactionSeals'
import { TerrainLayer, TerrainSymbols } from './TerrainLayer'
import { BabyloniaScenery, ScenerySymbols } from './BabyloniaScenery'

type Props = {
  game: GameState
  camera: Camera
  level: MapLevel
  terrainLevel?: MapLevel
  perspective?: boolean
  onSelect: (id: string) => void
  onBackground: () => void
  onZoom: (factor: number, anchor?: MapPoint, smooth?: boolean) => void
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void
  onPointerUp: () => void
  suppressClick: React.RefObject<boolean>
}
const polygonPath = (ring: readonly (readonly [number, number])[]) => `M${ring.map(p=>p.join(',')).join('L')}Z`
const campaignPath = polygonPath(campaignOutline)
const WHEEL_ZOOM_SENSITIVITY = .0015

export function CampaignMap({ game, camera, level, terrainLevel, perspective=false, onSelect, onBackground, onZoom, onPointerDown, onPointerMove, onPointerUp, suppressClick }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 1440, height: 900 })
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    if (svg.current) observer.observe(svg.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const map = svg.current
    if (!map) return
    const wheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return
      const matrix = map.getScreenCTM()
      if (!matrix) return
      event.preventDefault()
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
      const anchor = mapProjection(perspective).inverse([point.x, point.y])
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? map.clientHeight : 1
      const delta = Math.max(-200, Math.min(200, event.deltaY * unit))
      onZoom(Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY), anchor, true)
    }
    // A non-passive listener lets map zoom consume the wheel without page scrolling.
    map.addEventListener('wheel', wheel, { passive: false })
    return () => map.removeEventListener('wheel', wheel)
  }, [onZoom, perspective])
  const scale = Math.min(size.width / MAP_WIDTH, size.height / MAP_HEIGHT) * camera.zoom
  const projection = mapProjection(perspective)
  const [cameraX,cameraY] = projection.point([camera.x,camera.y])
  const objects = perspective ? sceneryObjects(projection,camera.zoom,scale,level) : []
  const overlaps=(a:{left:number;right:number;top:number;bottom:number},b:typeof a)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top
  const centres = new Map(objects.flatMap(o=>o.placement.asset==='settlement'?[[o.placement.stateId,{object:o,name:o.placement.name,isCapital:o.placement.isCapital}] as const]:[]))
  const illustratedSeats = new Set(objects.filter(o=>o.placement.asset==='settlement').map(o=>o.placement.settlementId))
  const markerAt = (x:number,y:number,id:string) => {
    const point=projection.point([x,y])
    return [point[0],point[1]+(illustratedSeats.has(id)?10/scale:0)]
  }
  const state = selectedState(game), province = selectedProvince(game), commander = leader(game)
  const borders = useMemo(()=>mapBorderPaths(game.states),[game.states])
  const seats = factions.flatMap((f) => {
    const settlement = game.settlements.find((p) => p.id === f.seatSettlementId)
    return settlement && game.states.find((s) => s.id === settlement.stateId)?.owner === f.id ? [{faction:f,settlement}] : []
  })
  const inView = (x:number,y:number) => Math.abs(x-cameraX)<MAP_WIDTH/(2*camera.zoom)+20 && Math.abs(y-cameraY)<MAP_HEIGHT/(2*camera.zoom)+40
  const seatIds = new Set(seats.map(p=>p.settlement.id))
  const provinceSeats = game.provinces.map(p=>({province:p,settlement:game.settlements.find(s=>s.id===p.mainSettlementId)!}))
  const provinceSeatIds = new Set(provinceSeats.map(p=>p.settlement.id))
  const dominionLabels: MapLabel[] = factions.flatMap((f) => {
    const anchor = dominionLabel(game, f.id)
    const [x,y]=projection.point(anchor?[anchor.labelX,anchor.labelY]:[0,0])
    return anchor ? [{ id: f.id, text: f.name, x, y:y+65/scale, alternatives:[95,40,125].map(dy=>({x,y:y+dy/scale})), size: 22, priority: 1, kind: 'dominion' as const }] : []
  })
  const labels:MapLabel[] = [...game.states.map((p) => {
    const seat=provinceSeats.find(s=>s.settlement.stateId===p.id)
    const centre=centres.get(p.id)
    if(centre){
      const {x,y,size}=centre.object, fontSize=centre.isCapital?17:15
      const below=(centre.isCapital?44:24)/scale
      const side=(24*size+(centre.name.length*fontSize*.56/2+8)/scale)
      const positions=[{x,y:y+below},{x:x-side,y:y+4/scale},{x:x+side,y:y+4/scale},
        {x,y:y+below+16/scale},{x,y:centre.object.box.top-8/scale}]
        .filter(at=>pointInState(projection.inverse([at.x,at.y]),p.id))
      const preferred=positions[0]??{x,y}
      return {id:p.id,text:centre.name,...preferred,alternatives:positions.slice(1),size:fontSize,priority:p.id===state?.id?10:p.provinceId===province?.id?6:4,kind:'state' as const}
    }
    const [x,y]=projection.point([p.labelX,p.labelY])
    const offsets=perspective?[-20,20,-35,35,-55,55]:[-20,20,-35,35]
    const alternatives=offsets.map(dy=>({x,y:y+dy/scale}))
    if(perspective)alternatives.push(...[-45,45,-65,65].map(dx=>({x:x+dx/scale,y})))
    return {id:p.id,text:p.name,x,y,alternatives:alternatives.filter(at=>pointInState(projection.inverse([at.x,at.y]),p.id)),size:seat?17:15,priority:p.id===state?.id?10:p.provinceId===province?.id?6:4,kind:'state' as const}
  }), ...game.settlements.filter(p=>level==='state'||provinceSeatIds.has(p.id)||p.stateId===state?.id).filter(p=>game.states.find(s=>s.id===p.stateId)?.name!==p.name).map((p) => {
    const [x,y]=projection.point([p.x,p.y])
    return {id:p.id,text:p.name,x,y:y+13/scale,size:11,priority:provinceSeatIds.has(p.id)?9:p.stateId===state?.id?5:1,kind:'city' as const}
  })]
  seats.forEach(({settlement:p})=>{
    const [x,y]=projection.point([p.x,p.y])
    dominionLabels.push({id:p.id,text:p.name,x,y:y+30/scale,size:12,priority:5,kind:'city'})
  })
  const obstacles=provinceSeats.map(({settlement:p})=>{
    const [x,y]=markerAt(p.x,p.y,p.id)
    const radius=(seatIds.has(p.id)?13:6)/scale
    return {left:x-radius,right:x+radius,top:y-radius,bottom:y+radius}
  })
  const cityObstacles=objects.filter(o=>o.placement.asset==='settlement').map(o=>o.box)
  const [localX,localY]=projection.point(state?[state.labelX,state.labelY]:[0,0])
  const localDetails: MapLabel[] = level === 'state' && state ? [{
    id: `${state.id}-details`, text: `${state.garrison} garrison\n${state.buildings.market} market${state.buildings.fort > 0 ? ` · ${state.buildings.fort} fort` : ''}`,
    x: localX, y: localY + 40 / scale, size: 10, priority: 0, kind: 'local',
    alternatives: [55, 70, -35, -50].map(dy => ({ x: localX, y: localY + dy / scale })).filter(at => pointInState(projection.inverse([at.x, at.y]), state.id)),
  }] : []
  const visible = visibleLabels([...labels, ...localDetails].filter(p=>inView(p.x,p.y)),scale,[...obstacles,...cityObstacles])
  const visibleDominions=visibleLabels(dominionLabels.filter(p=>inView(p.x,p.y)),scale,obstacles)
  // Keep names/markers readable by hiding overlapping small decoration, rather
  // than moving authored ground positions. Primary centres reserve label space.
  const labelBoxes=visible.map(label=>{
    const lines=labelLines(label.text),width=Math.max(...lines.map(l=>l.length))*label.size*.6/scale
    return {left:label.x-width/2-3/scale,right:label.x+width/2+3/scale,top:label.y-label.size/scale,bottom:label.y+(lines.length-1)*label.size*1.15/scale+4/scale}
  })
  const scenery=objects.filter(o=>inView(o.x,o.y)&&(o.placement.asset==='settlement'||![...labelBoxes,...obstacles,...cityObstacles].some(box=>overlaps(o.box,box))))
  return <svg ref={svg} className={`campaign-map map-level-${level}`} data-level={level} data-perspective={perspective?'2.5d':'flat'} data-zoom={camera.zoom.toFixed(3)}
    viewBox={`${cameraX - MAP_WIDTH / (2 * camera.zoom)} ${cameraY - MAP_HEIGHT / (2 * camera.zoom)} ${MAP_WIDTH / camera.zoom} ${MAP_HEIGHT / camera.zoom}`}
    role="group" aria-label="Faction dominions contain provinces, composed of selectable states. Select a state for details. Drag to pan; use the mouse wheel to zoom; focus a province to issue orders."
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}
    onClick={() => { if (!suppressClick.current) onBackground() }}>
    <defs>
      <linearGradient id="sea-wash" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="180" y2="700"><stop stopColor="#b6d8d5" /><stop offset="1" stopColor="#8ebec9" /></linearGradient>
      <linearGradient id="land-wash" gradientUnits="userSpaceOnUse" x1="200" y1="80" x2="600" y2="700"><stop stopColor="#f0e3c2" /><stop offset=".55" stopColor="#e8d6ac"/><stop offset="1" stopColor="#e1c79a" /></linearGradient>
      <pattern id="sea-engraving" width="90" height="42" patternUnits="userSpaceOnUse"><path d="M8 12q12 -4 24 0t24 0M45 33q12 -4 24 0t24 0" fill="none" stroke="#467e90" strokeOpacity=".065" strokeWidth=".6" /></pattern>
      <pattern id="land-grain" width="47" height="43" patternUnits="userSpaceOnUse"><path d="M6 9l3 -1m20 20l4 1m-20 9l2 -1" stroke="#8b704c" strokeWidth=".4" strokeOpacity=".12" /><circle cx="22" cy="12" r=".5" fill="#826943" fillOpacity=".12" /></pattern>
      <FactionSealSymbols /><TerrainSymbols /><ScenerySymbols />
      {game.states.map((p) => <clipPath key={p.id} id={`state-clip-${p.id}`}><polygon points={p.shape} /></clipPath>)}
      <clipPath id="campaign-land"><path d={campaignPath} /></clipPath>
      <clipPath id="physical-land"><path d={landPath} clipRule="evenodd"/></clipPath>
      <mask id="water-border-mask" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000"><rect x="-1000" y="-1000" width="3000" height="3000" fill="white"/>{rivers.map(r=><path key={r.name} d={r.path} fill="none" stroke="black" strokeWidth={2.7/scale}/>)}{level!=='dominion'&&babyloniaWaterways.filter(f=>f.detail==='regional').map(f=><path key={f.id} d={`M${f.points.map(project).map(p=>p.join(',')).join('L')}`} fill="none" stroke="black" strokeWidth={1.2/scale}/>)}</mask>
    </defs>
    <rect x="-10000" y="-10000" width="20000" height="20000" className="map-sea" />
    <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#sea-engraving)" />
    <g className="map-ground" transform={projection.groundTransform}>
    <g aria-hidden="true" className="map-context">
      <path className="map-coastal-shallows" d={landPath} fillRule="evenodd"/>
      <path className="map-land context-land" d={landPath} fillRule="evenodd" />
      <path d={landPath} fill="url(#land-grain)" fillRule="evenodd" />
    </g>
    {game.states.map((p) => <g key={p.id} data-state={p.id} data-province={p.provinceId} role="button" tabIndex={game.battle ? -1 : 0}
      aria-label={`${p.name}, ${game.provinces.find((province) => province.id === p.provinceId)?.name}, ${ownerName(p.owner)}`}
      aria-pressed={state?.id === p.id} aria-disabled={!!game.battle} className={`territory-state ${state?.id === p.id ? 'selected' : ''}`}
      onClick={(event) => { event.stopPropagation(); if (!suppressClick.current) onSelect(p.id) }}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(p.id) } }}>
      <title>{p.name} · {game.provinces.find((province) => province.id === p.provinceId)?.name}</title>
      <polygon className="state-area" points={p.shape} />
    </g>)}
    <TerrainLayer zoom={camera.zoom} scale={scale} override={terrainLevel} sceneryPrototype={perspective}/>
    <g className="map-physical-features" aria-hidden="true" clipPath="url(#physical-land)">
      {rivers.map((r) => <g key={r.name}><path className="river-fertility" d={r.path}/><path className="river-bank-light" d={r.path}/><path className="map-river" d={r.path}/></g>)}
      {lakes.map((lake) => <path key={lake.name} className="map-lake" d={lake.path} />)}
    </g>
    </g>
    <g className="map-water-labels" aria-hidden="true" pointerEvents="none">{[
      {text:'Mediterranean\nSea',at:[190,402] as const,angle:-12},{text:'Black Sea',at:[295,91] as const,angle:0},
      {text:'Caspian Sea',at:[796,253] as const,angle:70},{text:'Persian Gulf',at:[755,606] as const,angle:24},
    ].map(({text,at,angle})=>{
      const [x,y]=projection.point(at)
      return <text key={text} className="water-label" x={x} y={y} transform={perspective?undefined:`rotate(${angle} ${x} ${y})`}>{text.split('\n').map((line,i)=><tspan key={i} x={x} dy={i?20:0}>{line}</tspan>)}</text>
    })}</g>
    {perspective&&<BabyloniaScenery objects={scenery}/>}
    <g transform={projection.groundTransform}>
    <g className="map-borders" aria-hidden="true">
      <path className="province-division" d={borders.provinces} />
      <path className="state-division detail-fade" d={borders.divisions} style={{opacity:level==='dominion'?0:1}}/>
      <g mask="url(#water-border-mask)">{borders.dominions.filter(d=>d.path).map((dominion) => <path key={dominion.id} className="dominion-border" data-state={dominion.id} d={dominion.path} stroke={factions.find((f) => f.id === dominion.owner)?.color} clipPath={`url(#state-clip-${dominion.id})`} />)}</g>
      <path className="dominion-ink" d={borders.frontiers} />
      {province && <><g className="province-highlight">{province.stateIds.filter(id=>id!==state?.id).map((id) => <polygon key={id} points={game.states.find((s)=>s.id===id)!.shape} />)}</g><path className="selected-province-border" data-province={province.id} d={province.borderPath} /></>}
      {state && <polygon className="state-selection" points={state.shape} />}
    </g>
    </g>
    <g className="map-settlements detail-fade" style={{opacity:level==='dominion'?0:1}} aria-hidden="true">{game.settlements.filter(p=>!seatIds.has(p.id)&&!provinceSeatIds.has(p.id)&&!illustratedSeats.has(p.id)&&(level==='state'||p.stateId===state?.id)).map((p) => {
      const [x,y]=projection.point([p.x,p.y])
      return <g key={p.id} data-settlement={p.id} data-state={p.stateId}>
      {p.kind==='fort' ? <rect x={x-2.3/scale} y={y-2.3/scale} width={4.6/scale} height={4.6/scale} /> : <circle cx={x} cy={y} r={p.kind==='port'?2.9/scale:2.3/scale} />}
      <title>{p.name} · {p.kind}</title>
    </g>})}</g>
    <g className="map-province-seats detail-fade" style={{opacity:level==='dominion'?0:1}} aria-hidden="true">{provinceSeats.filter(({settlement:p})=>!seatIds.has(p.id)).map(({province,settlement:p})=>{
      const [x,y]=markerAt(p.x,p.y,p.id)
      return <g key={province.id} data-province={province.id} data-settlement={p.id} transform={`translate(${x} ${y}) scale(${1/scale})`}>
      <title>{province.name} main settlement · {p.name}</title><circle r="4.5"/><circle className="province-seat-center" r="1.8"/>
    </g>})}</g>
    <g className="map-faction-seats" aria-hidden="true">{seats.map(({faction:f,settlement:p}) => {
      const [x,y]=markerAt(p.x,p.y,p.id)
      return <g key={f.id} data-faction={f.id} data-settlement={p.id} className="faction-seal" color={f.color} transform={`translate(${x} ${y}) scale(${1/scale})`}>
      <title>{f.name} principal seat · {p.name}</title><circle className="capital-outer" r="13"/><circle className="seal-ring" r="10" /><use href={`#seal-${factionSymbols[f.id].symbol}`} x="-8" y="-8" width="16" height="16" />
    </g>})}</g>
    <g className={`map-labels map-${level}-labels detail-fade`} style={{opacity:level==='dominion'?0:1}} aria-hidden="true">{visible.filter(label => label.kind !== 'local').map((label) => <text key={`${label.kind}-${label.id}`} data-label-id={label.id} className={`${label.kind}-label ${label.id===state?.id?'active-state':''}`} x={label.x} y={label.y}
      textAnchor="middle" style={{fontSize:label.size/scale,strokeWidth:2.8/scale}}>{labelLines(label.text).map((line,i) => <tspan key={i} x={label.x} dy={i===0?0:label.size*1.15/scale}>{line}</tspan>)}</text>)}</g>
    <g className="map-labels map-dominion-labels detail-fade" style={{opacity:level==='dominion'?1:0}} aria-hidden="true">{visibleDominions.map(label=><text key={`${label.kind}-${label.id}`} className={`${label.kind}-label`} x={label.x} y={label.y} textAnchor="middle" style={{fontSize:label.size/scale,strokeWidth:2.8/scale}}>{labelLines(label.text).map((line,i)=><tspan key={i} x={label.x} dy={i===0?0:label.size*1.15/scale}>{line}</tspan>)}</text>)}</g>
    <g className="map-armies detail-fade" style={{opacity:level==='dominion'?0:1}} aria-hidden="true">{game.commanders.filter(c=>c.troops>0).map((c)=>{
      const at=game.states.find(p=>p.id===c.locationStateId)!,active=c.id===commander?.id
      const settlement=game.settlements.find(p=>p.stateId===at.id)
      const [x,y]=projection.point([settlement?.x??at.labelX,settlement?.y??at.labelY])
      const offset=settlement&&illustratedSeats.has(settlement.id)?32:19
      return <g key={c.id} data-commander={c.id} data-state={at.id} transform={`translate(${x+offset/scale} ${y-13/scale}) scale(${1/scale})`} className={active?'active-army':''} color={factions.find(f=>f.id===c.faction)?.color}>
        <title>{c.name} · {at.name} · {c.troops} troops</title><path d="M0 13V-5H12L9 0L12 5H0"/>{level==='state'&&<text x="4" y="23">{c.troops}</text>}
      </g>
    })}</g>
    <g className="map-local-details" pointerEvents="none" aria-hidden="true" data-state={state?.id}>{visible.filter(label => label.kind === 'local').map(label => <text key={label.id} x={label.x} y={label.y} textAnchor="middle" style={{fontSize:label.size/scale,strokeWidth:2/scale}}>{labelLines(label.text).map((line,i)=><tspan key={i} x={label.x} dy={i===0?0:label.size*1.15/scale}>{line}</tspan>)}</text>)}</g>
  </svg>
}
