import type { LonLat } from './geographyContent.ts'
import { roundedOpenBorder } from './borderCurves.ts'
import { westernValleyRiver } from './mountainEntranceGeography.ts'
import { riverReach } from './babyloniaGeography.ts'

// Keep river junctions exact: rounding their longitude before projection
// creates tiny disconnected wedges between the physical and political mesh.
const sharedCurve=(points:readonly LonLat[]):LonLat[]=>{
  const curve=roundedOpenBorder(points)
  curve[0]=[...points[0]]
  curve[curve.length-1]=[...points.at(-1)!]
  return curve
}

// Northern river frontage is taken from the displayed Qezel Owzan reaches.
// Its two source lines meet at their upstream ends, so join them explicitly.
export const mediaNorthernRiver:readonly LonLat[]=[
  ...riverReach('Qezel Owzan',[46.83813,35.84968],[47.26992,35.90180]),
  ...riverReach('Qezel Owzan',[47.27158,35.90168],[48.17798,36.09499]),
]
export const mediaNorthernLatitude=mediaNorthernRiver.at(-1)![1]
export const zagrosWesternRiver=riverReach('Diyala',[45.82,34.91],[45.17,33.87])
const zagrosEasternEdge=sharedCurve([
  mediaNorthernRiver[1],[46.90,35.63],[46.80,35.40],[46.75,35.08],
  [46.70,34.70],[46.90,34.35],[47.15,34.15],[47.19,33.75],[47.00,33.62],
])
// Intermediate catchment contour used before the final local-Diyala cut.
// Retaining this shared northern shoulder keeps the surrounding mesh stable.
export const zagrosDistrictOutline:readonly LonLat[]=[
  [46.10,35.65],[46.45,35.78],
  mediaNorthernRiver[0],
  ...zagrosEasternEdge,
  ...sharedCurve([[47.00,33.62],[46.90,33.58],[46.75,33.38],
    [46.40,33.38],[45.90,33.50],[45.45,33.72],[45.17,33.87]]).slice(1),
  ...zagrosWesternRiver.slice(0,-1).reverse(),
  ...sharedCurve([[45.82,34.91],[45.45,35.10],[45.10,35.30],[44.78,35.60]]).slice(1,-1),
]
const capitalWesternEdge=sharedCurve([
  mediaNorthernRiver.at(-1)!,[48.15,35.75],[47.91,35.39],[47.86,35.06],
  [47.74,34.55],[47.72,34.45],westernValleyRiver[5],
])
const capitalSouthernEdge=westernValleyRiver.slice(5)
const capitalEasternEdge=sharedCurve([
  capitalSouthernEdge.at(-1)!,[49.17,34.00],[49.55,34.20],[49.68,34.50],
  [49.90,34.80],[49.85,35.05],[49.65,35.40],[49.80,35.55],
  [49.70,mediaNorthernLatitude],
])
const easternPlateauEdge=sharedCurve([
  [49.55,35.55],[50.15,35.40],[50.40,35.14],[50.66,34.75],
  [50.94,34.36],[51.00,34.00],[50.90,33.65],[51.10,33.20],
])

// Partition the southern catchments before cutting the final northern
// provincial edge. Western Valley is subsequently grouped with Susiana.
export const mediaDistrictMasks:readonly {stateId:string;outline:readonly LonLat[]}[]=[
  {stateId:'ecbatana',outline:[
    ...capitalWesternEdge,...capitalSouthernEdge.slice(1),...capitalEasternEdge.slice(1),
  ]},
  {stateId:'western-valley',outline:[
    [47.25,34.16],...westernValleyRiver,
    [49.17,34.00],[49.14,33.85],[49.40,33.70],[49.70,33.558824],
    [49.35,32.93],[49.20,32.746667],[48.81,32.97],[48.55,33.02],
    [48.20,33.18],[47.87,33.37],[47.49,33.61],[47.23,33.92],
  ]},
  {stateId:'nisaea',outline:[
    ...mediaNorthernRiver.slice(1),...capitalWesternEdge.slice(1),
    ...westernValleyRiver.slice(0,5).reverse(),[47.25,34.16],[47.30,34.00],[47.19,33.75],
    ...zagrosEasternEdge.slice().reverse(),
  ]},
  {stateId:'paraitakene',outline:[
    [44,35.55],...easternPlateauEdge,[53,32],[53,30],[44,30],
  ]},
]

