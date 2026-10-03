import { mapVertices, stateRings } from './stateGeometry.ts'

// Geometry is immutable campaign content. Prepare coordinates, extents and ink
// once instead of rebuilding them for every label candidate or camera frame.
const districts = Object.fromEntries(Object.entries(stateRings).map(([id, ring]) => {
  const points = ring.map(index => mapVertices[index])
  return [id, {
    points,
    shape: points.map(point => point.join(',')).join(' '),
    left: Math.min(...points.map(point => point[0])), right: Math.max(...points.map(point => point[0])),
    top: Math.min(...points.map(point => point[1])), bottom: Math.max(...points.map(point => point[1])),
  }]
}))
export const stateBounds = (id:string) => districts[id]
export const stateShape = (id: string) => districts[id].shape

const sharedEdges = new Map<string, { segment: string; states: string[] }>()
for (const [id, ring] of Object.entries(stateRings)) {
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length]
    const key = a < b ? `${a}:${b}` : `${b}:${a}`
    const edge = sharedEdges.get(key)
    if (edge) edge.states.push(id)
    else sharedEdges.set(key, { segment: `M${mapVertices[a].join(',')}L${mapVertices[b].join(',')}`, states: [id] })
  })
}

const neighbors = Object.fromEntries(Object.keys(stateRings).map(id => [id, new Set<string>()]))
for (const { states: [a, b] } of sharedEdges.values()) {
  if (!b) continue
  neighbors[a].add(b)
  neighbors[b].add(a)
}
const adjacency = Object.fromEntries(Object.keys(stateRings).map(id => [id,
  Object.keys(stateRings).filter(other => neighbors[id].has(other)),
]))
// Preserve content order and give each game its own editable adjacency array.
export const stateNeighbors = (id: string) => [...adjacency[id]]

// A province owns no independent polygon. Its outline is exactly the exterior
// of the named child states, including coastlines and campaign edges.
export function provinceBorderPath(stateIds: readonly string[]) {
  const children = new Set(stateIds)
  return [...sharedEdges.values()].filter((edge) => edge.states.filter((id) => children.has(id)).length === 1)
    .map(edge => edge.segment).join('')
}

export function pointInState(point: readonly [number, number], id: string) {
  const { points: ring, left, right, top, bottom } = districts[id]
  const [x, y] = point
  if (x < left || x > right || y < top || y > bottom) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside
  }
  return inside
}

export function territoryAt<T extends { id: string; provinceId: string }>(point: readonly [number, number], states: readonly T[]) {
  const state = states.find((s) => pointInState(point, s.id))
  return state ? { state, provinceId: state.provinceId } : null
}

export function mapBorderPaths(states: readonly { id: string; owner: string; provinceId: string }[]) {
  const byId = new Map(states.map((s) => [s.id, s]))
  const outlines = new Map(states.map((s) => [s.id, [] as string[]]))
  const frontiers: string[] = [], provinces: string[] = [], divisions: string[] = []
  for (const edge of sharedEdges.values()) {
    const segment = edge.segment
    const [first, second] = edge.states.map((id) => byId.get(id)!)
    if (second) {
      if (first.provinceId !== second.provinceId) provinces.push(segment)
      else divisions.push(segment)
    }
    if (!second || first.owner !== second.owner) {
      frontiers.push(segment)
      edge.states.forEach((id) => outlines.get(id)?.push(segment))
    }
  }
  return {
    frontiers: frontiers.join(''), provinces: provinces.join(''), divisions: divisions.join(''),
    dominions: states.map((s) => ({ id: s.id, owner: s.owner, path: outlines.get(s.id)!.join('') })),
  }
}
