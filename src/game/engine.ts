import { travelRegions, stateAnchorRegions } from './mountainGeometry.ts'
import { canTravelDirectly } from './mountainTerrain.ts'
import { createInitialState, factions, stateEvents } from './data.ts'
import type { BattlePlan, Commander, GameState, Province, TerritoryState } from './data.ts'
import { provinceBorderPath } from './geography.ts'

export { createInitialState, factions }
export const PLAYER = 'babylon'
export const COST = { develop: 25, recruit: 40, fortify: 30 }
export type CampaignAction = 'develop' | 'recruit' | 'fortify' | 'move' | 'invade'
export type Action =
  | { type: 'selectState'; id: string | null }
  | { type: 'selectCommander'; id: string }
  | { type: CampaignAction }
  | { type: 'resolve'; plan: BattlePlan }
  | { type: 'endTurn' }
  | { type: 'reset' }

export const ownerName = (id: string) => factions.find((f) => f.id === id)?.name ?? id
export const stateIncome = (p: TerritoryState) => p.income + p.buildings.market * 4
export const stateDefense = (p: TerritoryState) => p.defense + p.buildings.fort * 3
export const controlled = (s: GameState) => s.states.filter((p) => p.owner === PLAYER)
export const income = (s: GameState) => s.states.reduce((total, p) => total + (p.owner === PLAYER ? stateIncome(p) : 0), 0)
export const victoryTarget = (s: GameState) => Math.floor(s.states.length / 2) + 1
export const phase = (s: GameState) => {
  const count = controlled(s).length
  return count === 0 ? 'defeat' : count >= victoryTarget(s) ? 'victory' : s.battle ? 'battle' : 'campaign'
}
export const selectedState = (s: Pick<GameState, 'states' | 'selectedStateId'>) => s.states.find((p) => p.id === s.selectedStateId)
export const selectedProvince = (s: Pick<GameState, 'states' | 'selectedStateId' | 'provinces'>) => s.provinces.find((p) => p.id === selectedState(s)?.provinceId)
export const leader = (s: Pick<GameState, 'commanders' | 'selectedCommanderId'>) => s.commanders.find((c) => c.id === s.selectedCommanderId && c.faction === PLAYER)
export const recruit = (s: GameState) => s.recruitables.find((c) => c.homeState === s.selectedStateId)
const strength = (c: Commander) => c.attack + c.defense + c.speed + c.leadership + Math.floor(c.troops / 4)

// Marches may cross several connected friendly states for one order. The path
// uses the actual state mesh and cannot jump an enemy state or disconnected sea.
export function movementPath(s: GameState, targetId: string) {
  const commander = leader(s)
  if (!commander) return null
  const start=stateAnchorRegions[commander.locationStateId],target=stateAnchorRegions[targetId]
  if(!start||!target)return null
  const queue = [[start]], visited = new Set<string>()
  while (queue.length) {
    const path = queue.shift()!, id = path.at(-1)!
    if (visited.has(id)) continue
    visited.add(id)
    const region=travelRegions[id],state=s.states.find(p=>p.id===region.stateId)
    if(!state||state.owner!==PLAYER)continue
    if(id===target)return path.map(id=>travelRegions[id].stateId).filter((id,i,ids)=>i===0||id!==ids[i-1])
    queue.push(...region.neighbors.filter(n=>!visited.has(n)).map(n=>[...path,n]))
  }
  return null
}

