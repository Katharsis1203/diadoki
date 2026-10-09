import type { LonLat } from './geographyContent.ts'
import { roundedOpenBorder } from './borderCurves.ts'
import { riverReach } from './babyloniaGeography.ts'
import { mediaNorthernRiver, medianNorthernEdge } from './mediaGeography.ts'
import { coreRangeGround } from './terrainBackbone.ts'
import { ridgeBaseLine } from './ridgeBorders.ts'

const curve=(points:readonly LonLat[]):LonLat[]=>{
  const result=roundedOpenBorder(points)
  result[0]=[...points[0]];result[result.length-1]=[...points.at(-1)!]
  return result
}
export const atropateneNewStateIds=['northern-atropatene','atropatene-river-basin','atropatene-coast'] as const
// Remain on the eastern foothills of the Assyrian/Zagros barrier. The long
// former Ganzak arm on the western side is returned to its adjoining valleys.
const easternFoot=(id:string):LonLat[]=>{
  const range=coreRangeGround.find(r=>r.id===id)!
  return ridgeBaseLine(range.mapPoints,range.width,-1).map(([x,y])=>[29+(x-60)/33,43-(y-35)/40])
}
const upperFoot=easternFoot('zagros-upper')
// The open notch above the southern ridge ends on the Lesser Zab, rather
// than leaving a dry-land crescent west of the river inside Ganzak.
export const ganzakUpperRiver=riverReach('Lesser Zab',[45.48,36.17],[45.97,36.62])
export const atropateneWesternPassOutline:readonly LonLat[]=[
  [45.08,36.24],[45.54,36.28],[45.62,36.42],[45.97,36.62],
  [45.57,36.90],[45.32,36.94],[45.14,36.52],
]
export const atropateneWesternEdge:readonly LonLat[]=[
  ...curve([...upperFoot,[45.30,36.53],[45.12,36.28],[45.48,36.29],[45.54,36.28]]),
  ganzakUpperRiver[0],
  ...curve([ganzakUpperRiver[0],...easternFoot('zagros-zab').slice(-1),
  ...easternFoot('zagros-north').slice(0,2),[46.45,35.90],mediaNorthernRiver[0],
  ]).slice(1),
]
// The orange-marked shoulder is part of the Median side of the frontier,
// with independent relief covering the gap between Ganzak and Nisaea.
export const nisaeanMountainShoulderOutline:readonly LonLat[]=[
  [46.16,35.70],[46.42,36.08],[46.64,36.12],[46.84,35.68],
]
const eastJoin=medianNorthernEdge.findIndex(([lon])=>lon>49.49&&lon<49.51)
const riverWest=riverReach('Qezel Owzan',mediaNorthernRiver.at(-1)!,[47.94102,37.51496])
const riverNorth=riverWest.at(-1)!
const riverEastBank=riverReach('Qezel Owzan',riverNorth,[49.48975,36.88178])
const riverEast=riverEastBank.at(-1)!
const riverMouth=riverReach('Qezel Owzan',riverEast,[49.9502,37.44606])
const riverLakeJoin=riverReach('Qezel Owzan',[47.74854,37.07253],riverNorth)
export const atropateneSouthernEdge:readonly LonLat[]=medianNorthernEdge.slice(
  medianNorthernEdge.findIndex(p=>p===mediaNorthernRiver[0]),eastJoin+1,
)
export const atropateneEasternFoothillEdge:readonly LonLat[]=curve([
  riverEast,[49.58,36.75],[49.54,36.58],atropateneSouthernEdge.at(-1)!,
])
export const atropateneProvinceOutline:readonly LonLat[]=[
  ...curve([upperFoot[0],[45.08,38.28],[45.45,38.40],[45.85,38.42],
    [46.18,38.26],[46.65,38.32],[47.25,38.35],[47.80,38.40],
    [48.35,38.38],[49.30,38.40]]),
  [50.25,38.30],[50.25,37.30],[riverMouth.at(-1)![0],37.30],...riverMouth.slice().reverse(),
  ...atropateneEasternFoothillEdge.slice(1),
  ...atropateneSouthernEdge.slice(0,-1).reverse(),
  ...atropateneWesternEdge.slice(0,-1).reverse(),
]
export const atropateneNorthernDivide:readonly LonLat[]=[
  ...curve([[46.18,38.26],[46.25,38.05],[46.70,37.80],[47.15,37.45],
    [47.60,37.13],riverLakeJoin[0]]),
  ...riverLakeJoin.slice(1),
  ...curve([riverNorth,[48.40,37.91],[49.35,38.06]]).slice(1),
]
export const atropateneDistrictMasks:readonly {stateId:string;outline:readonly LonLat[]}[]=[
  {stateId:'northern-atropatene',outline:[
    ...atropateneNorthernDivide,[51,38.06],[51,41],[46.18,41],
  ]},
  {stateId:'atropatene-coast',outline:[
    ...riverEastBank,...riverMouth.slice(1),[riverMouth.at(-1)![0],37.30],[51,37.30],[51,41],
    [riverNorth[0],41],
  ]},
  {stateId:'atropatene-river-basin',outline:[
    ...riverWest.slice().reverse(),
    ...atropateneSouthernEdge.slice(atropateneSouthernEdge.findIndex(p=>p===mediaNorthernRiver.at(-1)!)+1),
    ...atropateneEasternFoothillEdge.slice(0,-1).reverse(),...riverEastBank.slice(0,-1).reverse(),
  ]},
  {stateId:'atropatene',outline:[
    [44,ganzakUpperRiver[0][1]],...ganzakUpperRiver,
    ...curve([ganzakUpperRiver.at(-1)!,[46.05,36.76],[46.65,37.03],
      [47.18,37.25],[47.50,37.16],riverLakeJoin[0]]).slice(1),
    ...riverLakeJoin.slice(1),
    [riverNorth[0],41],[44,41],
  ]},
]
