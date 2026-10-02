import { project } from './data.ts'
import type { LonLat } from './geographyContent.ts'
import type { RidgeSection } from './terrainBackbone.ts'

// Geographic theatre, not a new playable partition. Northern India extends
// through the Ganges plain; deeper Balkans, steppes and southern India are bare
// context. The existing regional projection and state mesh remain canonical.
export const WORLD_EXTENT = {west:7,east:92.5,south:21.5,north:47}
export const worldBounds = {
  left:project([WORLD_EXTENT.west,WORLD_EXTENT.north])[0],
  right:project([WORLD_EXTENT.east,WORLD_EXTENT.north])[0],
  top:project([WORLD_EXTENT.west,WORLD_EXTENT.north])[1],
  bottom:project([WORLD_EXTENT.west,WORLD_EXTENT.south])[1],
}
export const worldRegions:readonly {id:string;name:string;at:LonLat;bounds:readonly [number,number,number,number]}[] = [
  {id:'italy',name:'Italy',at:[12.8,41.5],bounds:[7,36,18.5,47]},
  {id:'sicily',name:'Sicily',at:[13.7,37.2],bounds:[11.8,36,16,38.6]},
  {id:'greece',name:'Greece',at:[23.0,37.8],bounds:[18.5,34.5,26.5,40.2]},
  {id:'macedonia',name:'Macedonia',at:[23.3,41.0],bounds:[19,40.2,24.5,42.5]},
  {id:'thrace',name:'Thrace',at:[26.0,41.0],bounds:[24.5,39.5,29,43]},
  {id:'anatolia',name:'Anatolia',at:[30.0,39.0],bounds:[26,35.5,42,42]},
  {id:'cyrenaica',name:'Cyrenaica',at:[21.2,31.4],bounds:[18,29,25,33.5]},
  {id:'egypt',name:'Egypt',at:[29.6,27.8],bounds:[25,21.5,34.8,32]},
  {id:'levant',name:'Levant',at:[37.4,32.0],bounds:[34.5,28,39,36.5]},
  {id:'mesopotamia',name:'Mesopotamia',at:[41.0,33.3],bounds:[39,29,48,38]},
  {id:'persia',name:'Persia',at:[53.7,32.3],bounds:[48,25,61.5,39]},
  {id:'bactria',name:'Bactria',at:[67.5,37.4],bounds:[62,35.5,74,39.5]},
  {id:'sogdiana',name:'Sogdiana',at:[67.1,40.0],bounds:[62,39.5,74,42]},
  {id:'arachosia',name:'Arachosia',at:[65.5,31.8],bounds:[61.5,29,70,35.5]},
  {id:'gedrosia',name:'Gedrosia',at:[62.8,25.4],bounds:[56,24,68,29]},
  {id:'indus',name:'Indus basin',at:[68.7,27.4],bounds:[67,23,73.5,33]},
  {id:'punjab',name:'Punjab',at:[74.0,30.8],bounds:[70,29,78,35.5]},
  {id:'ganges',name:'Ganges plain',at:[83.5,25.3],bounds:[78,21.5,92.5,30.5]},
]
export function worldRegionAt(x:number,y:number){
  const lon=29+(x-60)/33,lat=43-(y-35)/40
  return worldRegions.filter(r=>lon>=r.bounds[0]&&lon<=r.bounds[2]&&lat>=r.bounds[1]&&lat<=r.bounds[3])
    .toSorted((a,b)=>(a.bounds[2]-a.bounds[0])*(a.bounds[3]-a.bounds[1])-(b.bounds[2]-b.bounds[0])*(b.bounds[3]-b.bounds[1]))[0]
}

