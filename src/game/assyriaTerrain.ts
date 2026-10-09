import type { TerrainFeature } from './terrainContent.ts'

const highlights: Pick<TerrainFeature,'id'|'name'|'type'|'points'|'width'|'opacity'|'stateId'>[] = [
  {id:'assyria-euphrates-terraces',name:'Euphrates terraces',stateId:'upper-euphrates',type:'fertile',points:[[38.88,36.35],[39.28,36.02],[39.58,35.75]],width:12,opacity:.4},
  {id:'assyria-jazira-steppe',name:'Jazira steppe',stateId:'upper-euphrates',type:'steppe',points:[[39.48,36.86],[39.80,36.57],[40.13,36.19]],width:15,opacity:.32},
  {id:'assyria-nisibis-fields',name:'Nisibis farming plain',stateId:'nisibis',type:'fertile',points:[[40.93,37.17],[41.21,37.06],[41.54,36.89]],width:14,opacity:.44},
  {id:'assyria-nisibis-dryland',name:'Southern Nisibis terraces',stateId:'nisibis',type:'steppe',points:[[41.08,36.57],[41.35,36.28],[41.48,36.07]],width:11,opacity:.3},
  {id:'assyria-nineveh-fields',name:'Nineveh river plain',stateId:'nineveh',type:'fertile',points:[[42.84,36.69],[43.04,36.44],[43.18,36.21]],width:13,opacity:.44},
  {id:'assyria-arbela-fields',name:'Arbela farming plain',stateId:'arbela',type:'fertile',points:[[43.92,36.37],[44.0,36.19],[44.28,36.03]],width:14,opacity:.42},
  {id:'assyria-assur-terraces',name:'Assur Tigris terraces',stateId:'assur',type:'fertile',points:[[43.07,35.72],[43.25,35.45],[43.32,35.20]],width:11,opacity:.42},
  {id:'assyria-assur-steppe',name:'Assur dry hinterland',stateId:'assur',type:'steppe',points:[[41.85,35.46],[42.15,35.25],[42.49,35.09]],width:15,opacity:.3},
]
export const assyriaTerrainFeatures: TerrainFeature[] = highlights.map(feature=>({...feature,detail:'regional',scale:1,rotation:0,zoomVisibility:[.65,7],marks:[]}))

// Small schematic feeders, not a reconstruction of imperial irrigation works.
const feeders: Pick<TerrainFeature,'id'|'name'|'stateId'|'points'>[] = [
  {id:'assyria-nineveh-feeder',name:'Nineveh farming channel',stateId:'nineveh',points:[[43.23,36.49],[43.08,36.50],[42.94,36.44]]},
  {id:'assyria-arbela-feeder',name:'Arbela farming channel',stateId:'arbela',points:[[43.92,36.61],[44.02,36.42],[44.08,36.29],[44.23,36.22]]},
]
export const assyriaWaterways: TerrainFeature[] = feeders.map(feature=>({...feature,type:'river',detail:'regional',width:.38,scale:1,rotation:0,opacity:.45,zoomVisibility:[1.1,7],provinceId:'assyria'}))
