import type { LonLat } from './geographyContent'
import { babyloniaTerrainFeatures, babyloniaWaterways } from './babyloniaTerrain.ts'

export type TerrainDetail = 'macro' | 'regional' | 'local'
export type TerrainType = 'mountain' | 'hill' | 'desert' | 'steppe' | 'forest' | 'palm' | 'marsh' | 'fertile' | 'coastal' | 'river'
export type TerrainFeature = {
  id: string
  name: string
  type: TerrainType
  detail: TerrainDetail
  points: readonly LonLat[]
  width: number
  scale: number
  rotation: number
  opacity: number
  zoomVisibility: readonly [number, number]
  modifierRef?: string
  provinceId?: string
  stateId?: string
  marks?: readonly { position: LonLat; size: number; rotation: number }[]
}

// Authored geographic corridors, not random decoration. Illustration only:
// modifierRef reserves a link for future rules without changing combat today.
const regions: { id: string; name: string; type: TerrainType; points: LonLat[]; width: number; scale?: number }[] = [
  {id:'zagros',name:'Zagros Mountains',type:'mountain',width:28,points:[[44.6,37.2],[45.4,36.5],[46.2,35.7],[47.0,34.9],[47.7,34.0],[48.5,33.1],[49.5,32.4]]},
  {id:'zagros-foothills',name:'Zagros foothills',type:'hill',width:22,points:[[44.2,36.7],[44.8,35.9],[45.5,35.1],[46.1,34.3],[46.9,33.5],[47.8,32.7]]},
  {id:'taurus',name:'Taurus Mountains',type:'mountain',width:23,points:[[31.8,37.0],[33.0,37.4],[34.3,37.65],[35.6,37.7],[37.0,37.9],[38.1,38.3]]},
  {id:'pontic',name:'Pontic Mountains',type:'mountain',width:22,points:[[32.7,40.3],[34.5,40.15],[36.2,40.0],[38.1,40.25],[39.8,40.6],[41.2,40.75]]},
  {id:'armenia',name:'Armenian highlands',type:'mountain',width:38,points:[[38.7,39.0],[40.0,39.5],[41.6,39.2],[43.0,39.6],[44.8,40.0]]},
  {id:'armenian-hills',name:'Eastern Anatolian uplands',type:'hill',width:30,points:[[38.2,38.2],[40.0,38.6],[41.8,38.3],[43.4,38.7]]},
  {id:'iranian-uplands',name:'Iranian plateau',type:'hill',width:35,points:[[47.0,36.5],[48.1,35.7],[49.5,34.9],[50.6,34.2]]},
  {id:'lebanon',name:'Lebanon Mountains',type:'mountain',width:12,scale:.75,points:[[36.2,34.9],[36.1,34.4],[35.9,33.9],[35.6,33.3]]},
  {id:'syrian-desert',name:'Syrian desert',type:'desert',width:85,points:[[37.9,33.9],[39.0,33.5],[40.3,33.0],[41.7,32.5]]},
  {id:'arabian-margin',name:'Arabian desert margin',type:'desert',width:50,points:[[41.5,31.1],[43.0,30.7],[44.5,30.25],[45.7,29.9]]},
  {id:'syrian-steppe',name:'Upper Mesopotamian steppe',type:'steppe',width:28,points:[[38.4,35.5],[39.8,35.4],[41.2,35.5]]},
  {id:'cappadocian-steppe',name:'Anatolian plateau',type:'steppe',width:25,points:[[32.8,38.8],[34.0,39.0],[35.3,39.25]]},
  {id:'pontic-forest',name:'Pontic woodland',type:'forest',width:13,scale:.85,points:[[34.0,41.0],[35.5,40.9],[37.3,40.75],[38.5,40.85]]},
  {id:'zagros-woodland',name:'Zagros oak woodland',type:'forest',width:12,scale:.85,points:[[45.3,36.4],[46.1,35.6],[46.9,34.75]]},
  {id:'lower-marsh',name:'Lower Mesopotamian marshes',type:'marsh',width:33,points:[[46.0,31.2],[46.5,31.0],[47.0,30.7],[47.4,30.45]]},
  {id:'susian-wetland',name:'Susian wetlands',type:'marsh',width:18,points:[[47.3,31.45],[47.7,31.2],[48.1,30.9]]},
  {id:'babylon-valley',name:'Babylonian alluvium',type:'fertile',width:36,points:[[44.25,33.2],[44.5,32.5],[45.2,32.0],[45.7,31.35],[46.3,30.9]]},
  {id:'tigris-valley',name:'Tigris floodplain',type:'fertile',width:25,points:[[43.2,36.3],[43.6,35.5],[44.2,34.3],[44.6,33.4],[45.7,32.5],[46.5,31.65]]},
  {id:'susian-plain',name:'Susian plain',type:'fertile',width:31,points:[[48.0,32.3],[48.3,31.9],[48.6,31.4],[48.8,31.0]]},
  {id:'cilician-plain',name:'Cilician plain',type:'coastal',width:18,points:[[34.3,36.9],[34.9,37.0],[35.6,37.0],[36.1,36.9]]},
  {id:'phoenician-plain',name:'Phoenician coast',type:'coastal',width:10,points:[[35.85,34.8],[35.7,34.2],[35.35,33.5]]},
]

export const terrainFeatures: TerrainFeature[] = [...regions.flatMap((region) => (['macro','regional','local'] as const).map((detail) => ({
  ...region, id:`${region.id}-${detail}`, detail, scale:region.scale ?? 1, rotation:0,
  opacity: detail==='macro' ? .42 : detail==='regional' ? .6 : .7,
  zoomVisibility: detail==='macro' ? [.65,1.85] as const : detail==='regional' ? [1.1,4.3] as const : [3.2,7] as const,
}))), ...babyloniaTerrainFeatures]

export const routeFeatures: TerrainFeature[] = [
  ...babyloniaWaterways,
  {id:'diyala-river',name:'Diyala',type:'river',detail:'local',points:[[45.8,34.8],[45.55,34.1],[45.2,33.7],[44.8,33.2],[44.55,33.1]],width:.8,scale:1,rotation:0,opacity:.65,zoomVisibility:[3.2,7]},
  {id:'karun-river',name:'Karun',type:'river',detail:'local',points:[[49.3,32.2],[48.9,31.85],[48.65,31.35],[48.2,30.8],[47.8,30.5]],width:.9,scale:1,rotation:0,opacity:.65,zoomVisibility:[3.2,7]},
  {id:'babylon-canal',name:'Babylon canal',type:'river',detail:'local',points:[[44.34,32.4],[44.75,32.15],[45.23,32.13]],width:.5,scale:1,rotation:0,opacity:.55,zoomVisibility:[3.2,7]},
]
