import { project } from './data.ts'
import type { TerritoryState } from './data.ts'
import { stateDefinitions } from './geographyContent.ts'
import type { MapPoint, MapProjection } from './mapProjection.ts'
import type { LabelBox, MapLevel } from './mapView.ts'
import { babyloniaRanges } from './babyloniaRanges.ts'
import { settlementAppearance } from './settlementAppearance.ts'
import type { SettlementTier } from './settlementAppearance.ts'

export type { SettlementTier } from './settlementAppearance.ts'
export type SceneryAsset = 'mountain' | 'hill' | 'trees' | 'reeds' | 'settlement'
type Placement = {
  id: string
  asset: SceneryAsset
  position: MapPoint
  scale: number
  variant?: 0 | 1 | 2
  detail?: boolean
  rangeId?: string
  settlementId?: string
}
// Visual designation only: capital status is independent of architectural tier
// and never consulted by combat, income, ownership or province rules.
export type SceneryPlacement = Placement & (
  { asset: 'settlement'; stateId: string; name: string; tier: SettlementTier; isCapital: boolean }
  | { asset: Exclude<SceneryAsset,'settlement'> }
)
export const SCENERY_SCALE = 1
const assetHeight = {city:28,fortress:28,village:16,homestead:12,mountain:36,hill:21,trees:34,reeds:24}
// Illustration footprint in canonical map space: Babylonia and adjacent eastern
// foothills. The existing engraved symbols remain elsewhere.
export const SCENERY_ZONE = { left: 530, top: 300, right: 755, bottom: 574 }
export const inSceneryZone = ([x,y]: MapPoint) => x>=SCENERY_ZONE.left && x<=SCENERY_ZONE.right && y>=SCENERY_ZONE.top && y<=SCENERY_ZONE.bottom

const primaryCentre = (centre: Omit<Extract<SceneryPlacement,{asset:'settlement'}>,'asset'|'tier'|'scale'>): SceneryPlacement => ({
  ...centre,asset:'settlement',...settlementAppearance(stateDefinitions.find(s=>s.id===centre.stateId)!.development,centre.isCapital),
})