export function unavailable(s: GameState, action: CampaignAction): string | null {
  const campaignPhase = phase(s)
  if (campaignPhase === 'victory' || campaignPhase === 'defeat') return 'The campaign has ended. Start a new game.'
  if (s.battle) return 'Resolve the active battle first.'
  if (s.orders < 1) return 'No orders remain. End the turn to receive three more.'
  const p = selectedState(s)
  if (!p) return 'Select a state.'
  if (action !== 'invade') {
    if (p.owner !== PLAYER) return 'Requires a controlled state.'
    if (action === 'move') {
      if (!leader(s) || leader(s)!.troops === 0) return 'Select a commander with troops.'
      if (leader(s)!.locationStateId === p.id) return 'Your commander is already here.'
      if (!movementPath(s, p.id)) return 'Requires a connected route through your states and open mountain passes.'
    } else {
      if (action === 'recruit' && !recruit(s)) return 'No local commanders are available.'
      if (s.treasury < COST[action]) return `Requires ${COST[action]} coin.`
    }
  } else {
    if (p.owner === PLAYER) return 'Select an enemy state.'
    if (!controlled(s).some((owned) => owned.neighbors.includes(p.id))) return 'Requires a border with your territory.'
    const c = leader(s)
    if (!c || c.troops === 0) return 'Select a commander with troops.'
    const origin = s.states.find((state) => state.id === c.locationStateId)
    if (!origin || origin.owner !== PLAYER || !origin.neighbors.includes(p.id)) return 'Move your commander to a friendly state bordering this target.'
    if (!canTravelDirectly(origin.id,p.id)) return 'Mountains block this border. Move your commander to an open pass or valley approach.'
  }
  return null
}
function record(s: GameState, ...entries: string[]): GameState {
  return { ...s, log: [...s.log, ...entries.map((e) => `Turn ${s.turn}: ${e}`)].slice(-100) }
}
function localEvents(s: GameState, id: string, trigger: 'capture' | 'develop') {
  const state = s.states.find((p) => p.id === id)!
  const events = stateEvents.filter((e) => e.stateId === id && e.trigger === trigger && !state.resolvedEventIds.includes(e.id))
  if (!events.length) return s
  return record({ ...s, treasury: s.treasury + events.reduce((sum, e) => sum + e.coin, 0),
    states: s.states.map((p) => p.id === id ? { ...p, resolvedEventIds: [...p.resolvedEventIds, ...events.map((e) => e.id)] } : p),
  }, ...events.map((e) => `${state.name}: ${e.text}`))
}
export function battlePreview(s: GameState, plan: Exclude<BattlePlan, 'retreat'>) {
  if (!s.battle) return null
  const player = s.battle.playerScore + (plan === 'assault' ? 12 : 8), enemy = s.battle.enemyScore
  const won = player >= enemy
  const casualties = Math.min(s.battle.playerCommander.troops, plan === 'guard' ? (won ? 2 : 4) : (won ? 6 : 10))
  const eventCoin = won ? stateEvents.filter((e) => e.trigger === 'capture' && e.stateId === s.battle!.stateId && !s.states.find((p) => p.id === e.stateId)!.resolvedEventIds.includes(e.id)).reduce((sum, e) => sum + e.coin, 0) : 0
  return { player, enemy, won, casualties, coin: (won ? 20 : plan === 'guard' ? -5 : -15) + eventCoin, eventCoin }
}
export function gameReducer(s: GameState, action: Action): GameState {
  if (action.type === 'reset') return createInitialState()
  if (action.type === 'selectState') {
    if (s.battle || s.selectedStateId === action.id || (action.id !== null && !s.states.some((p) => p.id === action.id))) return s
    return { ...s, selectedStateId: action.id }
  }
  if (action.type === 'selectCommander') {
    if (s.battle || s.selectedCommanderId === action.id || !s.commanders.some((c) => c.id === action.id && c.faction === PLAYER)) return s
    return { ...s, selectedCommanderId: action.id }
  }
  const campaignPhase = phase(s)
  if (campaignPhase === 'victory' || campaignPhase === 'defeat') return s
  if (action.type === 'resolve') {
    if (!s.battle) return s
    const b = s.battle, p = s.states.find((item) => item.id === b.stateId)!
    if (action.plan === 'retreat') return record({ ...s, battle: null }, `Retreated from ${p.name}. The invasion order remains spent; no casualties.`)
    const result = battlePreview(s, action.plan)!
    const escape = p.neighbors.find((id) => canTravelDirectly(p.id,id)&&s.states.find((state) => state.id === id)?.owner === p.owner)
    let next = record({
      ...s, battle: null, treasury: Math.max(0, s.treasury + result.coin - result.eventCoin),
      states: s.states.map((item) => item.id === p.id ? { ...item,
        owner: result.won ? PLAYER : item.owner, garrison: result.won ? Math.max(8, Math.floor(item.garrison / 2)) : item.garrison,
      } : item),
      commanders: s.commanders.map((c) => c.id === b.playerCommander.id
        ? { ...c, troops: c.troops - result.casualties, locationStateId: result.won ? p.id : c.locationStateId }
        : result.won && c.id === b.enemyCommander.id ? { ...c, locationStateId: escape ?? c.locationStateId, troops: escape ? Math.max(0, c.troops - 10) : 0 } : c),
    }, `${action.plan === 'assault' ? 'Assault' : 'Guard'} at ${p.name}: ${result.player} vs ${result.enemy}. ${result.won ? 'State captured' : 'Defenders hold'}; ${result.casualties} troops lost; ${result.coin - result.eventCoin > 0 ? '+' : ''}${result.coin - result.eventCoin} coin.`)
    if (result.won) next = localEvents(next, p.id, 'capture')
    return phase(next) === 'victory' ? record(next, `Victory! You control ${controlled(next).length} of ${next.states.length} states.`) : next
  }
  if (action.type === 'endTurn') {
    if (s.battle) return s
    const received = income(s)
    const next = { ...s, turn: s.turn + 1, orders: 3, treasury: s.treasury + received }
    return record(next, ...factions.filter((f) => f.id !== PLAYER).map((f) => `${f.name} holds position (${s.states.filter((p) => p.owner === f.id).length} states).`), `Received ${received} income and three orders.`)
  }
  if (unavailable(s, action.type)) return s
  const p = selectedState(s)!, next = { ...s, orders: s.orders - 1 }
  if (action.type === 'move') {
    const path = movementPath(s, p.id)!, c = leader(s)!
    return record({ ...next, commanders: s.commanders.map((item) => item.id === c.id ? { ...item, locationStateId: p.id } : item) },
      `${c.name} marches to ${p.name} through ${path.map((id) => s.states.find((state) => state.id === id)!.name).join(' → ')}.`)
  }
  if (action.type === 'develop') return localEvents(record({
    ...next, treasury: s.treasury - COST.develop,
    states: s.states.map((item) => item.id === p.id ? { ...item, buildings: { ...item.buildings, market: item.buildings.market + 1 } } : item),
  }, `Developed ${p.name} for 25 coin. Market level and income increase locally (+4 per turn).`), p.id, 'develop')
  if (action.type === 'fortify') return record({ ...next, treasury: s.treasury - COST.fortify,
    states: s.states.map((item) => item.id === p.id ? { ...item, buildings: { ...item.buildings, fort: item.buildings.fort + 1 } } : item),
  }, `Fortified ${p.name} for 30 coin. Local defense increases by 3.`)
  if (action.type === 'recruit') {
    const candidate = recruit(s)!
    return record({ ...next, treasury: s.treasury - COST.recruit,
      commanders: [...s.commanders, candidate], recruitables: s.recruitables.filter((c) => c.id !== candidate.id), selectedCommanderId: candidate.id,
    }, `${candidate.name} recruited in ${p.name} for 40 coin and selected to lead.`)
  }
  const playerCommander = leader(s)!
  const enemyCommander = s.commanders.find((c) => c.faction === p.owner && c.locationStateId === p.id && c.troops > 0) ?? {
    id: `${p.id}-guard`, name: `${ownerName(p.owner)} garrison`, faction: p.owner,
    specialty: 'Local garrison', attack: 10, defense: 10, speed: 9, leadership: 9, troops: p.garrison, homeState: p.id, locationStateId: p.id,
  }
  return record({ ...next, battle: { stateId: p.id, playerCommander, enemyCommander,
    playerScore: strength(playerCommander), enemyScore: strength(enemyCommander) + stateDefense(p),
  } }, `${playerCommander.name} invades ${p.name}. Choose a battle plan.`)
}
export const provinceStates = (s: GameState, p: Province) => s.states.filter((state) => state.provinceId === p.id)
export const provinceControl = (s: GameState, p: Province): string | null => {
  const owners = new Set(provinceStates(s, p).map((state) => state.owner))
  return owners.size === 1 ? [...owners][0] : null
}
export const provinceIncome = (s: GameState, p: Province) => provinceStates(s, p).reduce((total, state) => total + stateIncome(state), 0)
export function provinceSummary(s: GameState, p: Province) {
  const states = provinceStates(s, p)
  const held = states.filter(state => state.owner === PLAYER)
  const owners = new Set(states.map(state => state.owner))
  return { stateCount: states.length, owner: owners.size === 1 ? [...owners][0] : null, income: states.reduce((sum, state) => sum + stateIncome(state), 0),
    playerIncome: held.reduce((sum, state) => sum + stateIncome(state), 0),
    playerStates: held.length,
    garrison: states.reduce((sum, state) => sum + state.garrison, 0),
    settlements: states.reduce((sum, state) => sum + state.settlementIds.length, 0),
  }
}
// Dominion is a view of current ownership, including partially held provinces.
// Its membership and exterior follow states; nothing can drift out of sync.
export function dominionSummary(s: GameState, factionId: string) {
  const states = s.states.filter((state) => state.owner === factionId)
  const stateIds = states.map((state) => state.id)
  const provinceIds = [...new Set(states.map((state) => state.provinceId))]
  return { factionId, stateIds, provinceIds,
    completeProvinceIds: provinceIds.filter((id) => provinceControl(s, s.provinces.find((p) => p.id === id)!) === factionId),
    income: states.reduce((total, state) => total + stateIncome(state), 0),
    garrison: states.reduce((total, state) => total + state.garrison, 0), borderPath: provinceBorderPath(stateIds),
  }
}
export function dominionLabel(s: Pick<GameState, 'states'>, factionId: string) {
  const states = s.states.filter((p) => p.owner === factionId)
  if (!states.length) return null
  const x = states.reduce((sum, p) => sum + p.labelX, 0) / states.length, y = states.reduce((sum, p) => sum + p.labelY, 0) / states.length
  return states.reduce((best, p) => Math.hypot(p.labelX - x, p.labelY - y) < Math.hypot(best.labelX - x, best.labelY - y) ? p : best)
}
