import type { LonLat } from './geographyContent.ts'
import type { TerrainFeature, TerrainType } from './terrainContent.ts'
import { babylonSouthernCanals, sipparCanalMargin, urukCanalMargin, westernDryMargin } from './babyloniaGeography.ts'

// Small deliberately placed patches, with unequal gaps, silhouettes and sizes.
// Offsets describe a cluster's shape in geographic space, not a repeated row.
type Patch = { center: LonLat; marks: readonly (readonly [number,number,number,number?])[] }
const grove: Patch['marks'] = [[-.10,.02,6.4,-5],[.035,.065,8.2,4],[.13,-.035,6.8,-3],[.015,-.085,5.4,7]]
const groveWide: Patch['marks'] = [[-.14,-.04,7,3],[-.035,.095,6,-7],[.095,.03,8.6,0],[.18,-.07,5.6,9],[.015,-.11,6.4,-2]]
const reeds: Patch['marks'] = [[-.15,.03,7,-4],[-.03,-.07,5.7,6],[.075,.08,8.2,-7],[.19,-.025,6.4,3],[.11,-.14,5.5,0]]
const ridges: Patch['marks'] = [[-.15,-.04,7.8,-6],[-.04,.07,10,2],[.09,-.005,8.2,8],[.19,.10,6.4,-4]]
const dunes: Patch['marks'] = [[-.18,.02,7,6],[.02,-.09,5.4,-8],[.16,.075,8.2,3]]
const patches = (centers: LonLat[], marks: Patch['marks']): Patch[] => centers.map(center=>({center,marks}))

type Region = { id: string; stateId: string; type: TerrainType; points: LonLat[]; width: number; patches?: Patch[] }
const regions: Region[] = [
  {id:'sippar-irrigation',stateId:'sippar',type:'fertile',width:21,points:[[43.6,33.38],[43.95,33.17],[44.22,33.06],[44.45,33.09]]},
  {id:'sippar-groves',stateId:'sippar',type:'palm',width:9,points:[[43.94,33.18],[44.45,33.13]],patches:patches([[43.98,33.20],[44.45,33.12]],grove)},
  {id:'babylon-fields',stateId:'babylon',type:'fertile',width:23,points:[[44.18,32.82],[44.41,32.64],[44.55,32.4],[44.69,32.23]]},
  {id:'babylon-orchards',stateId:'babylon',type:'palm',width:9,points:[[44.05,32.59],[44.48,32.29]],patches:patches([[44.05,32.59],[44.54,32.36],[44.38,32.17]],groveWide)},
  {id:'nippur-fields',stateId:'nippur',type:'fertile',width:22,points:[[45.18,32.38],[45.23,32.13],[45.58,32.0],[46.03,31.83]]},
  {id:'nippur-groves',stateId:'nippur',type:'palm',width:9,points:[[45.42,32.31],[45.61,31.97]],patches:patches([[45.44,32.28],[45.64,32.03]],grove)},
  {id:'uruk-fields',stateId:'uruk',type:'fertile',width:22,points:[[45.10,31.57],[45.45,31.45],[45.77,31.33],[46.12,31.22]]},
  {id:'uruk-groves',stateId:'uruk',type:'palm',width:10,points:[[45.30,31.53],[46.05,31.31]],patches:patches([[45.33,31.52],[45.95,31.47],[46.16,31.22]],groveWide)},
  {id:'diyala-farms',stateId:'diyala',type:'fertile',width:24,points:[[45.49,34.12],[45.37,33.76],[45.15,33.46],[44.82,33.21]]},
  {id:'diyala-groves',stateId:'diyala',type:'palm',width:10,points:[[45.1,33.61],[45.41,33.4]],patches:patches([[45.10,33.60],[45.55,33.41]],grove)},
  {id:'diyala-foothills',stateId:'diyala',type:'hill',width:15,points:[[45.45,34.30],[45.69,34.15],[46.06,33.87],[46.40,33.57]],patches:patches([[45.47,34.25],[45.87,34.02],[46.36,33.62]],ridges)},
  {id:'chaldaea-dryland',stateId:'chaldaea',type:'desert',width:29,points:[[43.77,31.79],[44.02,31.37],[44.26,30.91],[44.48,30.38]],patches:patches([[43.85,31.54],[44.04,31.05],[44.33,30.66],[44.56,30.17]],dunes)},
  {id:'chaldaea-steppe',stateId:'chaldaea',type:'steppe',width:16,points:westernDryMargin.filter(([lon,lat])=>lon>43.8&&lat>30.1),patches:patches([[44.39,31.09],[44.70,30.67]],dunes)},
  {id:'nippur-reedbeds',stateId:'nippur',type:'marsh',width:22,points:[[46.3,31.90],[46.65,31.64],[46.95,31.29]],patches:patches([[46.35,31.90],[46.81,31.60],[47.0,31.22]],reeds)},
  {id:'uruk-reedbeds',stateId:'uruk',type:'marsh',width:18,points:[[46.0,31.28],[46.32,31.2],[46.63,31.06]],patches:patches([[46.37,31.26],[46.62,31.07]],reeds)},
  {id:'ur-marshes',stateId:'ur',type:'marsh',width:25,points:[[46.38,30.85],[46.8,30.73],[47.15,30.51]],patches:patches([[46.42,30.78],[46.84,30.59],[47.22,30.45]],reeds)},
  {id:'ur-dry-margin',stateId:'ur',type:'steppe',width:24,points:[[45.72,30.25],[46.14,30.13],[46.62,29.94]],patches:patches([[45.64,30.17],[46.13,29.93],[46.61,29.74]],dunes)},
]

