import type { LonLat } from './geographyContent.ts'
import { roundedBorder } from './borderCurves.ts'

// One authored centre per atlas district. These are visual development levels;
// Persis has not yet been integrated into the playable campaign economy.
export const persisCentres = [
  {stateId:'persepolis',name:'Persepolis',development:3,isCapital:true,landscape:'Cultivated plain below the Zagros foothills, with a settlement beside the surviving royal terraces.'},
  {stateId:'pasargadae',name:'Pasargadae',development:1,isCapital:false,landscape:'A small settlement among garden plots and the older royal monuments in an upland valley.'},
  {stateId:'western-persis',name:'Western Persis',development:0,isCapital:false,landscape:'Scattered farming in the western foothill valleys.'},
  {stateId:'persian-coast',name:'Persian Coast',development:1,isCapital:false,landscape:'A coastal settlement with sparse palms and dry inland terraces.'},
  {stateId:'western-foothills',name:'Western Foothills',development:0,isCapital:false,landscape:'The western entry valley below the Northern Highlands, connecting the Mountain Entrance approach to the Pasargadae corridor.'},
] as const

// The provincial envelope follows the basin side of the northern/eastern
// foothills. Coastal clipping comes from the existing shared land mesh.
export const persisProvinceOutline: readonly LonLat[] = [
  [49.0,32.55],[49.7,33.25],[50.35,33.05],[51.10,32.85],
  [51.70,33.02],[52.40,33.20],[53.20,33.20],[54.20,33.08],
  [55.00,32.60],[55.70,31.92],[55.90,31.30],[55.40,30.85],[54.65,30.45],
  [53.90,29.45],[54.20,29.00],[54.65,28.50],[55.10,27.90],
  [55.45,27.35],[55.60,26.0],[49.0,26.0],[49.0,30.0],
]

// A broad pass crosses the northern Carmanian ridge into its eastern valley.
// Only this corridor joins Persis; the Carmanian Uplands district remains there.
export const pasargadaePassOutline: readonly LonLat[] = [
  [53.50,30.55],[54.20,30.70],[54.90,31.10],[55.60,31.35],
  [56.35,31.40],[56.70,31.12],[56.80,30.82],[56.25,30.50],
  [55.65,30.20],[55.10,29.80],[54.50,29.75],[53.60,30.10],
]

// Bounded capital and pass districts are assigned first. Open shared cuts
// allocate the coast and western valleys; only the northern plateau remains.
export const persisDistrictMasks: readonly {stateId:string;outline:readonly LonLat[]}[] = [
  {stateId:'persepolis',outline:[[51.78,30.05],[51.93,30.48],[52.28,30.62],[52.65,30.83],
    [53.02,30.96],[53.38,30.80],[53.77,30.58],[54.03,30.22],[54.05,29.88],
    [53.95,29.52],[53.61,29.18],[53.15,29.11],[52.71,29.19],[52.25,29.16],[51.93,29.43]]},
  {stateId:'pasargadae',outline:[[52.72,31.18],[52.77,31.48],[53.25,31.90],
    [53.90,31.83],[54.55,31.62],[55.25,31.46],[55.80,31.50],[56.40,31.40],
    [56.75,31.10],[56.80,30.82],[56.25,30.50],[55.65,30.20],[55.10,29.95],
    [54.50,30.08],[53.95,30.31],[53.50,30.61],[53.02,30.96]]},
]
// The closure lies outside the province and stays straight. Only the shared
// interior chain is smoothed, so distant corners cannot bow the district cut.
export const persisCoastalCut: readonly LonLat[] = [[48,28.65],[50.5,28.70],[51.4,28.90],[52.2,29.05],[53.2,29.00],[54.1,29.10],[55.1,28.7],[56,28.4],[58,28.4]]
export const persisWesternCut: readonly LonLat[] = [[48,31.7],[50.70,31.6],[51.30,31.18],[51.80,30.85],[52.20,30.73],[52.40,30.50],[52.10,30.10],[52.02,29.4],[51.9,28.4],[51.9,25]]

// A broad unowned highland region replaces the northern plateau catchment.
// Its southern ridge forms the roof of the inhabited Pasargadae corridor.
export const persisNorthernHighlandsOutline:readonly LonLat[]=roundedBorder([
  [50.75,32.72],[51.10,32.85],[51.70,33.02],[52.40,33.20],[53.20,33.20],
  [54.20,33.08],[55.00,32.60],[55.70,31.92],[55.90,31.30],
  [55.15,31.44],[54.55,31.63],[53.90,31.82],[53.25,31.91],[52.65,31.80],
  [52.15,31.82],[51.90,32.06],[51.60,32.23],[51.20,32.32],
])
export const persisNorthernHighlandsLabel:LonLat=[53.25,32.55]

// Relief axes are campaign-scale terrain, with a connected southern ridge
// framing the corridor while preserving the Carmanian crossing at its end.
export const persisNorthernRidges = [
  {id:'persis-corridor-north-ridge',name:'Northern Highlands southern ridge',system:'zagros',axis:[[51.65,32.15],[52.10,31.82],[52.65,31.80],[53.25,31.91],[53.90,31.82],[54.55,31.63],[55.15,31.44],[55.90,31.30]],width:16,scale:.62,endScale:[.85,1]},
  {id:'persis-northeast-ridge',name:'Persis northeastern uplands',system:'kerman',axis:[[55.80,31.63],[55.65,31.98],[55.25,32.40],[54.75,32.84]],width:18,scale:.55,endScale:[.9,.38]},
  {id:'persis-northern-foothills-east',name:'Eastern plateau foothills',system:'zagros',axis:[[54.36,33.10],[53.80,33.26],[53.20,33.30]],width:13,scale:.53,relief:'hill',endScale:[.42,.80]},
  {id:'persis-northern-foothills-west',name:'Western plateau foothills',system:'zagros',axis:[[52.80,33.22],[52.20,33.10],[51.70,32.93]],width:12,scale:.49,relief:'hill',endScale:[.78,.35]},
] as const