export const mediaStateNotes:Record<string,string>={
  atropatene:'The northern lake and upland district belongs to independent Atropatene, beyond Nicanor’s Median frontier.',
  ganzak:'Ganzak is the seat of independent Atropatene. Its southern foothill basin ends at the Nisaean river, east of the Assyrian mountain barrier.',
  'northern-atropatene':'The northern upland state lies above the lake district’s ridge and reaches the Caspian shore.',
  'atropatene-river-basin':'The southern river basin occupies the country between the Qezel Owzan’s two arms, north of Media.',
  'atropatene-coast':'The Caspian coastal state lies between the eastern river arm and the shore, below the northern uplands.',
  zagros:'The Babylonia district of Zagros remains under Nicanor. Its northern edge follows the local Diyala around both mountain entrances. The western approach has a straight upper join and follows the lower river bank.',
  nisaea:'The Nisaean plain lies between the western Zagros barrier and Ecbatana’s upland hinterland, bounded by the northern Qezel Owzan and upper Karkheh valley.',
  ecbatana:'The Median capital sits in a broad central upland basin, bounded by the Nisaean plain, Western Valley and eastern plateau.',
  rhagae:'The northeastern basin below the Alborz ranges, beyond the eastern Median uplands.',
  paraitakene:'The eastern plateau below Rhagae and southeast of Ecbatana, ending at the northern mountain barriers above Persis.',
  'western-valley':'The upper Karkheh valley forms Susiana’s northern approach, following the river and connecting to Susa through the western mountain pass.',
}

// The short river marked above Zagros is the upper Diyala, not the much
// farther northern Qezel Owzan. Reuse its centreline for both banks.
export const zagrosNorthernRiver=riverReach('Diyala',[45.57,34.70],[46.37,35.30])
export const zagrosLowerOutline:readonly LonLat[]=[
  ...zagrosNorthernRiver,
  ...sharedCurve([[46.37,35.30],[46.62,35.28],[46.75,35.08]]).slice(1),
  ...zagrosEasternEdge.slice(zagrosEasternEdge.findIndex(([lon,lat])=>lon===46.75&&lat===35.08)+1),
  ...sharedCurve([[47.00,33.62],[46.90,33.58],[46.75,33.38],
    [46.40,33.38],[45.90,33.50],[45.45,33.72],[45.17,33.87]]).slice(1),
  ...riverReach('Diyala',[45.17,33.87],[45.57,34.70]).slice(1,-1),
]

// Media ends beneath the northern ridges. Ganzak and Atropatene have their
// own provincial hinterland above it, including the former capital's spur.
export const medianNorthernEdge:readonly LonLat[]=[
  [44,35.84968],...mediaNorthernRiver,
  ...sharedCurve([mediaNorthernRiver.at(-1)!,[48.50,36.12],[49.15,36.18],
    [49.58,36.40],[49.95,36.60],[50.25,36.50],[51.00,36.29],
    [51.75,36.15],[52.23,35.97],[55,35.97]]).slice(1),
]

// Join the local channel to the existing western frontier with a foothill
// curve, rather than introducing a straight latitude cut through dry land.
export const localRiverNorthernCountry:readonly LonLat[]=[
  ...sharedCurve([[44,35.45],[44.55,35.14],[44.93,34.96],
    [45.35,34.75],zagrosNorthernRiver[0]]),
  ...zagrosNorthernRiver.slice(1),[47,35.30],[47,40],[44,40],
]

// Use the entire local northern river bend, including its western reach.
// This closes the old diagonal shortcut from the downstream junction.
const nisaeanWesternRiverEdge=sharedCurve([
  [46.75,35.08],[46.70,35.40],[46.74,35.65],mediaNorthernRiver[0],
])
export const nisaeanRiverOutline:readonly LonLat[]=[
  ...mediaNorthernRiver,...capitalWesternEdge.slice(1),
  ...westernValleyRiver.slice(0,5).reverse(),[47.25,34.16],[47.30,34.00],[47.19,33.75],
  ...zagrosEasternEdge.slice(zagrosEasternEdge.findIndex(([lon,lat])=>lon===46.75&&lat===35.08)).reverse(),
  ...nisaeanWesternRiverEdge.slice(1,-1),
]

// Rhagae starts at the western base of its northern ridge. Reuse a sampled
// provincial vertex so the internal division has one exact three-way junction.
const northernCapitalJoin=medianNorthernEdge.find(([lon])=>lon>48.70&&lon<48.80)!
export const rhagaeWesternRidgeEdge:readonly LonLat[]=sharedCurve([
  [49.80,35.55],[49.60,35.70],[49.20,35.88],[48.95,36.00],northernCapitalJoin,
])
const capitalRiverEnd=medianNorthernEdge.findIndex(([lon,lat])=>lon===mediaNorthernRiver.at(-1)![0]&&lat===mediaNorthernRiver.at(-1)![1])
const capitalNorthJoin=medianNorthernEdge.indexOf(northernCapitalJoin)
export const refinedCapitalOutline:readonly LonLat[]=[
  ...capitalWesternEdge,...capitalSouthernEdge.slice(1),
  ...capitalEasternEdge.slice(1,capitalEasternEdge.findIndex(([lon,lat])=>lon===49.80&&lat===35.55)+1),
  ...rhagaeWesternRidgeEdge.slice(1),
  ...medianNorthernEdge.slice(capitalRiverEnd,capitalNorthJoin).reverse(),
]

// The straight upper reach and lower bank share the authored Diyala course.
export const zagrosWesternBorder=riverReach('Diyala',[45.57,34.70],[45.17,33.87])
export const sipparNorthernBorder:readonly LonLat[]=sharedCurve([
  [43.854071,34.196095],[44.60,34.45],zagrosNorthernRiver[0],
])
