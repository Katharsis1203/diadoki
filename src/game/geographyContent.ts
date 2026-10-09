// Authored geographic content. Names, ownership and district centres live here,
// independently of the renderer. Districts are approximate campaign regions.
import { babyloniaStateNotes } from './babyloniaGeography.ts'
import { assyriaAdditionalSettlements, assyriaStateNotes } from './assyriaGeography.ts'
import { susianaStateSettlements, susaStateNotes } from './susaGeography.ts'
import { mediaStateNotes } from './mediaGeography.ts'
export type LonLat = readonly [number, number]
export type StateDefinition = {
  id: string
  name: string
  provinceId: string
  owner: string
  center: LonLat
  income: number
  development: number
  defense: number
  labelPosition?: LonLat
  landscape?: string
  terrain: 'plain' | 'coast' | 'highland' | 'river' | 'desert' | 'marsh'
}
export type SettlementDefinition = { id: string; name: string; stateId: string; position: LonLat; kind: 'city' | 'port' | 'fort' | 'village' }
export const provinceDefinitions = [
  { id: 'pontus', name: 'Pontus', mainSettlementId: 'amasia-city' }, { id: 'cappadocia', name: 'Cappadocia', mainSettlementId: 'mazaca-city' },
  { id: 'cilicia', name: 'Cilicia', mainSettlementId: 'tarsus-city' }, { id: 'phoenicia', name: 'Phoenicia', mainSettlementId: 'tyre-port' },
  { id: 'syria', name: 'Syria', mainSettlementId: 'damascus-city' }, { id: 'assyria', name: 'Assyria', mainSettlementId: 'nineveh-city' },
  { id: 'babylonia', name: 'Babylonia', mainSettlementId: 'babylon-city' }, { id: 'susiana', name: 'Susiana', mainSettlementId: 'susa-city' },
  { id: 'media', name: 'Media', mainSettlementId: 'ecbatana-city' }, { id: 'atropatene', name: 'Atropatene', mainSettlementId: 'ganzak-city' }, { id: 'armenia', name: 'Armenia', mainSettlementId: 'tushpa-city' },
]

type District = [id: string, name: string, center: LonLat, income: number, development: number, defense: number, terrain: StateDefinition['terrain']]
const districts: [provinceId: string, owner: string, states: District[]][] = [
  ['pontus', 'antigonus', [
    ['paphlagonia','Paphlagonia',[33.6,40.7],7,0,10,'highland'],
    ['amasia','Amasia',[35.83,40.65],8,1,11,'river'],
    ['comana','Comana Pontica',[36.56,40.3],7,0,10,'highland'],
    ['trapezus','Trapezus',[39.72,41.0],8,0,11,'coast'],
  ]],
  ['cappadocia', 'antigonus', [
    ['morimene','Morimene',[33.8,39.3],7,0,10,'plain'],
    ['garsauritis','Garsauritis',[34.1,38.4],7,0,10,'plain'],
    ['mazaca','Mazaca',[35.48,38.72],9,1,13,'highland'],
    ['tyanitis','Tyanitis',[34.6,37.85],8,0,12,'highland'],
    ['melitene','Melitene',[38.35,38.35],8,0,12,'river'],
  ]],
  ['cilicia','antigonus',[
    ['rough-cilicia','Rough Cilicia',[32.5,36.6],7,0,11,'highland'],
    ['tarsus','Tarsus',[34.89,36.92],10,1,12,'coast'],
    ['issus','Issus',[36.18,36.98],8,0,12,'coast'],
  ]],
  ['phoenicia','ptolemy',[
    ['arados','Arados',[35.96,34.85],9,0,10,'coast'],
    ['byblos','Byblos',[35.65,34.12],10,1,11,'coast'],
    ['tyre','Tyre',[35.24,33.27],11,1,13,'coast'],
  ]],
  ['syria','ptolemy',[
    ['aleppo','Aleppo',[37.16,36.2],8,0,11,'plain'],
    ['hamath','Hamath',[36.75,35.13],8,0,10,'river'],
    ['damascus','Damascus',[36.29,33.51],11,1,13,'plain'],
    ['palmyra','Palmyra',[38.28,34.55],7,0,9,'plain'],
  ]],
  ['assyria','antigonus',[
    ['upper-euphrates','Upper Euphrates',[40.0,36.5],7,0,9,'river'],
    ['nisibis','Nisibis',[41.21,37.06],8,0,11,'plain'],
    ['nineveh','Nineveh',[43.15,36.36],10,1,12,'river'],
    ['arbela','Arbela',[44.0,36.19],9,0,11,'highland'],
    ['assur','Assur',[43.25,35.45],8,0,10,'river'],
  ]],
  ['babylonia','babylon',[
    ['sippar','Sippar',[44.26,33.06],6,1,10,'river'],
    ['babylon','Babylon',[44.25,32.5],13,2,15,'river'],
    ['chaldaea','Chaldaea',[43.95,31.1],11,0,9,'plain'],
    ['nippur','Nippur',[45.5,32.3],6,0,10,'plain'],
    ['diyala','Diyala',[45.2,33.5],2,0,10,'river'],
    ['zagros','Zagros',[46.2,34.8],6,0,12,'highland'],
  ]],
  ['susiana','babylon',[
    ['susa','Susa',[48.25,32.19],20,1,12,'plain'],
    ['karun','Karun',[48.15,31.15],10,0,9,'river'],
    ['elymais','Elymais',[49.50,31.02],10,1,11,'highland'],
    ['mountain-entrance','Mountain Entrance',[49.95,32.65],4,0,10,'highland'],
    ['western-valley','Western Valley',[48.15,33.85],4,0,10,'highland'],
  ]],
  ['atropatene','atropatene',[
    ['atropatene','Atropatene',[46.1,37.8],7,0,11,'highland'],
    ['ganzak','Ganzak',[46.5,36.7],7,0,10,'highland'],
    ['northern-atropatene','Northern Uplands',[47.65,38.20],5,0,10,'highland'],
    ['atropatene-river-basin','River Basin',[48.45,36.75],6,0,9,'river'],
    ['atropatene-coast','Caspian Coast',[48.65,37.55],6,0,9,'coast'],
  ]],
  ['media','nicanor',[
    ['nisaea','Nisaean Plain',[47.6,34.5],7,0,9,'plain'],
    ['ecbatana','Ecbatana',[48.52,34.8],10,1,11,'highland'],
    ['rhagae','Rhagae',[51.44,35.6],9,0,10,'plain'],
    ['paraitakene','Paraitakene',[50.2,33.8],7,0,11,'highland'],
  ]],
  ['armenia','antigonus',[
    ['sophene','Sophene',[39.4,38.7],7,0,11,'highland'],
    ['acilisene','Acilisene',[39.5,39.75],7,0,10,'highland'],
    ['taron','Taron',[41.5,38.75],8,0,10,'highland'],
    ['basen','Basen',[41.7,39.9],7,0,10,'highland'],
    ['ararat','Ararat',[44.5,40.1],9,1,12,'highland'],
    ['tushpa','Tushpa',[43.38,38.5],8,0,11,'highland'],
  ]],
]
// Difficult capital districts can override the automatically computed interior pole.
const labelPositions: Record<string,LonLat> = {babylon:[44.3,32.8]}
export const stateDefinitions: StateDefinition[] = districts.flatMap(([provinceId,owner,states]) => states.map(([id,name,center,income,development,defense,terrain]) => ({ id,name,provinceId,owner:id==='zagros'?'nicanor':owner,center,income,development,defense,terrain,labelPosition:labelPositions[id],landscape:mediaStateNotes[id] ?? assyriaStateNotes[id] ?? susaStateNotes[id] ?? babyloniaStateNotes[id] })))

