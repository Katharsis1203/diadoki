import type { LonLat } from './geographyContent.ts'
import { assyriaBoundaryCuts, assyriaJunctions } from './assyriaGeography.ts'
import { susaFoothillMargin, susaEasternMargin, susaWetlandMargin } from './susaGeography.ts'

// Coarse geographic divisions, independent of illustrated peak anchors. These
// are campaign catchments: ridge crest, foothill edge and connecting saddle.
export const terrainJunctions: readonly { states: readonly string[]; at: LonLat }[] = [
  ...assyriaJunctions,
  {states:['ganzak','zagros','nisaea'],at:[46.10,35.65]},
  {states:['diyala','zagros','nisaea'],at:[46.64,34.33]},
  {states:['diyala','nisaea','cossaea'],at:[46.86,34.13]},
  {states:['nisaea','cossaea','ecbatana'],at:[48.45,33.27]},
  {states:['cossaea','ecbatana','paraitakene'],at:[48.90,33.42]},
  {states:['cossaea','susa','elymais'],at:[49.13,32.45]},
  {states:['cossaea','elymais','paraitakene'],at:[49.65,32.68]},
]

export const terrainBoundaryCuts: readonly { states: readonly [string,string]; feature: string; via: readonly LonLat[] }[] = [
  ...assyriaBoundaryCuts,
  {states:['zagros','ganzak'],feature:'Northern upland saddle',via:[[45.69,35.82],[45.90,35.75]]},
  {states:['ganzak','nisaea'],feature:'Upper plain valley margin',via:[[46.45,35.63],[46.78,35.72],[47.13,35.80]]},
  {states:['zagros','nisaea'],feature:'Zagros crest',via:[[46.18,35.37],[46.36,35.12],[46.55,34.84],[46.70,34.53]]},
  {states:['diyala','zagros'],feature:'Diyala basin foothill edge',via:[[45.03,34.55],[45.39,34.34],[45.72,34.17],[46.04,34.16],[46.35,34.24]]},
  {states:['diyala','nisaea'],feature:'Pass between the northern and Cossaean ridges',via:[[46.73,34.25]]},
  {states:['diyala','cossaea'],feature:'Western Cossaean foothills',via:[[46.75,33.84],[46.72,33.52],[46.81,33.23],[46.84,33.00]]},
  {states:['nisaea','cossaea'],feature:'Nisaean plain and Cossaean mountain margin',via:[[47.16,34.17],[47.40,34.03],[47.66,33.83],[47.94,33.60],[48.22,33.38]]},
  {states:['cossaea','ecbatana'],feature:'Eastern plateau saddle',via:[[48.63,33.33]]},
  {states:['cossaea','paraitakene'],feature:'Eastern mountain escarpment',via:[[49.14,33.18],[49.44,32.91]]},
  {states:['cossaea','susa'],feature:'Susian plain foothill edge',via:susaFoothillMargin},
  {states:['susa','elymais'],feature:'Western Elymaean foothill valley',via:susaEasternMargin},
  {states:['susa','karun'],feature:'Susian cultivated plain and wetland margin',via:susaWetlandMargin},
  {states:['cossaea','elymais'],feature:'Connecting saddle across the mountain district',via:[[49.39,32.59]]},
  {states:['elymais','paraitakene'],feature:'Southern plateau edge',via:[[49.95,32.72],[50.24,32.61]]},
]
