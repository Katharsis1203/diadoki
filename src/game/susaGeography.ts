import type { LonLat, SettlementDefinition } from './geographyContent.ts'
import { riverReach } from './babyloniaGeography.ts'

// Use the displayed river centreline for shared state divisions, as in
// Babylonia: neither adjoining district acquires the whole river channel.
export const susaKarunRiverBank:readonly LonLat[]=riverReach('Karkheh',[48.59316,31.64338],[47.46606,30.97602])
const karunWesternConfluence=riverReach('Tigris',[47.4412,30.999],[47.4412,30.999])[0]
// The middle floodplain ends at the Karun/Shatt confluence. Reuse displayed
// river vertices so its eastern bank cannot drift across the river or coast.
export const karunEasternBank:readonly LonLat[]=riverReach('Karun',[48.89,32.20],[48.16,30.43])
// Extend the independent mountain shoulder down to the upper river bend.
// The river separates Elymais from this unowned ground; it is not a new state.
const upperKarunReach=riverReach('Karun',[48.89,32.20],[49.84,32.23])
// Turn towards the pass partway along this straight displayed river segment,
// leaving its upper reach and the wider northern valley in Mountain Entrance.
const bendFrom=upperKarunReach.at(-2)!,bendTo=upperKarunReach.at(-1)!
export const elymaisNorthernRiver:readonly LonLat[]=[...upperKarunReach.slice(0,-1),
  [bendFrom[0]+(bendTo[0]-bendFrom[0])*.625,bendFrom[1]+(bendTo[1]-bendFrom[1])*.625]]
export const susianRiverMountainMargin:readonly LonLat[]=[
  ...elymaisNorthernRiver,[49.58,32.56],[49.30,32.55],
  [48.94,32.57],[48.95,32.35],
]
const susaUpperKarunBank=karunEasternBank.slice(0,4)
export const susianaDistrictMasks:readonly {stateId:string;outline:readonly LonLat[]}[]=[
  {stateId:'susa',outline:[
    [44,37],[49.25,37],[49.25,33.45],[49.15,33.08],
    [48.58,32.86],[48.76,32.73],[48.94,32.57],[48.95,32.35],
    ...susaUpperKarunBank,...susaKarunRiverBank,karunWesternConfluence,[44,karunWesternConfluence[1]],
  ]},
  {stateId:'mountain-entrance',outline:[
    [49.25,37],[55,37],[55,30.90],[51.50,30.90],[50.70,31.60],
    [50.35,31.765],[50.17,31.96],...elymaisNorthernRiver.slice().reverse(),
    [48.95,32.35],[48.94,32.57],[48.76,32.73],[48.58,32.86],
    [49.15,33.08],[49.25,33.45],
  ]},
  {stateId:'karun',outline:[
    [44,34],[48.94,32.57],[48.95,32.35],...karunEasternBank,
    [44,karunEasternBank.at(-1)![1]],
  ]},
]

// Campaign-scale landscape cuts, not surveyed ancient administrative borders.
export const susaFoothillMargin: readonly LonLat[] = [[47.02,32.68],[47.23,32.71],[47.42,32.76],[47.65,32.80],[47.88,32.78],[48.09,32.76],[48.25,32.68],[48.38,32.60],[48.53,32.51],[48.68,32.44],[48.81,32.41],[48.98,32.43]]
export const susaEasternMargin: readonly LonLat[] = [[49.00,32.40],[48.90,32.34],[48.78,32.24],[48.71,32.16],[48.60,32.02],[48.61,31.92]]
export const susaWetlandMargin: readonly LonLat[] = [[47.58,31.46],[47.76,31.57],[47.94,31.63],[48.10,31.66],[48.25,31.72],[48.43,31.75],[48.57,31.79]]

// One named map centre for each neighbouring state. These district names
// describe campaign settlements without asserting specific ancient town sites.
export const susianaStateSettlements: readonly SettlementDefinition[] = [
  {id:'karun-centre',name:'Karun',stateId:'karun',position:[48.15,31.15],kind:'village'},
  {id:'elymais-centre',name:'Elymais',stateId:'elymais',position:[49.50,31.02],kind:'village'},
]

export const susaStateNotes: Record<string,string> = {
  susa:'The broad Susian and Cossaean river plain around Susa, bounded by northern mountain barriers and the lower Karkheh. Date groves, farms and southern reedbeds frame the capital’s larger hinterland.',
  karun:'The river-bounded floodplain below Susa, entirely east of the lower Karkheh and west of the Karun, ending at their lower confluences. The western Tigris–Karkheh pocket belongs to Susa.',
  elymais:'The combined southern hinterland, spanning the lower Karun country, coastal plain and eastern foothills, with its northern edge on the upper Karun bend below independent mountain terrain, and sharing the open middle pass with Mountain Entrance.',
  'mountain-entrance':'Northern approach valley between the mountain belts, with a wider eastern valley floor. The northern crossing is closed; the middle pass is shared with Elymais.',
}

// Schematic local irrigation; major river courses live in terrainBackbone.ts.
export const susaFeederChannels: readonly {id:string;name:string;points:readonly LonLat[]}[] = [
  {id:'susa-shaur-channel',name:'Susa farming channel',points:[[48.15454,32.32726],[48.28,32.30],[48.32,32.16],[48.38,32.06],[48.42,31.98]]},
  {id:'susa-west-feeder',name:'Western farming channel',points:[[48.22275,32.18696],[48.05,32.16],[47.87,32.10],[47.75,32.08],[47.64,31.99]]},
]
