import { memo } from 'react'
import type { RefObject } from 'react'
import type { GameState, Province, TerritoryState } from '../game/data'
import { atlasStates, politicalBorderPaths } from '../game/politicalGeography'
import { mapFactionById } from '../game/politicalContent'
import { factions, project } from '../game/data'
import { ownerName } from '../game/engine'
import { mapBorderPaths, stateBounds } from '../game/geography'
import { physicalGround, physicalLakes as lakes } from '../game/physicalLand'
import { coreRiverFootprints } from '../game/terrainBackbone'
import type { MapProjection } from '../game/mapProjection'
import { FactionSealSymbols } from './FactionSeals'
import { TerrainSymbols } from './TerrainLayer'
import { ScenerySymbols } from './BabyloniaScenery'
import { SurfaceSymbols } from './BabyloniaSurface'
import { boundsIntersect } from '../game/mapViewport'
import type { LabelBox } from '../game/mapView'
import type { GroundGeometry } from '../game/groundGeometry'

// Separate immutable geography/artwork from camera-dependent labels and size.
// React can retain these SVG subtrees across pan and unrelated UI updates.
export const StaticMapDefinitions = memo(function StaticMapDefinitions({states}:{states:readonly TerritoryState[]}) {
  return <>
      <linearGradient id="sea-wash" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="180" y2="700"><stop stopColor="#92bfb8" /><stop offset="1" stopColor="#6ba3ad" /></linearGradient>
      <linearGradient id="land-wash" gradientUnits="userSpaceOnUse" x1="200" y1="80" x2="600" y2="700"><stop stopColor="#e9d8b0" /><stop offset=".55" stopColor="#ddc393"/><stop offset="1" stopColor="#d5b37d" /></linearGradient>
      <pattern id="sea-engraving" width="90" height="42" patternUnits="userSpaceOnUse"><path d="M8 12q12 -4 24 0t24 0M45 33q12 -4 24 0t24 0" fill="none" stroke="#467e90" strokeOpacity=".065" strokeWidth=".6" /></pattern>
      <FactionSealSymbols /><TerrainSymbols /><ScenerySymbols /><SurfaceSymbols />
      {atlasStates.map(p=><clipPath key={p.id} id={`state-clip-${p.id}`}><path d={p.path} clipRule="evenodd"/></clipPath>)}
      {states.map((p) => <clipPath key={p.id} id={`state-clip-${p.id}`}><polygon points={p.shape} /></clipPath>)}
  </>
})

export const ContextLand = memo(function ContextLand({geometry}:{geometry?:GroundGeometry|null}) {
  const fill=geometry?.landPath??physicalGround.landPath,coast=geometry?.coastPath??physicalGround.coastPath
  return (
    <g aria-hidden="true" className="map-context">
      <path className="map-coastal-shallows" d={coast} fillRule="evenodd"/>
      <path className="map-land context-land" d={fill} fillRule="evenodd" style={{stroke:'none'}}/>
      <path d={coast} fill="none" stroke="#9c9876" strokeWidth=".65" strokeLinejoin="round"/>
    </g>
  )
})

type TerritoryProps = {
  states: readonly TerritoryState[]
  provinces: readonly Province[]
  selectedId?: string
  battle: boolean
  onSelect: (id:string) => void
  suppressClick: RefObject<boolean>
}
export const StateTerritories = memo(function StateTerritories({states,provinces,selectedId,battle,onSelect,suppressClick}:TerritoryProps) {
  return <>
    {states.map((p) => <g key={p.id} data-state={p.id} data-province={p.provinceId} role="button" tabIndex={battle ? -1 : 0}
      aria-label={`${p.name}, ${provinces.find((province) => province.id === p.provinceId)?.name}, ${ownerName(p.owner)}`}
      aria-pressed={selectedId === p.id} aria-disabled={!!battle} className={`territory-state ${selectedId === p.id ? 'selected' : ''}`}
      onClick={(event) => { event.stopPropagation(); if (!suppressClick.current) onSelect(p.id) }}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(p.id) } }}>
      <title>{p.name} · {provinces.find((province) => province.id === p.provinceId)?.name}</title>
      <polygon className="state-area" points={p.shape} />
    </g>)}
  </>
})

export const OwnershipLayer = memo(function OwnershipLayer({states,view,atlas=false}:{states:readonly TerritoryState[];view:LabelBox;atlas?:boolean}) {
  return (
    <g className="map-ownership" aria-hidden="true" pointerEvents="none">
      {atlas&&atlasStates.filter(s=>boundsIntersect(s.bounds,view)).map(s=><path key={s.id} data-atlas-state={s.id} data-owner={s.owner} d={s.path} fillRule="evenodd" fill={mapFactionById.get(s.owner)!.color}/>)}
      {states.filter(s=>boundsIntersect(stateBounds(s.id),view)).map(p=><polygon key={p.id} data-owner={p.owner} data-state={p.id} points={p.shape} fill={factions.find(f=>f.id===p.owner)?.color}/>) }
    </g>
  )
})

