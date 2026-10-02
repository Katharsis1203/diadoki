import { memo } from 'react'
import type { RefObject } from 'react'
import type { GameState, Province, TerritoryState } from '../game/data'
import { factions, project } from '../game/data'
import { ownerName } from '../game/engine'
import { mapBorderPaths } from '../game/geography'
import { worldLandPath as landPath } from '../game/worldMapGeometry'
import { physicalLakes as lakes } from '../game/physicalLand'
import { coreRiverFootprints } from '../game/terrainBackbone'
import type { MapProjection } from '../game/mapProjection'
import { FactionSealSymbols } from './FactionSeals'
import { TerrainSymbols } from './TerrainLayer'
import { ScenerySymbols } from './BabyloniaScenery'
import { SurfaceSymbols } from './BabyloniaSurface'
import { boundsIntersect } from '../game/mapViewport'
import type { LabelBox } from '../game/mapView'

// Separate immutable geography/artwork from camera-dependent labels and size.
// React can retain these SVG subtrees across pan and unrelated UI updates.
export const StaticMapDefinitions = memo(function StaticMapDefinitions({states}:{states:readonly TerritoryState[]}) {
  return <>
      <linearGradient id="sea-wash" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="180" y2="700"><stop stopColor="#92bfb8" /><stop offset="1" stopColor="#6ba3ad" /></linearGradient>
      <linearGradient id="land-wash" gradientUnits="userSpaceOnUse" x1="200" y1="80" x2="600" y2="700"><stop stopColor="#e9d8b0" /><stop offset=".55" stopColor="#ddc393"/><stop offset="1" stopColor="#d5b37d" /></linearGradient>
      <pattern id="sea-engraving" width="90" height="42" patternUnits="userSpaceOnUse"><path d="M8 12q12 -4 24 0t24 0M45 33q12 -4 24 0t24 0" fill="none" stroke="#467e90" strokeOpacity=".065" strokeWidth=".6" /></pattern>
      <FactionSealSymbols /><TerrainSymbols /><ScenerySymbols /><SurfaceSymbols />
      {states.map((p) => <clipPath key={p.id} id={`state-clip-${p.id}`}><polygon points={p.shape} /></clipPath>)}
      <clipPath id="physical-land"><path d={landPath} clipRule="evenodd"/></clipPath>
  </>
})

export const ContextLand = memo(function ContextLand() {
  return (
    <g aria-hidden="true" className="map-context">
      <path className="map-coastal-shallows" d={landPath} fillRule="evenodd"/>
      <path className="map-land context-land" d={landPath} fillRule="evenodd" />
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

export const OwnershipLayer = memo(function OwnershipLayer({states}:{states:readonly TerritoryState[]}) {
  return (
    <g className="map-ownership" aria-hidden="true" pointerEvents="none">
      {states.map(p=><polygon key={p.id} data-owner={p.owner} data-state={p.id} points={p.shape} fill={factions.find(f=>f.id===p.owner)?.color}/>) }
    </g>
  )
})

const riverArtwork=coreRiverFootprints.map(({river:r,bounds})=>({bounds,artwork:<g key={r.id} data-river={r.id}><title>{r.name}</title>
  {r.source==='existing'?<path className="river-fertility" d={r.path}/>:<>
    <path d={r.path} fill="none" stroke="#638553" strokeWidth="9" strokeOpacity=".055" strokeLinejoin="round"/>
    <path d={r.path} fill="none" stroke="#638553" strokeWidth="4.5" strokeOpacity=".075" strokeLinejoin="round"/>
  </>}
  <path className="river-bank-light" d={r.path} style={{strokeWidth:r.width+.55}}/>
  <path className="map-river" d={r.path} style={{strokeWidth:r.width}}/>
</g>}))
export const PhysicalFeatures = memo(function PhysicalFeatures({view}:{view:LabelBox}) {
  return (
    <g className="map-physical-features" aria-hidden="true" pointerEvents="none" clipPath="url(#physical-land)">
      {riverArtwork.filter(r=>boundsIntersect(r.bounds,view)).map(r=>r.artwork)}
      {lakes.map((lake) => <path key={lake.name} className="map-lake" d={lake.path} />)}
    </g>
  )
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
  borders: ReturnType<typeof mapBorderPaths>
  states: GameState['states']
  state?: TerritoryState
  province?: Province
  projection: MapProjection
  dominion: boolean
}
export const MapBorders = memo(function MapBorders({borders,states,state,province,projection,dominion}:BorderProps) {
  return (
    <g transform={projection.groundTransform}>
    <g className="map-borders" aria-hidden="true">
      <path className="province-division" d={borders.provinces} />
      <path className="state-division detail-fade" d={borders.divisions} style={{opacity:dominion?0:1}}/>
      <g mask="url(#water-border-mask)">{borders.dominions.filter(d=>d.path).map((dominion) => <path key={dominion.id} className="dominion-border" data-state={dominion.id} d={dominion.path} stroke={factions.find((f) => f.id === dominion.owner)?.color} clipPath={`url(#state-clip-${dominion.id})`} />)}</g>
      <g>{borders.dominions.filter(d=>d.path).map(d=><path key={d.id} className="dominion-edge" d={d.path} stroke={factions.find(f=>f.id===d.owner)?.color} clipPath={`url(#state-clip-${d.id})`}/>)}</g>
      <path className="dominion-ink" d={borders.frontiers} />
      {province && <><g className="province-highlight">{province.stateIds.filter(id=>id!==state?.id).map((id) => <polygon key={id} points={states.find((s)=>s.id===id)!.shape} />)}</g><path className="selected-province-border" data-province={province.id} d={province.borderPath} /></>}
      {state && <polygon className="state-selection" points={state.shape} />}
    </g>
    </g>
  )
})