// Authored geographic axes informed by Natural Earth's physical-label regions.
// Separate sections reserve major basins, passes and river valleys. Broad
// plains have no invented mountains merely to fill space.
export const worldRidgeSections:readonly RidgeSection[]=[
  {id:'caucasus-west',name:'Western Greater Caucasus',system:'caucasus',axis:[[39.6,43.5],[40.4,43.5],[41.1,43.4],[41.8,43.2]],width:25,scale:.87},
  {id:'caucasus-central',name:'Central Greater Caucasus',system:'caucasus',axis:[[42.2,43.1],[43.0,43.0],[43.8,42.8],[44.6,42.65]],width:27,scale:.94},
  {id:'caucasus-east',name:'Eastern Greater Caucasus',system:'caucasus',axis:[[45.0,42.4],[45.8,42.15],[46.6,41.8],[47.4,41.4]],width:24,scale:.84},
  {id:'alps-west',name:'Western Alps',system:'alps',axis:[[6.8,44.1],[7.0,44.8],[7.3,45.5],[8.0,46.0],[8.8,46.4]],width:25,scale:.85},
  {id:'alps-east',name:'Italian Alpine rim',system:'alps',axis:[[9.5,46.4],[10.5,46.5],[11.5,46.5],[12.5,46.4],[13.4,46.2]],width:25,scale:.84},
  {id:'apennines-north',name:'Northern Apennines',system:'apennines',axis:[[9.0,44.35],[9.7,44.25],[10.3,44.1],[11.0,43.9],[11.65,43.6]],width:15,scale:.58},
  {id:'apennines-central',name:'Central Apennines',system:'apennines',axis:[[12.1,43.4],[12.6,42.9],[13.0,42.5],[13.55,42.15],[14.0,41.75]],width:17,scale:.69},
  {id:'apennines-south',name:'Southern Apennines',system:'apennines',axis:[[14.3,41.45],[14.8,41.05],[15.3,40.65],[15.75,40.2],[16.0,39.75]],width:16,scale:.62},
  {id:'calabria',name:'Calabrian uplands',system:'apennines',axis:[[16.25,39.45],[16.4,39.05],[16.1,38.65],[15.9,38.2]],width:13,scale:.53},
  {id:'sicilian-ridge',name:'Sicilian northern ridge',system:'sicily',axis:[[13.4,37.85],[14.0,37.9],[14.55,37.95]],width:13,scale:.53},
  {id:'etna',name:'Etna',system:'sicily',axis:[[15.0,37.76],[15.03,37.82]],width:11,scale:.82},
  {id:'pindus-north',name:'Epirus and northern Pindus',system:'pindus',axis:[[20.55,40.75],[20.65,40.25],[20.95,39.85],[21.25,39.45]],width:19,scale:.73},
  {id:'pindus-south',name:'Southern Pindus',system:'pindus',axis:[[21.4,39.15],[21.55,38.8],[21.85,38.5]],width:17,scale:.65},
  {id:'olympus',name:'Olympus massif',system:'greece',axis:[[22.15,40.1],[22.3,39.9],[22.55,39.85]],width:17,scale:.80},
  {id:'othrys-parnassus',name:'Central Greek uplands',system:'greece',axis:[[22.0,39.05],[22.3,38.82],[22.5,38.55],[22.7,38.35]],width:15,scale:.57},
  {id:'arcadia',name:'Arcadian uplands',system:'greece',axis:[[21.9,37.75],[22.3,37.6],[22.65,37.5]],width:14,scale:.63},
  {id:'taygetos',name:'Taygetos',system:'greece',axis:[[22.15,37.1],[22.25,36.8],[22.35,36.6]],width:11,scale:.65},
  {id:'rhodope',name:'Rhodope Mountains',system:'rhodope',axis:[[23.9,41.4],[24.6,41.6],[25.4,41.7],[26.0,41.55]],width:22,scale:.70},
  {id:'crete-west',name:'Cretan White Mountains',system:'crete',axis:[[23.95,35.38],[24.16,35.28]],width:10,scale:.57},
  {id:'crete-ida',name:'Cretan Ida massif',system:'crete',axis:[[24.8,35.24],[25.02,35.18]],width:10,scale:.60},
  {id:'crete-dikte',name:'Cretan Dikte massif',system:'crete',axis:[[25.55,35.1],[25.75,35.08]],width:9,scale:.49},
  {id:'troodos',name:'Troodos Mountains',system:'cyprus',axis:[[32.7,34.9],[33.0,34.85],[33.28,34.95]],width:11,scale:.57},
  {id:'kyrenia',name:'Kyrenia ridge',system:'cyprus',axis:[[32.99,35.28],[33.35,35.3],[33.7,35.35]],width:8,scale:.45},
  {id:'anatolian-ida',name:'Anatolian Ida massif',system:'west-anatolia',axis:[[26.5,39.8],[26.85,39.75],[27.15,39.6]],width:12,scale:.59},
  {id:'bithynian-ridge',name:'Bithynian uplands',system:'west-anatolia',axis:[[28.7,39.85],[29.1,40.0],[29.7,40.1],[30.2,40.15]],width:16,scale:.64},
  {id:'lydian-ridge',name:'Lydian and Phrygian uplands',system:'west-anatolia',axis:[[27.7,38.3],[28.35,38.4],[29.0,38.5],[29.65,38.7]],width:18,scale:.61},
  {id:'lycian-taurus',name:'Lycian Taurus',system:'taurus',axis:[[28.15,36.75],[28.8,36.9],[29.6,36.8],[30.2,36.65]],width:20,scale:.73},
  {id:'pisidian-taurus',name:'Pisidian Taurus',system:'taurus',axis:[[30.6,37.25],[30.9,37.55],[31.35,37.6]],width:22,scale:.77},
  {id:'cyrenaican-uplands',name:'Cyrenaican Green Mountain',system:'cyrenaica',axis:[[20.3,32.65],[21.0,32.75],[21.7,32.7],[22.3,32.5]],width:16,scale:.52},
  {id:'sinai',name:'Southern Sinai massif',system:'sinai',axis:[[33.7,29.2],[33.85,28.6],[34.2,28.1],[34.3,27.9]],width:17,scale:.65},
  {id:'red-sea-hills-north',name:'Northern Eastern Desert hills',system:'red-sea',axis:[[32.5,28.5],[32.8,27.5],[33.4,26.7]],width:17,scale:.54},
  {id:'red-sea-hills-south',name:'Southern Eastern Desert hills',system:'red-sea',axis:[[33.8,25.9],[34.3,25.1],[34.6,24.25]],width:17,scale:.58},
  {id:'judean-uplands',name:'Judean uplands',system:'jordan',axis:[[35.1,31.8],[35.05,31.4],[34.9,30.9]],width:12,scale:.46},
  {id:'transjordan',name:'Transjordan uplands',system:'jordan',axis:[[35.8,32.5],[35.9,32.1],[35.9,31.7],[35.8,31.3]],width:13,scale:.48},
  {id:'zagros-central-east',name:'Central Zagros highlands',system:'zagros',axis:[[49.3,33.6],[50.1,33.3],[50.9,32.8]],width:26,scale:.82},
  {id:'zagros-fars-north',name:'Northern Fars Zagros',system:'zagros',axis:[[49.85,32.0],[50.7,31.6],[51.5,30.9]],width:26,scale:.84},
  {id:'zagros-fars-south',name:'Southern Fars Zagros',system:'zagros',axis:[[52.0,30.5],[52.9,29.9],[53.8,29.4],[54.9,28.8],[55.8,28.0]],width:27,scale:.78},
  {id:'alborz-east',name:'Eastern Alborz',system:'alborz',axis:[[52.4,36.2],[53.2,36.4],[54.2,36.7],[55.4,37.0]],width:24,scale:.80},
  {id:'kopet-dag-west',name:'Western Kopet Dag',system:'kopet-dag',axis:[[55.8,37.8],[56.8,38.0],[57.7,37.85]],width:22,scale:.70},
  {id:'kopet-dag-east',name:'Eastern Kopet Dag',system:'kopet-dag',axis:[[58.3,37.6],[59.4,37.1],[60.3,36.8]],width:21,scale:.68},
  {id:'kerman-north',name:'Kerman uplands',system:'kerman',axis:[[55.9,31.45],[56.4,30.9],[57.0,30.4],[57.5,29.7]],width:21,scale:.66},
  {id:'kerman-south',name:'Jebal Barez',system:'kerman',axis:[[57.1,29.2],[57.65,28.7],[58.3,28.2]],width:20,scale:.69},
  {id:'paropamisus-west',name:'Western Paropamisus',system:'paropamisus',axis:[[61.8,35.0],[62.8,35.15],[63.8,35.15]],width:24,scale:.71},
  {id:'paropamisus-east',name:'Eastern Paropamisus',system:'paropamisus',axis:[[64.3,35.05],[65.4,35.1],[66.5,35.25]],width:25,scale:.76},
  {id:'hindu-kush-central',name:'Central Hindu Kush',system:'hindu-kush',axis:[[67.2,35.5],[68.3,35.7],[69.4,35.9],[70.1,36.25]],width:29,scale:.91},
  {id:'hindu-kush-east',name:'Eastern Hindu Kush',system:'hindu-kush',axis:[[70.7,36.6],[71.8,36.8],[72.8,36.5],[73.7,36.0]],width:29,scale:.97},
  {id:'pamir-west',name:'Western Pamir',system:'pamir',axis:[[71.6,38.2],[72.3,38.6],[73.0,38.9]],width:28,scale:.96},
  {id:'pamir-east',name:'Eastern Pamir',system:'pamir',axis:[[73.6,38.5],[74.4,38.1],[75.2,37.8]],width:28,scale:.92},
  {id:'zeravshan-ridge',name:'Zeravshan Mountains',system:'sogdian-uplands',axis:[[67.0,39.0],[68.0,39.15],[69.0,39.3],[70.2,39.35]],width:23,scale:.78},
  {id:'toba-kakar',name:'Arachosian and Toba Kakar uplands',system:'arachosia',axis:[[65.5,31.7],[66.4,31.6],[67.2,31.2],[68.2,31.1],[69.1,30.5]],width:22,scale:.70},
  {id:'sulaiman-north',name:'Northern Sulaiman',system:'sulaiman',axis:[[69.65,32.9],[69.93,32.1],[70.0,31.4],[70.15,30.8]],width:23,scale:.77},
  {id:'sulaiman-south',name:'Southern Sulaiman',system:'sulaiman',axis:[[70.25,30.4],[70.3,29.8],[70.0,29.2],[69.6,28.6]],width:23,scale:.71},
  {id:'kirthar',name:'Kirthar Range',system:'kirthar',axis:[[67.4,28.3],[67.5,27.8],[67.3,26.8],[67.4,25.9]],width:20,scale:.65},
  {id:'makran-west',name:'Western Makran',system:'makran',axis:[[58.4,26.8],[60.0,26.8],[61.5,26.6],[62.8,26.4]],width:23,scale:.63},
  {id:'makran-east',name:'Eastern Makran',system:'makran',axis:[[63.4,26.5],[64.5,26.7],[65.5,26.6],[66.5,26.3]],width:23,scale:.64},
  {id:'salt-range',name:'Punjab Salt Range',system:'salt-range',axis:[[71.7,32.65],[72.3,32.7],[72.9,32.7],[73.6,32.55]],width:15,scale:.48},
  {id:'karakoram',name:'Karakoram',system:'karakoram',axis:[[74.3,36.05],[75.2,35.85],[76.1,35.6],[77.0,35.15]],width:29,scale:.99},
  {id:'himalaya-kashmir',name:'Kashmir Himalaya',system:'himalaya',axis:[[74.8,34.4],[75.8,34.15],[76.8,33.6],[77.7,33.15]],width:29,scale:.94},
  {id:'himalaya-west',name:'Western Himalaya',system:'himalaya',axis:[[78.2,32.5],[78.8,31.85],[79.5,31.2],[80.3,30.5]],width:30,scale:.96},
  {id:'himalaya-nepal-west',name:'Western Nepal Himalaya',system:'himalaya',axis:[[81.0,30.0],[81.9,29.7],[82.9,29.3],[83.7,28.8]],width:30,scale:.98},
  {id:'himalaya-nepal-east',name:'Eastern Nepal Himalaya',system:'himalaya',axis:[[84.3,28.5],[85.2,28.3],[86.3,28.1],[87.3,27.85]],width:30,scale:1},
  {id:'himalaya-bhutan',name:'Sikkim and Bhutan Himalaya',system:'himalaya',axis:[[88.0,27.8],[89.0,27.85],[90.1,27.9],[91.3,27.8]],width:29,scale:.92},
  {id:'aravalli',name:'Aravalli Range',system:'aravalli',axis:[[73.0,24.7],[73.7,25.4],[74.4,26.1],[75.1,26.8],[75.8,27.5]],width:19,scale:.54},
  {id:'vindhya-west',name:'Western Vindhya',system:'vindhya',axis:[[75.0,23.3],[76.0,23.6],[77.0,23.75],[78.0,23.8]],width:18,scale:.51},
  {id:'vindhya-east',name:'Eastern Vindhya margin',system:'vindhya',axis:[[78.7,24.0],[79.7,24.2],[80.7,24.3],[81.7,24.5]],width:18,scale:.51},
]