// Authored anchor positions, converted once to the same map coordinates as the
// state mesh. No random sampling, camera-dependent placement or save mutation.
export const babyloniaScenery: readonly SceneryPlacement[] = ([
  // One primary centre for each test-province state. Borsippa and Larsa remain
  // secondary map references; surrounding provinces retain their existing dots.
  primaryCentre({id:'babylon-city-art',stateId:'babylon',name:'Babylon',isCapital:true,position:project([44.42,32.54]),variant:0,settlementId:'babylon-city'}),
  primaryCentre({id:'sippar-centre',stateId:'sippar',name:'Sippar',isCapital:false,position:project([44.26,33.06]),variant:0,settlementId:'sippar-city'}),
  primaryCentre({id:'nippur-centre',stateId:'nippur',name:'Nippur',isCapital:false,position:project([45.23,32.13]),variant:1,settlementId:'nippur-city'}),
  primaryCentre({id:'uruk-centre',stateId:'uruk',name:'Uruk',isCapital:false,position:project([45.64,31.32]),variant:0,settlementId:'uruk-city'}),
  primaryCentre({id:'ur-centre',stateId:'ur',name:'Ur',isCapital:false,position:project([46.1,30.96]),variant:1,settlementId:'ur-city'}),
  primaryCentre({id:'diyala-centre',stateId:'diyala',name:'Diyala',isCapital:false,position:project([45.2,33.5]),variant:0}),
  primaryCentre({id:'chaldaea-centre',stateId:'chaldaea',name:'Chaldaea',isCapital:false,position:project([44.25,30.93]),variant:1}),
  // Palm orchards stay small and infrequent, beside cultivated water districts.
  {id:'sippar-grove',asset:'trees',position:project([44.04,33.50]),scale:.34,variant:0},
  {id:'babylon-canal-grove',asset:'trees',position:project([44.78,32.20]),scale:.32,variant:1},
  {id:'babylon-south-grove',asset:'trees',position:project([44.62,32.29]),scale:.28,variant:0,detail:true},
  {id:'nippur-grove',asset:'trees',position:project([45.68,32.05]),scale:.31,variant:1},
  {id:'uruk-grove',asset:'trees',position:project([46.13,31.67]),scale:.32,variant:0},
  {id:'uruk-east-grove',asset:'trees',position:project([46.16,31.26]),scale:.23,variant:1,detail:true},
  {id:'diyala-grove',asset:'trees',position:project([45.42,33.48]),scale:.31,variant:0},
  {id:'sippar-river-grove',asset:'trees',position:project([44.54,33.05]),scale:.24,variant:1},
  {id:'babylon-orchard-west',asset:'trees',position:project([44.28,32.34]),scale:.28,variant:0},
  {id:'babylon-orchard-edge',asset:'trees',position:project([44.39,32.25]),scale:.22,variant:1,detail:true},
  {id:'nippur-canal-palms',asset:'trees',position:project([45.77,31.95]),scale:.24,variant:0},
  {id:'uruk-river-palms',asset:'trees',position:project([45.98,31.53]),scale:.25,variant:1},
  {id:'nippur-reeds',asset:'reeds',position:project([46.60,31.88]),scale:.28,variant:0},
  {id:'tigris-reeds',asset:'reeds',position:project([46.93,31.55]),scale:.30,variant:1},
  {id:'lower-reeds',asset:'reeds',position:project([46.49,31.15]),scale:.25,variant:0,detail:true},
  {id:'ur-marsh-reeds',asset:'reeds',position:project([46.58,30.66]),scale:.33,variant:1},
  {id:'ur-east-reeds',asset:'reeds',position:project([46.87,30.57]),scale:.27,variant:0,detail:true},
  {id:'delta-reeds',asset:'reeds',position:project([47.18,30.41]),scale:.31,variant:1},
  {id:'nippur-reed-edge',asset:'reeds',position:project([46.72,31.79]),scale:.22,variant:1},
  {id:'tigris-reed-pool',asset:'reeds',position:project([46.82,31.44]),scale:.26,variant:0,detail:true},
  {id:'ur-marsh-edge',asset:'reeds',position:project([46.73,30.62]),scale:.25,variant:0},
  {id:'ur-marsh-pool',asset:'reeds',position:project([46.54,30.55]),scale:.23,variant:1,detail:true},
  {id:'delta-reed-edge',asset:'reeds',position:project([47.02,30.47]),scale:.24,variant:0},
  // Low northeastern foothills; taller relief belongs to neighbouring Cossaea.
  {id:'diyala-hill-west',asset:'hill',position:project([45.64,34.17]),scale:.42,variant:0},
  {id:'diyala-hill-east',asset:'hill',position:project([46.12,33.85]),scale:.39,variant:1},
  {id:'diyala-hill-low',asset:'hill',position:project([46.37,33.58]),scale:.30,variant:2,detail:true},
  {id:'cossaea-low-hill',asset:'hill',position:project([47.25,32.97]),scale:.39,variant:2},
  // Interlocking groups along authored ridges, with a second uneven row of
  // smaller shoulders. Each group is still sorted by its actual ground anchor.
  ...babyloniaRanges.flatMap(range=>range.peaks.flatMap(([lon,lat,scale],i)=>[
    {id:`${range.id}-peak-${i}`,asset:'mountain' as const,rangeId:range.id,position:project([lon,lat]),scale,variant:(i%3) as 0|1|2},
    ...(i%3===1?[{id:`${range.id}-shoulder-${i}`,asset:'mountain' as const,rangeId:range.id,position:project([lon+.19,lat+.08]),scale:scale*.68,variant:((i+1)%3) as 0|1|2}]:[]),
    ...(i%4!==2?[{id:`${range.id}-foothill-${i}`,asset:'hill' as const,rangeId:range.id,
      position:project([lon-[.23,.12,.30,.18][i%4],lat+[.04,-.13,-.08,-.20][i%4]]),scale:scale*.82,variant:((i+2)%3) as 0|1|2}]:[]),
  ])),
] satisfies SceneryPlacement[]).toSorted((a,b)=>a.position[1]-b.position[1] || a.id.localeCompare(b.id))

export type SceneryObject = { placement: SceneryPlacement; x: number; y: number; size: number; opacity: number; box: LabelBox }
export function sceneryObjects(projection: MapProjection, zoom: number, scale: number, level: MapLevel, states?: readonly TerritoryState[]): SceneryObject[] {
  if (level==='dominion') return []
  const regional=Math.max(0,Math.min(1,(zoom-1.15)/.65))
  const local=level==='state'?Math.max(0,Math.min(1,(zoom-1.8)/1.0)):0
  return babyloniaScenery.flatMap(authored=>{
    const state=authored.asset==='settlement'?states?.find(s=>s.id===authored.stateId):undefined
    const placement: SceneryPlacement=authored.asset==='settlement'&&state ?
      {...authored,...settlementAppearance(state.buildings.market,authored.isCapital)} : authored
    const opacity=placement.asset==='settlement'?1:placement.detail?local:regional
    if (!opacity) return []
    const [x,y]=projection.point(placement.position)
    // Assets grow naturally with zoom, with a screen cap for readability.
    const cap=placement.asset==='settlement'?(placement.isCapital?76:placement.tier==='city'?62:placement.tier==='fortress'?46:placement.tier==='village'?30:22):placement.rangeId?128:placement.asset==='trees'?34:56
    // Ridge art scales with the ground and keeps its size variation. A generous
    // close-view cap avoids normalizing every peak to the same screen width.
    const size=Math.min(placement.scale*SCENERY_SCALE*(placement.rangeId ? .52 : 1),cap/(48*scale))
    const height=assetHeight[placement.asset==='settlement'?placement.tier:placement.asset]
    return [{placement,x,y,size,opacity,box:{left:x-24*size,right:x+24*size,top:y-height*size,bottom:y+3*size}}]
  })
}
