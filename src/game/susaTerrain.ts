import type { TerrainFeature } from './terrainContent.ts'
import { susaFeederChannels } from './susaGeography.ts'

// Sparse colour highlights. Upright groves and reeds are authored separately so
// these ground patches remain cheap prepared artwork at every detail level.
const highlights: Pick<TerrainFeature,'id'|'name'|'type'|'points'|'width'|'opacity'>[] = [
  {id:'susa-cultivated-plain',name:'Susa cultivated plain',type:'fertile',points:[[48.05,32.55],[48.18,32.34],[48.25,32.19],[48.32,32.05],[48.51,31.89]],width:14,opacity:.48},
  {id:'susa-west-fields',name:'Western Susian farms',type:'fertile',points:[[47.49,32.24],[47.73,32.10],[47.92,31.98]],width:11,opacity:.4},
  {id:'susa-date-groves',name:'Susa date groves',type:'palm',points:[[48.31,32.38],[48.38,32.23]],width:8,opacity:.36},
  {id:'susa-reed-margin',name:'Southern Susian reedbeds',type:'marsh',points:[[47.61,31.59],[47.94,31.76],[48.17,31.81]],width:10,opacity:.38},
  {id:'susa-dry-terraces',name:'Susian dry terraces',type:'steppe',points:[[47.38,32.55],[47.73,32.60],[47.94,32.57]],width:9,opacity:.3},
]
export const susaTerrainFeatures: TerrainFeature[] = highlights.map(feature=>({...feature,detail:'regional',scale:1,rotation:0,zoomVisibility:[.65,7],stateId:'susa',marks:[]}))

export const susaWaterways: TerrainFeature[] = susaFeederChannels.map(channel=>({
  ...channel,type:'river',detail:'regional',width:.38,scale:1,rotation:0,opacity:.48,zoomVisibility:[1.1,7],stateId:'susa',provinceId:'susiana',
}))