export const babyloniaTerrainFeatures: TerrainFeature[] = regions.flatMap(region => (['macro','regional','local'] as const).map(detail => {
  const marks = region.patches?.flatMap(({center,marks}, patchIndex) => marks.filter((_,i)=>detail==='local'||(i+patchIndex)%2===0)
    .map(([dx,dy,size,rotation=0]) => ({ position:[center[0]+dx,center[1]+dy] as LonLat, size, rotation }))) ?? []
  return {...region,id:`babylonia-${region.id}-${detail}`,name:region.id.replaceAll('-',' '),provinceId:'babylonia',detail,scale:1,rotation:0,
    opacity:detail==='macro'?.4:detail==='regional'?.62:.72,zoomVisibility:detail==='macro'?[.65,1.85]:detail==='regional'?[1.1,4.3]:[3.2,7],marks:detail==='macro'?[]:marks}
}))

const canal = (id:string,name:string,points:LonLat[],detail:'regional'|'local'='regional'):TerrainFeature => ({
  id,name,type:'river',detail,points,width:.45,scale:1,rotation:0,opacity:.48,zoomVisibility:[1.1,7],provinceId:'babylonia',
})
// Schematic canal districts are explicitly authored with the political cuts.
// They illustrate the irrigated landscape; no ancient course is asserted.
export const babyloniaWaterways: TerrainFeature[] = [
  canal('sippar-district-canal','Sippar canal district',sipparCanalMargin.filter(([lon])=>lon>43.6)),
  canal('babylon-district-canals','Babylon canal district',babylonSouthernCanals.filter(([lon])=>lon>44.03)),
  canal('uruk-district-canals','Uruk canal district',urukCanalMargin.filter(([lon])=>lon>44.4&&lon<46.5)),
  canal('nippur-feeder','Nippur irrigation channel',[[44.92,32.22],[45.08,32.19],[45.23,32.13],[45.41,31.98]],'local'),
  canal('uruk-feeder','Uruk irrigation channel',[[45.22,31.52],[45.45,31.44],[45.64,31.32],[45.87,31.28]],'local'),
  canal('lower-marsh-creek','Lower marsh channels',[[46.14,30.87],[46.39,30.68],[46.61,30.64],[46.86,30.46]],'local'),
]
