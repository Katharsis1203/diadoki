import { mapVertices, stateRings } from './stateGeometry.ts'

export const stateShape = (id: string) => stateRings[id]
  .map((index) => mapVertices[index].join(',')).join(' ')

const borderEdges = (ring: readonly number[]) => new Set(ring.map((vertex, i) => {
  const next = ring[(i + 1) % ring.length]
  return vertex < next ? `${vertex}:${next}` : `${next}:${vertex}`
}))
const edges = Object.fromEntries(Object.entries(stateRings).map(([id, ring]) => [id, borderEdges(ring)]))
// Sharing a complete edge permits conquest; touching at a corner does not.
export const stateNeighbors = (id: string) => Object.keys(stateRings)
  .filter((other) => other !== id && [...edges[id]].some((edge) => edges[other].has(edge)))

const sharedEdges = new Map<string, { vertices: [number, number]; states: string[] }>()
for (const [id, ring] of Object.entries(stateRings)) {
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length]
    const key = a < b ? `${a}:${b}` : `${b}:${a}`
    const edge = sharedEdges.get(key)
    if (edge) edge.states.push(id)
    else sharedEdges.set(key, { vertices: [a, b], states: [id] })
  })
}

// A province owns no independent polygon. Its outline is exactly the exterior
// of the named child states, including coastlines and campaign edges.
export function provinceBorderPath(stateIds: readonly string[]) {
  const children = new Set(stateIds)
  return [...sharedEdges.values()].filter((edge) => edge.states.filter((id) => children.has(id)).length === 1)
    .map(({ vertices: [a, b] }) => `M${mapVertices[a].join(',')}L${mapVertices[b].join(',')}`).join('')
}

export function pointInState(point: readonly [number, number], id: string) {
  const ring = stateRings[id].map((i) => mapVertices[i])
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = [ring[i], ring[j]], [x, y] = point
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
    const [a, b] = edge.vertices.map((index) => mapVertices[index].join(','))
    const segment = `M${a}L${b}`
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