const riverArtwork=coreRiverFootprints.map(({river:r,bounds})=>({id:r.id,name:r.name,bounds,
  fertility:<g className="river-fertility-ground">{r.source==='existing'?<path className="river-fertility" d={r.path}/>:<>
    <path d={r.path} fill="none" stroke="#638553" strokeWidth="9" strokeOpacity=".055" strokeLinejoin="round"/>
    <path d={r.path} fill="none" stroke="#638553" strokeWidth="4.5" strokeOpacity=".075" strokeLinejoin="round"/>
  </>}</g>,
  water:<><path className="river-bank-light" d={r.path} style={{strokeWidth:r.width+.55}}/>
    <path className="map-river" d={r.path} style={{strokeWidth:r.width}}/></>,
}))
export const PhysicalFeatures = memo(function PhysicalFeatures({view,cachedGround=false,groundOnly=false,shading=true,waterways=true}:{view:LabelBox;cachedGround?:boolean;groundOnly?:boolean;shading?:boolean;waterways?:boolean}) {
  return <g className={`map-physical-features${cachedGround?' ground-fertility-cached':''}`} aria-hidden="true" pointerEvents="none" clipPath="url(#physical-land)">
    {riverArtwork.filter(r=>boundsIntersect({left:r.bounds.left-9,right:r.bounds.right+9,top:r.bounds.top-9,bottom:r.bounds.bottom+9},view)).map(r=><g key={r.id} data-river={r.id}>
      <title>{r.name}</title>{shading&&!cachedGround&&r.fertility}{!groundOnly&&waterways&&r.water}
    </g>)}
    {!groundOnly&&waterways&&lakes.map(lake=><path key={lake.name} className="map-lake" d={lake.path}/>)}
  </g>
})

export const WaterLabels = memo(function WaterLabels({projection,perspective,scale}:{projection:MapProjection;perspective:boolean;scale:number}) {
  const fontSize=Math.max(17,12/scale)
  return (
    <g className="map-water-labels" aria-hidden="true" pointerEvents="none">{[
      {text:'Mediterranean\nSea',at:project([22,33.3]),angle:-12},{text:'Black Sea',at:project([33.3,43.6]),angle:0},
      {text:'Caspian Sea',at:project([51.2,42.4]),angle:70},{text:'Persian Gulf',at:[755,606] as const,angle:24},
      {text:'Arabian Sea',at:project([65,20]),angle:0},{text:'Bay of Bengal',at:project([89.4,18.7]),angle:0},
    ].map(({text,at,angle})=>{
      const [x,y]=projection.point(at)
      return <text key={text} className="water-label" x={x} y={y} style={{fontSize}} transform={perspective?undefined:`rotate(${angle} ${x} ${y})`}>{text.split('\n').map((line,i)=><tspan key={i} x={x} dy={i?fontSize*1.2:0}>{line}</tspan>)}</text>
    })}</g>
  )
})

type BorderProps = {
  borders: Omit<ReturnType<typeof mapBorderPaths>,'dominions'> & {
    dominions:{id:string;owner:string;path:string;bounds?:LabelBox}[]
    frontierEdges?:ReturnType<typeof politicalBorderPaths>['frontierEdges']
  }
  view:LabelBox
  states: GameState['states']
  state?: TerritoryState
  province?: Province
  projection: MapProjection
  dominion: boolean
  provinceBorders?:boolean
  stateBorders?:boolean
  waterways?:boolean
}
export const MapBorders = memo(function MapBorders({borders,view,states,state,province,projection,dominion,provinceBorders=true,stateBorders=true,waterways=true}:BorderProps) {
  const outlines=borders.dominions.filter(d=>d.path&&(!d.bounds||boundsIntersect(d.bounds,view)))
  const frontier=borders.frontierEdges?borders.frontierEdges.filter(e=>boundsIntersect(e.bounds,view)).map(e=>e.path).join(''):borders.frontiers
  return (
    <g transform={projection.groundTransform}>
    <g className="map-borders" aria-hidden="true">
      {provinceBorders&&<path className="province-division" d={borders.provinces} />}
      {stateBorders&&!dominion&&<path className="state-division" d={borders.divisions}/> }
      <g mask={waterways?"url(#water-border-mask)":undefined}>{outlines.map((dominion) => <path key={dominion.id} className="dominion-border" data-state={dominion.id} d={dominion.path} stroke={mapFactionById.get(dominion.owner)?.color} clipPath={`url(#state-clip-${dominion.id})`} />)}</g>
      <g>{outlines.map(d=><path key={d.id} className="dominion-edge" d={d.path} stroke={mapFactionById.get(d.owner)?.color} clipPath={`url(#state-clip-${d.id})`}/>)}</g>
      <path className="dominion-ink" d={frontier} />
      {province && <><g className="province-highlight">{province.stateIds.filter(id=>id!==state?.id).map((id) => <polygon key={id} points={states.find((s)=>s.id===id)!.shape} />)}</g><path className="selected-province-border" data-province={province.id} d={province.borderPath} /></>}
      {state && <polygon className="state-selection" points={state.shape} />}
    </g>
    </g>
  )
})
