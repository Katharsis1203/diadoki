import { provinceBorderPath, stateNeighbors, stateShape } from './geography.ts'
import { provinceLabels, stateLabels } from './stateGeometry.ts'
import { provinceDefinitions, settlementDefinitions, stateDefinitions, stateEventDefinitions } from './geographyContent.ts'

export type Faction = { id: string; name: string; color: string; seatSettlementId: string }
export type Province = {
  id: string
  name: string
  mainSettlementId: string
  stateIds: string[]
  borderPath: string
  labelX: number
  labelY: number
}
export type TerritoryState = {
  id: string
  name: string
  provinceId: string
  owner: string
  terrain: 'plain' | 'coast' | 'highland' | 'river' | 'desert' | 'marsh'
  landscape?: string
  settlementIds: string[]
  buildings: { market: number; fort: number }
  garrison: number
  resolvedEventIds: string[]
  income: number
  defense: number
  neighbors: string[]
  shape: string
  labelX: number
  labelY: number
}
export type Commander = {
  id: string
  name: string
  faction: string
  specialty: string
  attack: number
  defense: number
  speed: number
  leadership: number
  troops: number
  homeState: string
  locationStateId: string
}
export type BattlePlan = 'assault' | 'guard' | 'retreat'
export type Battle = {
  stateId: string
  playerCommander: Commander
  enemyCommander: Commander
  playerScore: number
  enemyScore: number
}
export type GameState = {
  turn: number
  treasury: number
  orders: number
  log: string[]
  provinces: Province[]
  states: TerritoryState[]
  settlements: Settlement[]
  commanders: Commander[]
  recruitables: Commander[]
  selectedStateId: string | null
  battle: Battle | null
  selectedCommanderId: string
}
export type Settlement = { id: string; name: string; stateId: string; x: number; y: number; kind: 'city' | 'port' | 'fort' }
export const project = ([lon, lat]: readonly [number, number]): [number, number] => [60 + (lon - 29) * 33, 35 + (43 - lat) * 40]
export const stateEvents = stateEventDefinitions
export const factions: Faction[] = [
  { id: 'babylon', name: 'Seleucids', color: '#94692d', seatSettlementId: 'babylon-city' },
  { id: 'ptolemy', name: 'Ptolemies', color: '#466b79', seatSettlementId: 'damascus-city' },
  { id: 'antigonus', name: 'Antigonids', color: '#8d5140', seatSettlementId: 'mazaca-city' },
]

export const createInitialState = (): GameState => ({
  turn: 1,
  treasury: 220, // 122 opening coin + 98 opening income across eleven states.
  orders: 3,
  log: [
    `You lead the Seleucids from Babylon. ${provinceDefinitions.length} provinces contain ${stateDefinitions.length} states, each with its own borders and garrison.`,
    `Turn 1: 122 opening coin + 98 income. Control ${Math.floor(stateDefinitions.length / 2) + 1} of ${stateDefinitions.length} states to win. Select a state; zoom in to see districts and cities.`,
  ],
  provinces: provinceDefinitions.map(({ id, name, mainSettlementId }) => {
    const stateIds = stateDefinitions.filter((s) => s.provinceId === id).map((s) => s.id)
    return { id, name, mainSettlementId, stateIds, borderPath: provinceBorderPath(stateIds), labelX: provinceLabels[id][0], labelY: provinceLabels[id][1] }
  }),
  states: stateDefinitions.map((s) => ({
    id: s.id, name: s.name, provinceId: s.provinceId, owner: s.owner, income: s.income, defense: s.defense, terrain: s.terrain, landscape: s.landscape, neighbors: stateNeighbors(s.id), shape: stateShape(s.id),
    labelX: stateLabels[s.id][0], labelY: stateLabels[s.id][1],
    settlementIds: settlementDefinitions.filter((place) => place.stateId === s.id).map((place) => place.id),
    buildings: { market: s.development, fort: 0 }, garrison: 26, resolvedEventIds: [],
  })),
  settlements: settlementDefinitions.map(({ position, ...place }) => {
    const [x, y] = project(position)
    return { ...place, x, y }
  }),
  commanders: [
    { id: 'ptolemy', name: 'Ptolemy', faction: 'ptolemy', specialty: 'Western strategist', attack: 16, defense: 13, speed: 11, leadership: 14, troops: 42, homeState: 'damascus', locationStateId: 'damascus' },
    { id: 'antigonus', name: 'Antigonus', faction: 'antigonus', specialty: 'Iron shield', attack: 15, defense: 16, speed: 10, leadership: 14, troops: 39, homeState: 'mazaca', locationStateId: 'mazaca' },
    { id: 'mardonius', name: 'Mardonius', faction: 'babylon', specialty: 'Satrap guard', attack: 14, defense: 12, speed: 12, leadership: 13, troops: 40, homeState: 'babylon', locationStateId: 'babylon' },
    { id: 'sarpedon', name: 'Sarpedon', faction: 'babylon', specialty: 'River general', attack: 15, defense: 11, speed: 13, leadership: 12, troops: 38, homeState: 'susa', locationStateId: 'susa' },
    { id: 'eumenes', name: 'Eumenes', faction: 'antigonus', specialty: 'Independent satrap', attack: 13, defense: 10, speed: 11, leadership: 11, troops: 33, homeState: 'ecbatana', locationStateId: 'ecbatana' },
  ],
  recruitables: [
    { id: 'nicanor', name: 'Nicanor', faction: 'babylon', specialty: 'Recruitable veteran', attack: 16, defense: 12, speed: 12, leadership: 13, troops: 28, homeState: 'babylon', locationStateId: 'babylon' },
    { id: 'cleitus', name: 'Cleitus', faction: 'babylon', specialty: 'City guard', attack: 17, defense: 14, speed: 10, leadership: 15, troops: 32, homeState: 'susa', locationStateId: 'susa' },
    { id: 'sophanes', name: 'Sophanes', faction: 'babylon', specialty: 'Logistics captain', attack: 12, defense: 11, speed: 11, leadership: 18, troops: 25, homeState: 'babylon', locationStateId: 'babylon' },
  ],
  selectedStateId: null,
  battle: null,
  selectedCommanderId: 'mardonius',
})
