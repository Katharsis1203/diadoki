import { project } from './data.ts'
import type { SceneryPlacement } from './babyloniaScenery.ts'
import { stateDefinitions } from './geographyContent.ts'
import { settlementAppearance } from './settlementAppearance.ts'
import { susianaStateSettlements } from './susaGeography.ts'

export const susaScenery: readonly SceneryPlacement[] = [
  {id:'mountain-entrance-centre',asset:'settlement',stateId:'mountain-entrance',name:'Mountain Entrance',isCapital:false,position:project([49.95,32.65]),variant:0,settlementId:'mountain-entrance-village',...settlementAppearance(0,false)},
  {id:'susa-city-art',asset:'settlement',stateId:'susa',name:'Susa',settlementId:'susa-city',isCapital:true,style:'susian',position:project([48.25,32.19]),...settlementAppearance(1,true)},
  ...susianaStateSettlements.map((place,i)=>({id:`${place.id}-art`,asset:'settlement' as const,stateId:place.stateId,name:place.name,settlementId:place.id,isCapital:false,position:project(place.position),variant:(i%2) as 0|1,...settlementAppearance(stateDefinitions.find(s=>s.id===place.stateId)!.development,false)})),
  {id:'susa-north-grove',asset:'trees',position:project([48.35,32.43]),scale:.28,variant:0},
  {id:'susa-east-grove',asset:'trees',position:project([48.51,32.17]),scale:.25,variant:1},
  {id:'susa-west-grove',asset:'trees',position:project([47.60,32.20]),scale:.23,variant:0},
  {id:'susa-south-grove',asset:'trees',position:project([48.28,31.91]),scale:.21,variant:1,detail:true},
  {id:'susa-marsh-reeds',asset:'reeds',position:project([47.76,31.73]),scale:.25,variant:1},
  {id:'susa-reed-edge',asset:'reeds',position:project([48.01,31.82]),scale:.21,variant:0,detail:true},
]
