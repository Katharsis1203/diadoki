import { project } from './data.ts'
import type { MapPoint, MapProjection } from './mapProjection.ts'
import type { LabelBox, MapLevel } from './mapView.ts'

export type SettlementTier = 'city' | 'fortress' | 'village'
export type SceneryAsset = 'mountain' | 'hill' | 'trees' | 'reeds' | 'settlement'
type Placement = {
  id: string
  asset: SceneryAsset
  position: MapPoint
  scale: number
  variant?: 0 | 1 | 2
  detail?: boolean
  settlementId?: string
}
// Visual designation only: capital status is independent of architectural tier
// and never consulted by combat, income, ownership or province rules.
export type SceneryPlacement = Placement & (
  { asset: 'settlement'; stateId: string; name: string; tier: SettlementTier; isCapital: boolean }
  | { asset: Exclude<SceneryAsset,'settlement'> }
)
export const SCENERY_SCALE = 1
const assetHeight = {city:28,fortress:28,village:16,mountain:36,hill:21,trees:34,reeds:24}
// Illustration footprint in canonical map space: Babylonia and adjacent eastern
// foothills. The existing engraved symbols remain elsewhere.
export const SCENERY_ZONE = { left: 530, top: 354, right: 714, bottom: 574 }
export const inSceneryZone = ([x,y]: MapPoint) => x>=SCENERY_ZONE.left && x<=SCENERY_ZONE.right && y>=SCENERY_ZONE.top && y<=SCENERY_ZONE.bottom

// Authored anchor positions, converted once to the same map coordinates as the
// state mesh. No random sampling, camera-dependent placement or save mutation.
export const babyloniaScenery: readonly SceneryPlacement[] = ([
  // One primary centre for each test-province state. Borsippa and Larsa remain
  // secondary map references; surrounding provinces retain their existing dots.
  {id:'babylon-city-art',asset:'settlement',stateId:'babylon',name:'Babylon',tier:'city',isCapital:true,position:project([44.42,32.54]),scale:.72,variant:0,settlementId:'babylon-city'},
  {id:'sippar-centre',asset:'settlement',stateId:'sippar',name:'Sippar',tier:'fortress',isCapital:false,position:project([44.26,33.06]),scale:.46,variant:0,settlementId:'sippar-city'},
  {id:'nippur-centre',asset:'settlement',stateId:'nippur',name:'Nippur',tier:'fortress',isCapital:false,position:project([45.23,32.13]),scale:.45,variant:1,settlementId:'nippur-city'},
  {id:'uruk-centre',asset:'settlement',stateId:'uruk',name:'Uruk',tier:'fortress',isCapital:false,position:project([45.64,31.32]),scale:.48,variant:0,settlementId:'uruk-city'},
  {id:'ur-centre',asset:'settlement',stateId:'ur',name:'Ur',tier:'fortress',isCapital:false,position:project([46.1,30.96]),scale:.43,variant:1,settlementId:'ur-city'},
  {id:'diyala-centre',asset:'settlement',stateId:'diyala',name:'Diyala',tier:'village',isCapital:false,position:project([45.2,33.5]),scale:.26,variant:0},
  {id:'chaldaea-centre',asset:'settlement',stateId:'chaldaea',name:'Chaldaea',tier:'village',isCapital:false,position:project([44.25,30.93]),scale:.25,variant:1},
  // Palm orchards stay small and infrequent, beside cultivated water districts.
  {id:'sippar-grove',asset:'trees',position:project([44.04,33.50]),scale:.34,variant:0},
  {id:'babylon-canal-grove',asset:'trees',position:project([44.78,32.20]),scale:.32,variant:1},
  {id:'babylon-south-grove',asset:'trees',position:project([44.62,32.29]),scale:.28,variant:0,detail:true},
  {id:'nippur-grove',asset:'trees',position:project([45.68,32.05]),scale:.31,variant:1},
  {id:'uruk-grove',asset:'trees',position:project([46.13,31.67]),scale:.32,variant:0},
  {id:'uruk-east-grove',asset:'trees',position:project([46.16,31.26]),scale:.23,variant:1,detail:true},
  {id:'diyala-grove',asset:'trees',position:project([45.42,33.48]),scale:.31,variant:0},
  {id:'nippur-reeds',asset:'reeds',position:project([46.60,31.88]),scale:.28,variant:0},
  {id:'tigris-reeds',asset:'reeds',position:project([46.93,31.55]),scale:.30,variant:1},
  {id:'lower-reeds',asset:'reeds',position:project([46.49,31.15]),scale:.25,variant:0,detail:true},
  {id:'ur-marsh-reeds',asset:'reeds',position:project([46.58,30.66]),scale:.33,variant:1},
  {id:'ur-east-reeds',asset:'reeds',position:project([46.87,30.57]),scale:.27,variant:0,detail:true},
  {id:'delta-reeds',asset:'reeds',position:project([47.18,30.41]),scale:.31,variant:1},
  // Low northeastern foothills; taller relief belongs to neighbouring Cossaea.
  {id:'diyala-hill-west',asset:'hill',position:project([45.64,34.17]),scale:.42,variant:0},
  {id:'diyala-hill-east',asset:'hill',position:project([46.12,33.85]),scale:.39,variant:1},
  {id:'diyala-hill-low',asset:'hill',position:project([46.37,33.58]),scale:.30,variant:2,detail:true},
  {id:'cossaea-ridge-north',asset:'mountain',position:project([47.40,33.50]),scale:.57,variant:1},
  {id:'cossaea-ridge-high',asset:'mountain',position:project([47.85,33.56]),scale:.64,variant:0},
  {id:'cossaea-ridge-east',asset:'mountain',position:project([48.65,33.42]),scale:.47,variant:2},
  {id:'cossaea-low-hill',asset:'hill',position:project([47.25,32.97]),scale:.39,variant:2},
] satisfies SceneryPlacement[]).toSorted((a,b)=>a.position[1]-b.position[1] || a.id.localeCompare(b.id))

export type SceneryObject = { placement: SceneryPlacement; x: number; y: number; size: number; opacity: number; box: LabelBox }
export function sceneryObjects(projection: MapProjection, zoom: number, scale: number, level: MapLevel): SceneryObject[] {
  if (level==='dominion') return []
  const regional=Math.max(0,Math.min(1,(zoom-1.15)/.65))
  const local=level==='state'?Math.max(0,Math.min(1,(zoom-1.8)/1.0)):0
  return babyloniaScenery.flatMap(placement=>{
    const opacity=placement.asset==='settlement'?1:placement.detail?local:regional
    if (!opacity) return []
    const [x,y]=projection.point(placement.position)
    // Assets grow naturally with zoom, with a screen cap for readability.
    const cap=placement.asset==='settlement'?(placement.isCapital?76:placement.tier==='fortress'?46:placement.tier==='village'?26:56):placement.asset==='trees'?34:56
    const size=Math.min(placement.scale*SCENERY_SCALE,cap/(48*scale))
    const height=assetHeight[placement.asset==='settlement'?placement.tier:placement.asset]
    return [{placement,x,y,size,opacity,box:{left:x-24*size,right:x+24*size,top:y-height*size,bottom:y+3*size}}]
  })
}
