import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { GameState } from '../game/data'
import { factions, project } from '../game/data'
import { babyloniaWaterways } from '../game/babyloniaTerrain'
import { factionSymbols } from '../game/factionSymbols'
import { mapBorderPaths } from '../game/geography'
import { coreRiverFootprints } from '../game/terrainBackbone'
import { WorldLabels } from './WorldLabels'
import { boxesOverlap, labelLines, MAP_HEIGHT, MAP_WIDTH, visibleLabels } from '../game/mapView'
import { mapProjection } from '../game/mapProjection'
import type { MapPoint } from '../game/mapProjection'
import { prepareMapScene } from '../game/mapScene'
import { boundsIntersect, mapViewport, pointBounds } from '../game/mapViewport'
import type { Camera, MapLevel } from '../game/mapView'
import { TerrainLayer } from './TerrainLayer'
import { BabyloniaScenery } from './BabyloniaScenery'
import { BabyloniaSurface } from './BabyloniaSurface'
import { CoreTerrainGround, OverviewRanges } from './CoreTerrain'
import { ContextLand, MapBorders, OwnershipLayer, PhysicalFeatures, StateTerritories, StaticMapDefinitions, WaterLabels } from './MapLayers'

type Props = {
  game: GameState
  camera: Camera
  level: MapLevel
  terrainLevel?: MapLevel
  perspective?: boolean
  onSelect: (id: string) => void
  onBackground: () => void
  onZoom: (factor: number, anchor?: MapPoint) => void
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void
  onPointerUp: () => void
  suppressClick: React.RefObject<boolean>
}

const WHEEL_ZOOM_SENSITIVITY = .0015

