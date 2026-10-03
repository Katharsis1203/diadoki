import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { GameState } from '../game/data'
import { factions, project } from '../game/data'
import { babyloniaWaterways } from '../game/babyloniaTerrain'
import { factionSymbols } from '../game/factionSymbols'
import { politicalBorderPaths, politicalLabelAnchors } from '../game/politicalGeography'
import { mapBorderPaths, stateBounds } from '../game/geography'
import { coreRiverFootprints } from '../game/terrainBackbone'
import { WorldLabels } from './WorldLabels'
import { worldRiverLabels } from '../game/worldLabels'
import { TheatreBorders, TheatreLabels, TheatreTerritories } from './TheatreDistricts'
import { mapBounds } from '../game/worldTerrain'
import { physicalGround } from '../game/physicalLand'
import type { MapSettings } from '../game/mapSettings'
import { GroundFallback } from './GroundFallback'
import { CachedGround } from './CachedGround'
import { useCachedGround } from './useCachedGround'
import { boxesOverlap, labelLines, MAP_HEIGHT, MAP_WIDTH, visibleLabels } from '../game/mapView'
import { mapProjection } from '../game/mapProjection'
import type { MapPoint } from '../game/mapProjection'
import { sceneryObjects } from '../game/babyloniaScenery'
import { prepareMapScene } from '../game/mapScene'
import { boundsIntersect, mapViewport } from '../game/mapViewport'
import type { Camera, MapLevel } from '../game/mapView'
import { TerrainLayer } from './TerrainLayer'
import { BabyloniaScenery } from './BabyloniaScenery'
import { BabyloniaSurface } from './BabyloniaSurface'
import { CoreTerrainGround, OverviewRanges } from './CoreTerrain'
import { ContextLand, MapBorders, OwnershipLayer, PhysicalFeatures, StateTerritories, StaticMapDefinitions, WaterLabels } from './MapLayers'

type Props = {
  game: GameState
  settings:MapSettings
  camera: Camera
  level: MapLevel
  terrainLevel?: MapLevel
  onSelect: (id: string) => void
  selectedDraftId: string | null
  onSelectDraft: (id: string) => void
  onBackground: () => void
  onZoom: (factor: number, anchor?: MapPoint) => void
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void
  onPointerUp: () => void
  suppressClick: React.RefObject<boolean>
}

const WHEEL_ZOOM_SENSITIVITY = .0015

