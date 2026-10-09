import { project } from './data.ts'
import type { SceneryPlacement } from './babyloniaScenery.ts'
import { settlementDefinitions, stateDefinitions } from './geographyContent.ts'
import { settlementAppearance } from './settlementAppearance.ts'

const stateIds=['upper-euphrates','nisibis','nineveh','arbela','assur']
export const assyriaScenery: readonly SceneryPlacement[] = [
  ...stateIds.map((stateId,i)=>{
    const state=stateDefinitions.find(s=>s.id===stateId)!,place=settlementDefinitions.find(p=>p.stateId===stateId)!,isCapital=stateId==='nineveh'
    return {id:`${stateId}-centre-art`,asset:'settlement' as const,stateId,name:state.name,settlementId:place.id,isCapital,
      ...(isCapital?{style:'assyrian' as const}:{}),position:project(place.position),variant:(i%2) as 0|1,...settlementAppearance(state.development,isCapital)}
  }),
  {id:'nisibis-grove',asset:'grove',position:project([41.58,37.04]),scale:.25,variant:1},
  {id:'nineveh-grove',asset:'grove',position:project([42.77,36.39]),scale:.24,variant:0},
  {id:'arbela-grove',asset:'grove',position:project([44.26,36.15]),scale:.23,variant:1},
  {id:'assur-reed-edge',asset:'reeds',position:project([43.05,35.25]),scale:.22,variant:0,detail:true},
]
