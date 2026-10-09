import { mountainBasins } from './mountainPasses.ts'
import type { MapPoint } from './mapProjection.ts'
import type { SceneryPlacement } from './babyloniaScenery.ts'
import { persisCentres } from './persisGeography.ts'
import { landAnchors } from './mountainGeometry.ts'
import { settlementAppearance } from './settlementAppearance.ts'
import { project } from './data.ts'

export const persisScenery: readonly SceneryPlacement[] = [
  ...persisCentres.map((place,i)=>({id:`${place.stateId}-centre-art`,asset:'settlement' as const,scope:'theatre' as const,
    stateId:place.stateId,name:place.name,isCapital:place.isCapital,settlementId:`${place.stateId}-atlas-centre`,
    position:landAnchors[place.stateId],variant:(i%2) as 0|1,
    ...settlementAppearance(place.development,place.isCapital),
    ...(place.isCapital?{style:'persian' as const,scale:.60}:{}),
    ...(place.stateId==='pasargadae'?{style:'pasargadan' as const}:{}),
  })),
  // Small irregular groups break the broad dry country without adding towns
  // or extending the mountain chains through the open plateau.
  {id:'plateau-west-outcrop',asset:'rocks',scope:'theatre',position:project([52.30,32.40]),scale:.32,variant:0},
  {id:'plateau-north-outcrop',asset:'rocks',scope:'theatre',position:project([53.25,32.80]),scale:.34,variant:1},
  {id:'plateau-east-outcrop',asset:'rocks',scope:'theatre',position:project([54.40,32.40]),scale:.30,variant:0},
  {id:'plateau-south-outcrop',asset:'rocks',scope:'theatre',position:project([55.36,31.64]),scale:.29,variant:1},
  {id:'western-persis-outcrop',asset:'rocks',scope:'theatre',position:project([51.08,31.35]),scale:.29,variant:1},
  {id:'western-persis-scrub',asset:'scrub',scope:'theatre',position:project([51.48,29.58]),scale:.25,variant:0},
  {id:'persian-coast-inland-outcrop',asset:'rocks',scope:'theatre',position:project([53.58,28.38]),scale:.30,variant:0},
  {id:'persian-coast-east-outcrop',asset:'rocks',scope:'theatre',position:project([53.98,27.52]),scale:.26,variant:1},
  {id:'persian-coast-scrub',asset:'scrub',scope:'theatre',position:project([52.93,28.55]),scale:.27,variant:1},
  {id:'pasargadae-valley-scrub',asset:'scrub',scope:'theatre',position:project([52.95,30.57]),scale:.24,variant:0},
  {id:'persepolis-terrace-outcrop',asset:'rocks',scope:'theatre',position:project([53.47,29.13]),scale:.27,variant:1},
  {id:'persis-basin-grove-west',asset:'grove',scope:'theatre',position:project([53.61,30.75]),scale:.24,variant:1},
  {id:'persis-basin-grove-east',asset:'grove',scope:'theatre',position:project([54.55,31.08]),scale:.23,variant:0},
  {id:'persepolis-valley-grove',asset:'grove',scope:'theatre',position:project([52.66,29.67]),scale:.24,variant:0},
  {id:'pasargadae-garden-grove',asset:'grove',scope:'theatre',position:project([54.57,31.24]),scale:.23,variant:1},
  {id:'western-persis-grove',asset:'grove',scope:'theatre',position:project([51.12,30.36]),scale:.23,variant:0},
  {id:'persian-coast-palms',asset:'trees',scope:'theatre',position:project([52.48,27.90]),scale:.22,variant:1},
]

// Fixed valley openings protect the field parcels and leave a modest crossing
// through the Pasargadae pass; the surrounding ridge silhouettes stay intact.
const valleyOpenings=[
  ...mountainBasins.map(v=>({at:v.point,rx:v.rx,ry:v.ry})),
  {at:project([52.72,29.78]),rx:7,ry:5},
  {at:project([54.54,31.18]),rx:5,ry:6},
  {at:project([56.30,31.05]),rx:8,ry:6},
]
export const inPersisValley=(point:MapPoint)=>valleyOpenings.some(v=>
  ((point[0]-v.at[0])/v.rx)**2+((point[1]-v.at[1])/v.ry)**2<1)
