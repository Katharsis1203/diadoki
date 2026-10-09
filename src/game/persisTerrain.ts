import type { TerrainFeature } from './terrainContent.ts'

const highlights: Pick<TerrainFeature,'id'|'name'|'type'|'points'|'width'|'opacity'|'stateId'>[] = [
  {id:'persis-persepolis-plain',name:'Persepolis farming plain',stateId:'persepolis',type:'fertile',points:[[52.46,30.13],[52.63,29.98],[52.81,29.87],[53.03,29.74],[53.18,29.75]],width:18,opacity:.58},
  {id:'persis-persepolis-upper-plain',name:'Upper Persepolis farming plain',stateId:'persepolis',type:'fertile',points:[[52.75,30.43],[52.83,30.31]],width:12,opacity:.38},
  {id:'persis-persepolis-terraces',name:'Persepolis dry terraces',stateId:'persepolis',type:'steppe',points:[[52.33,29.65],[52.60,29.44],[52.94,29.28]],width:12,opacity:.29},
  {id:'persis-intermontane-basin',name:'Cultivated intermontane basin',stateId:'pasargadae',type:'fertile',points:[[53.30,31.10],[53.53,31.02],[53.98,30.88],[54.26,30.88]],width:14,opacity:.40},
  {id:'persis-southern-plateau-basin',name:'Pasargadae northern basin margins',stateId:'pasargadae',type:'fertile',points:[[53.30,31.50],[53.67,31.52],[54.03,31.43],[54.40,31.36]],width:10,opacity:.32},
  {id:'persis-pasargadae-gardens',name:'Pasargadae garden valley',stateId:'pasargadae',type:'fertile',points:[[54.38,31.31],[54.50,31.19],[54.64,31.04]],width:12,opacity:.55},
  {id:'persis-western-valleys',name:'Western foothill valleys',stateId:'western-persis',type:'fertile',points:[[51.04,30.49],[51.27,30.28],[51.45,30.07]],width:12,opacity:.36},
  {id:'persis-western-hills',name:'Western dry hills',stateId:'western-persis',type:'steppe',points:[[51.05,30.83],[51.42,30.58],[51.67,30.37]],width:14,opacity:.28},
  {id:'persis-coastal-plain',name:'Persian coastal terraces',stateId:'persian-coast',type:'coastal',points:[[52.39,27.95],[52.66,27.86],[52.93,27.73]],width:12,opacity:.35},
  {id:'persis-coastal-hinterland',name:'Dry coastal hinterland',stateId:'persian-coast',type:'steppe',points:[[53.0,28.5],[53.4,28.3],[53.9,28.0]],width:12,opacity:.30},
  {id:'persis-western-entry-valley',name:'Western entry valley',stateId:'western-foothills',type:'fertile',points:[[51.35,31.75],[51.60,31.60],[51.85,31.40]],width:10,opacity:.34},
  {id:'persis-western-entry-terraces',name:'Western entry terraces',stateId:'western-foothills',type:'steppe',points:[[51.50,31.90],[51.80,31.76],[52.00,31.55]],width:12,opacity:.30},
]
export const persisTerrainFeatures: TerrainFeature[] = highlights.map(feature=>({...feature,detail:'regional',scale:1,rotation:0,zoomVisibility:[.65,7],marks:[]}))

// Modest schematic channels within the farming valleys, not surveyed rivers.
const channels: Pick<TerrainFeature,'id'|'name'|'stateId'|'points'>[] = [
  {id:'persis-persepolis-channel',name:'Persepolis valley channel',stateId:'persepolis',points:[[52.54,29.97],[52.63,29.87],[52.73,29.85],[52.82,29.73],[53.02,29.65]]},
  {id:'persis-pasargadae-channel',name:'Pasargadae garden channel',stateId:'pasargadae',points:[[54.48,31.34],[54.54,31.21],[54.60,31.09],[54.69,30.99]]},
]
export const persisWaterways: TerrainFeature[] = channels.map(feature=>({...feature,type:'river',detail:'regional',width:.35,scale:1,rotation:0,opacity:.45,zoomVisibility:[1.1,7],provinceId:'persis'}))

// Sparse stony ground in the independent block, without farms or settlement art.
export const persisHighlandFeatures:TerrainFeature[]=[{
  id:'persis-highlands-rock',name:'Northern Highlands stony ground',terrainRegionId:'persis-northern-highlands',type:'hill',detail:'regional',
  points:[[51.70,32.55],[52.30,32.70],[53.10,32.70],[54.00,32.58],[54.75,32.16]],
  width:30,opacity:.34,scale:1,rotation:0,zoomVisibility:[.65,7],marks:[],
}]