export function CampaignMap({ game, camera, level, terrainLevel, perspective=false, onSelect, onBackground, onZoom, onPointerDown, onPointerMove, onPointerUp, suppressClick }: Props) {
  const {x:centreX,y:centreY,zoom}=camera
  const svg = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 1440, height: 900 })
  const wheelZoom = useEffectEvent((event: WheelEvent) => {
    const map = svg.current
    if (!map || event.deltaY === 0) return
    const matrix = map.getScreenCTM()
    if (!matrix) return
    event.preventDefault()
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const anchor = mapProjection(perspective).inverse([point.x, point.y])
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? map.clientHeight : 1
    const delta = Math.max(-200, Math.min(200, event.deltaY * unit))
    onZoom(Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY), anchor)
  })
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    if (svg.current) observer.observe(svg.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const map = svg.current
    if (!map) return
    const wheel = (event: WheelEvent) => wheelZoom(event)
    // A non-passive listener lets map zoom consume the wheel without page scrolling.
    map.addEventListener('wheel', wheel, { passive: false })
    return () => map.removeEventListener('wheel', wheel)
  }, [])
  const scale = Math.min(size.width / MAP_WIDTH, size.height / MAP_HEIGHT) * zoom
  const projection = mapProjection(perspective)
  const view=mapViewport({x:centreX,y:centreY,zoom},projection,scale,size)
  const projectedView={left:view.left,right:view.right,top:projection.point([0,view.top])[1],bottom:projection.point([0,view.bottom])[1]}
  const [cameraX,cameraY] = projection.point([centreX,centreY])
  const { states, provinces, settlements, commanders, selectedStateId, selectedCommanderId } = game
  const scene = useMemo(() => prepareMapScene({states,provinces,settlements,commanders,selectedStateId,selectedCommanderId}, projection, zoom, scale, level, perspective),
    [states,provinces,settlements,commanders,selectedStateId,selectedCommanderId,projection,zoom,scale,level,perspective])
  const { objects, illustratedSeats, state, province, commander, seats, seatIds, provinceSeats, provinceSeatIds, markerAt, labels, localDetails, dominionLabels, obstacles, cityObstacles, ridgeObstacles } = scene
  const borders = useMemo(() => mapBorderPaths(game.states), [game.states])
  const maskedRivers=useMemo(()=>{
    const bounds=states.map(s=>pointBounds(s.shape.split(' ').map(p=>p.split(',').map(Number) as [number,number])))
    return coreRiverFootprints.filter(r=>bounds.some(b=>boundsIntersect(b,r.bounds))).map(r=>r.river)
  },[states])
  const inView = (x:number,y:number) => x>=projectedView.left&&x<=projectedView.right&&y>=projectedView.top&&y<=projectedView.bottom
  const visibleRelief = ridgeObstacles.filter(box=>inView((box.left+box.right)/2,(box.top+box.bottom)/2))
  const visible = visibleLabels([...labels, ...localDetails].filter(p=>inView(p.x,p.y)),scale,[...obstacles,...cityObstacles],visibleRelief)
  const visibleDominions=visibleLabels(dominionLabels.filter(p=>inView(p.x,p.y)).map(p=>zoom<.65&&p.kind==='dominion'?{...p,size:16}:p),scale,obstacles)
  // Keep names/markers readable by hiding overlapping small decoration, rather
  // than moving authored ground positions. Primary centres reserve label space.
  const labelBoxes=visible.map(label=>{
    const lines=labelLines(label.text),width=Math.max(...lines.map(l=>l.length))*label.size*.6/scale
    return {left:label.x-width/2-3/scale,right:label.x+width/2+3/scale,top:label.y-label.size/scale,bottom:label.y+(lines.length-1)*label.size*1.15/scale+4/scale}
  })
  const fixedSceneryObstacles = [...obstacles,...cityObstacles]
  const decorativeObstacles = [...labelBoxes,...fixedSceneryObstacles]
  const dominionBoxes=visibleDominions.map(label=>({left:label.x-label.text.length*label.size*.3/scale,right:label.x+label.text.length*label.size*.3/scale,top:label.y-label.size/scale,bottom:label.y+4/scale}))
  const scenery=objects.filter(o=>inView(o.x,o.y)&&(o.placement.asset==='settlement'||
    // Labels have their own ink halo above relief. Keep ridges connected rather
    // than removing a whole peak for every district caption.
    !(o.placement.rangeId?fixedSceneryObstacles:decorativeObstacles).some(box=>boxesOverlap(o.box,box))))
  return <svg ref={svg} className={`campaign-map map-level-${level}`} data-level={level} data-perspective={perspective?'2.5d':'flat'} data-zoom={zoom.toFixed(3)}
    viewBox={`${cameraX - MAP_WIDTH / (2 * zoom)} ${cameraY - MAP_HEIGHT / (2 * zoom)} ${MAP_WIDTH / zoom} ${MAP_HEIGHT / zoom}`}
    role="group" aria-label="Faction dominions contain provinces, composed of selectable states. Select a state for details. Drag to pan; use the mouse wheel to zoom; focus a province to issue orders."
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}
    onClick={() => { if (!suppressClick.current) onBackground() }}>
    <defs>
      <StaticMapDefinitions states={game.states}/>
      <pattern id="land-grain" width="256" height="256" patternUnits="userSpaceOnUse" patternTransform={`scale(${1/scale} ${1/(scale*projection.yScale)})`}>
        <image href={`${import.meta.env.BASE_URL}textures/parchment-grain.png`} width="256" height="256"/>
      </pattern>
      <mask id="water-border-mask" maskUnits="userSpaceOnUse" x={view.left} y={view.top} width={view.right-view.left} height={view.bottom-view.top}><rect x={view.left} y={view.top} width={view.right-view.left} height={view.bottom-view.top} fill="white"/>{maskedRivers.map(r=><path key={r.id} d={r.path} fill="none" stroke="black" strokeWidth={(r.width+1.35)/scale}/>)}{level!=='dominion'&&babyloniaWaterways.filter(f=>f.detail==='regional').map(f=><path key={f.id} d={`M${f.points.map(project).map(p=>p.join(',')).join('L')}`} fill="none" stroke="black" strokeWidth={1.2/scale}/>)}</mask>
    </defs>
    <rect x="-10000" y="-10000" width="20000" height="20000" className="map-sea" />
    <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#sea-engraving)" />
    <g className="map-ground" transform={projection.groundTransform}>
    <ContextLand/>
    <StateTerritories states={game.states} provinces={game.provinces} selectedId={state?.id} battle={!!game.battle} onSelect={onSelect} suppressClick={suppressClick}/>
    <TerrainLayer zoom={zoom} scale={scale} override={terrainLevel} sceneryPrototype={perspective}/>
    <CoreTerrainGround view={view}/>
    <BabyloniaSurface level={level}/>
    <OwnershipLayer states={game.states}/>
    <rect className="map-paper-grain" x={view.left} y={view.top} width={view.right-view.left} height={view.bottom-view.top} fill="url(#land-grain)" clipPath="url(#physical-land)" pointerEvents="none" aria-hidden="true"/>
    <PhysicalFeatures view={view}/>
    </g>
    <WaterLabels projection={projection} perspective={perspective} scale={scale}/>
    {(level==='dominion'||!perspective)&&<OverviewRanges projection={projection}/>}
    {perspective&&<BabyloniaScenery objects={scenery}/>}
    <MapBorders borders={borders} states={game.states} state={state} province={province} projection={projection} dominion={level==='dominion'}/>
    <WorldLabels projection={projection} scale={scale} view={projectedView} obstacles={level==='dominion'?[...dominionBoxes,...obstacles]:[...labelBoxes,...fixedSceneryObstacles]} wide={zoom<.65}/>
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