export function CampaignMap({ game, camera, settings, level, terrainLevel, onSelect, selectedDraftId, onSelectDraft, onBackground, onZoom, onPointerDown, onPointerMove, onPointerUp, suppressClick }: Props) {
  const perspective = true
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
  const theatreEnabled = new URLSearchParams(window.location.search).get('provinces')!=='core'
  const view=mapViewport({x:centreX,y:centreY,zoom},projection,scale,size)
  const projectedView={left:view.left,right:view.right,top:projection.point([0,view.top])[1],bottom:projection.point([0,view.bottom])[1]}
  const worldLabelCandidates=worldRiverLabels.map(r=>{
    const [x,y]=projection.point(r.position)
    return {id:r.id,text:r.text,x,y,size:12,priority:1,kind:'local' as const}
  }).filter(p=>boundsIntersect({left:p.x-10,right:p.x+10,top:p.y-10,bottom:p.y+10},projectedView))
  const [cropX,cropY]=projection.point([mapBounds.left,mapBounds.top]),[cropRight,cropBottom]=projection.point([mapBounds.right,mapBounds.bottom])
  const cropWidth=cropRight-cropX,cropHeight=cropBottom-cropY
  const [cameraX,cameraY] = projection.point([centreX,centreY])
  const ground=useCachedGround(view,scale,level,settings.cachedGround&&new URLSearchParams(window.location.search).get('ground')!=='vector',settings.groundShading)
  const { states, provinces, settlements, commanders, selectedStateId, selectedCommanderId } = game
  const preparedScenery=useMemo(()=>sceneryObjects(mapProjection(true),zoom,scale,level,states,settings),[states,zoom,scale,level,settings])
  const scene = useMemo(() => prepareMapScene({states,provinces,settlements,commanders,selectedStateId,selectedCommanderId}, mapProjection(perspective), zoom, scale, level, perspective, theatreEnabled, settings, preparedScenery),
    [states,provinces,settlements,commanders,selectedStateId,selectedCommanderId,zoom,scale,level,perspective,theatreEnabled,settings,preparedScenery])
  const { objects, simpleCentres, illustratedSeats, state, province, commander, seats, seatIds, provinceSeats, provinceSeatIds, markerAt, labels, localDetails, dominionLabels:coreDominionLabels, obstacles, cityObstacles, ridgeObstacles } = scene
  const borders = useMemo(() => theatreEnabled?politicalBorderPaths(states):mapBorderPaths(states), [states,theatreEnabled])
  const politicalAnchors=useMemo(()=>settings.labels?politicalLabelAnchors(states):[],[states,settings.labels])
  const dominionLabels=!settings.labels||level!=='dominion'?[]:theatreEnabled?[
    ...coreDominionLabels.filter(l=>l.kind==='city'),
    ...politicalAnchors.map(({faction:f,at,alternatives})=>{
      const [x,y]=projection.point(at)
      return {id:f.id,text:f.name,x,y,size:f.kind==='successor'?20:12,priority:f.kind==='successor'?6:3,kind:'dominion' as const,
        alternatives:alternatives.map(point=>{const [ax,ay]=projection.point(point);return {x:ax,y:ay}})}
    }),
  ]:coreDominionLabels
  const maskedRivers=useMemo(()=>{
    const bounds=states.map(s=>stateBounds(s.id))
    return coreRiverFootprints.filter(r=>bounds.some(b=>boundsIntersect(b,r.bounds))).map(r=>r.river)
  },[states])
  const inView = (x:number,y:number) => x>=projectedView.left&&x<=projectedView.right&&y>=projectedView.top&&y<=projectedView.bottom
  const visibleRelief = ridgeObstacles.filter(box=>inView((box.left+box.right)/2,(box.top+box.bottom)/2))
  const visible = settings.labels&&level!=='dominion'?visibleLabels([...labels, ...localDetails].filter(p=>inView(p.x,p.y)),scale,[...obstacles,...cityObstacles],visibleRelief):[]
  const visibleDominions=settings.labels&&level==='dominion'?visibleLabels(dominionLabels.filter(p=>inView(p.x,p.y)).map(p=>zoom<.65&&p.size>16&&p.kind==='dominion'?{...p,size:16}:p),scale,obstacles):[]
  // Keep names/markers readable by hiding overlapping small decoration, rather
  // than moving authored ground positions. Primary centres reserve label space.
  const labelBoxes=visible.map(label=>{
    const lines=labelLines(label.text),width=Math.max(...lines.map(l=>l.length))*label.size*.6/scale
    return {left:label.x-width/2-3/scale,right:label.x+width/2+3/scale,top:label.y-label.size/scale,bottom:label.y+(lines.length-1)*label.size*1.15/scale+4/scale}
  })
  const fixedSceneryObstacles = [...obstacles,...cityObstacles]
  const decorativeObstacles = [...labelBoxes,...fixedSceneryObstacles]
  const dominionBoxes=visibleDominions.map(label=>{
    const lines=labelLines(label.text),width=Math.max(...lines.map(line=>line.length))*label.size*.7/scale
    return {left:label.x-width/2-3/scale,right:label.x+width/2+3/scale,top:label.y-label.size/scale,bottom:label.y+(lines.length-1)*label.size*1.15/scale+4/scale}
  })
  const extraLabelObstacles=level==='dominion'?[...dominionBoxes,...obstacles]:[...labelBoxes,...fixedSceneryObstacles]
  const worldLabels=settings.labels&&settings.waterways?visibleLabels(worldLabelCandidates,scale,extraLabelObstacles):[]
  const worldLabelBoxes=worldLabels.map(p=>({left:p.x-p.text.length*p.size*.32/scale-3/scale,right:p.x+p.text.length*p.size*.32/scale+3/scale,top:p.y-p.size/scale-2/scale,bottom:p.y+5/scale}))
  const scenery=objects.filter(o=>inView(o.x,o.y)&&(o.placement.asset==='settlement'||
    // Labels have their own ink halo above relief. Keep ridges connected rather
    // than removing a whole peak for every district caption.
    !(o.placement.rangeId?fixedSceneryObstacles:decorativeObstacles).some(box=>boxesOverlap(o.box,box))))
  return <svg ref={svg} className={`campaign-map map-level-${level}`} data-ground-renderer={ground.ready?'cached':ground.available.length?'partial-cache':ground.geometry?'vector-fallback':'vector'} data-level={level} data-perspective={perspective?'2.5d':'flat'} data-zoom={zoom.toFixed(3)}
    viewBox={`${cameraX - MAP_WIDTH / (2 * zoom)} ${cameraY - MAP_HEIGHT / (2 * zoom)} ${MAP_WIDTH / zoom} ${MAP_HEIGHT / zoom}`}
    role="group" aria-label="Faction dominions contain provinces, composed of selectable states. Select a state for details. Drag to pan; use the mouse wheel to zoom; focus a province to issue orders."
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}
    onClick={() => { if (!suppressClick.current) onBackground() }}>
    <defs>
      <StaticMapDefinitions states={game.states}/>
      <clipPath id="map-theatre-clip"><rect x={cropX} y={cropY} width={cropWidth} height={cropHeight}/></clipPath>
      <pattern id="margin-grain" width="256" height="256" patternUnits="userSpaceOnUse" patternTransform={`scale(${1/scale})`}>
        <image href={`${import.meta.env.BASE_URL}textures/parchment-grain.png`} width="256" height="256"/>
      </pattern>
      <clipPath id="physical-land"><path d={ground.geometry?.landPath??physicalGround.landPath} clipRule="evenodd"/></clipPath>
      <pattern id="land-grain" width="256" height="256" patternUnits="userSpaceOnUse" patternTransform={`scale(${1/scale} ${1/(scale*projection.yScale)})`}>
        <image href={`${import.meta.env.BASE_URL}textures/parchment-grain.png`} width="256" height="256"/>
      </pattern>
      {settings.waterways&&<mask id="water-border-mask" maskUnits="userSpaceOnUse" x={view.left} y={view.top} width={view.right-view.left} height={view.bottom-view.top}><rect x={view.left} y={view.top} width={view.right-view.left} height={view.bottom-view.top} fill="white"/>{maskedRivers.map(r=><path key={r.id} d={r.path} fill="none" stroke="black" strokeWidth={(r.width+1.35)/scale}/>)}{level!=='dominion'&&babyloniaWaterways.filter(f=>f.detail==='regional').map(f=><path key={f.id} d={`M${f.points.map(project).map(p=>p.join(',')).join('L')}`} fill="none" stroke="black" strokeWidth={1.2/scale}/>)}</mask>}
    </defs>
    <rect className="map-margin" x={projectedView.left} y={projectedView.top} width={projectedView.right-projectedView.left} height={projectedView.bottom-projectedView.top} pointerEvents="none"/>
    {settings.paperGrain&&<rect x={projectedView.left} y={projectedView.top} width={projectedView.right-projectedView.left} height={projectedView.bottom-projectedView.top} fill="url(#margin-grain)" opacity=".28" pointerEvents="none"/>}
    <g className="map-theatre" clipPath="url(#map-theatre-clip)">
    <rect x={cropX} y={cropY} width={cropWidth} height={cropHeight} className="map-sea" />
    <rect x={cropX} y={cropY} width={cropWidth} height={cropHeight} fill="url(#sea-engraving)" />
    <g className="map-ground" transform={projection.groundTransform}>
    {ground.geometry?<><GroundFallback ground={ground} camera={{x:centreX,y:centreY}} scale={scale} yScale={projection.yScale} size={size} level={level} shading={settings.groundShading}/>
      <CachedGround ground={ground} camera={{x:centreX,y:centreY}} scale={scale} yScale={projection.yScale} size={size}/></>:<ContextLand/>}
    {theatreEnabled&&<TheatreTerritories view={view} selectedId={selectedDraftId} battle={!!game.battle} onSelect={onSelectDraft} suppressClick={suppressClick}/>}
    <StateTerritories states={game.states} provinces={game.provinces} selectedId={state?.id} battle={!!game.battle} onSelect={onSelect} suppressClick={suppressClick}/>
    <TerrainLayer view={view} shading={settings.groundShading} detailEnabled={settings.groundDetail} vegetation={settings.vegetation} waterways={settings.waterways} zoom={zoom} scale={scale} override={terrainLevel} sceneryPrototype={perspective} cachedGround={!!ground.geometry}/>
    {!ground.geometry&&settings.groundShading&&<CoreTerrainGround view={view}/>}
    <BabyloniaSurface shading={settings.groundShading} detailEnabled={settings.groundDetail} level={level} cachedGround={!!ground.geometry}/>
    {settings.ownershipFills&&<OwnershipLayer states={game.states} view={view} atlas={theatreEnabled}/>}
    {settings.paperGrain&&<rect className="map-paper-grain" x={view.left} y={view.top} width={view.right-view.left} height={view.bottom-view.top} fill="url(#land-grain)" clipPath="url(#physical-land)" pointerEvents="none" aria-hidden="true"/>}
    <PhysicalFeatures shading={settings.groundShading} waterways={settings.waterways} view={view} cachedGround={!!ground.geometry}/>
    </g>
    {settings.labels&&settings.waterways&&<WaterLabels projection={projection} perspective={perspective} scale={scale}/>}
    {level==='dominion'&&settings.mountains&&<OverviewRanges projection={projection} view={view}/>}
    <BabyloniaScenery objects={scenery}/>
    <g className="map-primary-centres map-settlements" pointerEvents="none" aria-hidden="true">
      {simpleCentres.filter(o=>o.placement.asset==='settlement'&&!seatIds.has(o.placement.settlementId??'')&&inView(o.x,o.y)).map(o=><circle key={o.placement.id} data-simple-centre={o.placement.id} cx={o.x} cy={o.y} r={2.3/scale}/>)}
    </g>
    {theatreEnabled&&<TheatreBorders view={view} selectedId={selectedDraftId} projection={projection} level={level} provinceBorders={settings.provinceBorders} stateBorders={settings.stateBorders}/>}
    <MapBorders borders={borders} view={view} states={game.states} state={state} province={province} projection={projection} provinceBorders={settings.provinceBorders} stateBorders={settings.stateBorders} waterways={settings.waterways} dominion={level==='dominion'}/>
    <WorldLabels labels={worldLabels} scale={scale}/>
    {theatreEnabled&&<TheatreLabels view={view} selectedId={selectedDraftId} projection={projection} scale={scale} labelsEnabled={settings.labels} level={level} obstacles={[...extraLabelObstacles,...worldLabelBoxes]}/>}
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
    </g>
    <rect className="map-theatre-edge" x={cropX} y={cropY} width={cropWidth} height={cropHeight} pointerEvents="none" aria-hidden="true"/>
  </svg>
}