// Reference points identify places; district labels identify regions. Some
// districts have no named settlement in this initial content pack.
const settlementRows: [string, string, string, LonLat, SettlementDefinition['kind']][] = [
  ['gangra','Gangra','paphlagonia',[33.61,40.6],'city'],
  ['amasia-city','Amasia','amasia',[35.83,40.65],'city'],
  ['comana-city','Comana','comana',[36.56,40.3],'city'],
  ['trapezus-port','Trapezus','trapezus',[39.72,41.0],'port'],
  ['mazaca-city','Mazaca','mazaca',[35.48,38.72],'city'],
  ['tyana','Tyana','tyanitis',[34.6,37.85],'city'],
  ['melitene-city','Melitene','melitene',[38.35,38.35],'fort'],
  ['tarsus-city','Tarsus','tarsus',[34.89,36.92],'port'],
  ['issus-city','Issus','issus',[36.18,36.98],'fort'],
  // Mainland reference point for the island port of Arados.
  ['arados-port','Arados','arados',[35.96,34.85],'port'],
  ['byblos-port','Byblos','byblos',[35.65,34.12],'port'],
  ['tyre-port','Tyre','tyre',[35.24,33.27],'port'],
  ['aleppo-city','Aleppo','aleppo',[37.16,36.2],'city'],
  ['hamath-city','Hamath','hamath',[36.75,35.13],'city'],
  ['damascus-city','Damascus','damascus',[36.29,33.51],'city'],
  ['palmyra-city','Palmyra','palmyra',[38.28,34.55],'city'],
  ['nisibis-city','Nisibis','nisibis',[41.21,37.06],'city'],
  ['nineveh-city','Nineveh','nineveh',[43.15,36.36],'city'],
  ['arbela-city','Arbela','arbela',[44.0,36.19],'city'],
  ['assur-city','Assur','assur',[43.25,35.45],'city'],
  ['sippar-city','Sippar','sippar',[44.26,33.06],'city'],
  ['babylon-city','Babylon','babylon',[44.42,32.54],'city'],
  ['borsippa-city','Borsippa','babylon',[44.34,32.4],'city'],
  ['nippur-city','Nippur','nippur',[45.23,32.13],'city'],
  ['uruk-city','Uruk','nippur',[45.64,31.32],'city'],
  ['larsa-city','Larsa','nippur',[45.87,31.28],'city'],
  ['ur-city','Ur','chaldaea',[46.1,30.96],'port'],
  ['susa-city','Susa','susa',[48.25,32.19],'city'],
  ['ganzak-city','Ganzak','ganzak',[46.5,36.7],'city'],
  ['hulwan','Hulwan','zagros',[46.0,34.5],'fort'],
  ['ecbatana-city','Ecbatana','ecbatana',[48.52,34.8],'city'],
  ['rhagae-city','Rhagae','rhagae',[51.44,35.6],'city'],
  ['western-valley-village','Western Valley','western-valley',[48.15,33.85],'village'],
  ['mountain-entrance-village','Mountain Entrance','mountain-entrance',[49.95,32.65],'village'],
  ['tushpa-city','Tushpa','tushpa',[43.38,38.5],'city'],
]
export const settlementDefinitions: SettlementDefinition[] = [...settlementRows.map(([id,name,stateId,position,kind]) => ({id,name,stateId,position,kind})), ...susianaStateSettlements, ...assyriaAdditionalSettlements]

export const stateEventDefinitions = [
  {id:'susa-workshops',stateId:'susa',trigger:'develop' as const,coin:0,text:'Susa’s workshops expand beside the royal road.'},
  {id:'nippur-accounts',stateId:'nippur',trigger:'capture' as const,coin:8,text:'Nippur’s administrators open the local treasury: +8 coin.'},
]
