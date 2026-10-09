import { inMountainTerrain, inLandRing } from '../src/game/mountainTerrain.ts'
import { readFileSync } from 'node:fs'
import { atropateneProvinceOutline } from '../src/game/atropateneGeography.ts'
import { physicalLandRings } from '../src/game/physicalLand.ts'
import { mountainEntranceRing } from '../src/game/mountainEntranceGeography.ts'
import clipping from 'polygon-clipping'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState, gameReducer, unavailable } from '../src/game/engine.ts'
import { project } from '../src/game/data.ts'
import { diyalaTributaryBank, middleTigrisBank, upperEuphratesBank, easternFrontierRiver, nippurEuphratesBank } from '../src/game/babyloniaGeography.ts'
import { campaignOutline, mapVertices, provinceOutlines, stateRings } from '../src/game/stateGeometry.ts'
import { mapBorderPaths, pointInState, territoryAt } from '../src/game/geography.ts'
import { terrainBoundaryCuts } from '../src/game/terrainBoundaries.ts'
import { distanceToSegment } from '../src/game/riverGeometry.ts'

type Point = readonly [number, number]
const points = (id: string) => stateRings[id].map((index) => mapVertices[index])

test('authored ridge, foothill and valley cuts use identical vertices on both sides',()=>{
  for(const {states:[a,b],via,feature} of terrainBoundaryCuts.filter(c=>!c.states.some(id=>['cossaea','susa','elymais'].includes(id))&&!['zagros/ganzak','ganzak/nisaea','zagros/nisaea','diyala/zagros','diyala/nisaea'].includes(c.states.join('/'))))for(const at of via){
    const p=project(at)
    const match=(q:Point)=>Math.hypot(p[0]-q[0],p[1]-q[1])<.00001
    if(['nisaea/cossaea','elymais/paraitakene','cossaea/paraitakene','cossaea/elymais','cossaea/ecbatana'].includes(`${a}/${b}`)&&!(points(a).some(match)&&points(b).some(match)))assert.ok(['mountain-entrance','western-valley'].some(id=>inLandRing(p,points(id))||points(id).some(match)),'Former seam now belongs to one of the two approach states')
    else assert.ok((points(a).some(match)||(a==='diyala'&&points('sippar').some(match)))&&points(b).some(match),`${feature}: shared geographic anchor missing`)
  }
  const states=createInitialState().states
  for(const [at,id] of [[[46.55,34.45],'zagros'],[[46.85,34.60],'zagros'],[[47.30,33.80],'susa'],
    [[47.48,34.16],'western-valley'],[[48.50,32.38],'susa'],[[48.50,32.72],'susa']] as const)
    assert.equal(territoryAt(project(at),states)?.state.id,inMountainTerrain(project(at))?undefined:id,`Wrong ridge/foothill side at ${at}`)
})
const cross = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
const onEdge = (p: Point, a: Point, b: Point) => Math.abs(cross(a, b, p)) < .001
  && p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0])
  && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1])
const inside = (p: Point, ring: Point[]) => {
  let result = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if (onEdge(p, a, b)) return false
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result
  }
  return result
}

test('state shapes have no self-intersections, interior overlaps, or misplaced labels', () => {
  const states = createInitialState().states
  for (const state of states) {
    const ring = points(state.id)
    assert.ok(inside([state.labelX, state.labelY], ring), `${state.name}: label outside state`)
    assert.equal(new Set(stateRings[state.id]).size, ring.length, `${state.name}: repeated vertex`)
    for (const other of states) {
      const otherRing = points(other.id)
      if (other.id !== state.id) {
        assert.ok(!ring.some((p) => inside(p, otherRing)), `${state.name} overlaps ${other.name}`)
      }
      for (let i = 0; i < ring.length; i++) for (let j = 0; j < otherRing.length; j++) {
        const a = ring[i], b = ring[(i + 1) % ring.length], c = otherRing[j], d = otherRing[(j + 1) % otherRing.length]
        const crosses = cross(a, b, c) * cross(a, b, d) < -.001 && cross(c, d, a) * cross(c, d, b) < -.001
        assert.ok(!crosses, `${state.name}/${other.name}: crossing borders`)
      }
    }
  }
})

const sharedSegment = (a: string, b: string): [number, number] => {
  const ring = stateRings[a], other = stateRings[b]
  for (let i = 0; i < ring.length; i++) {
    const start = ring[i], end = ring[(i + 1) % ring.length]
    const j = other.indexOf(start)
    if (j >= 0 && (other[(j + 1) % other.length] === end || other[(j + other.length - 1) % other.length] === end)) return [start, end]
  }
  throw new Error(`${a}/${b} have no shared edge`)
}
const containsSegment = (path: string, [a, b]: [number, number]) => {
  const start = mapVertices[a].join(','), end = mapVertices[b].join(',')
  return path.includes(`M${start}L${end}`) || path.includes(`M${end}L${start}`)
}

test('friendly state divisions are distinct from opposing dominion frontiers', () => {
  const borders = mapBorderPaths(createInitialState().states)
  const friendly = sharedSegment('sippar', 'babylon'), hostile = sharedSegment('sippar', 'assur')
  assert.ok(containsSegment(borders.divisions, friendly))
  assert.ok(!containsSegment(borders.frontiers, friendly))
  assert.ok(containsSegment(borders.frontiers, hostile))
  assert.ok(!containsSegment(borders.divisions, hostile))
  for (const id of ['sippar', 'assur']) assert.ok(containsSegment(borders.dominions.find((p) => p.id === id)!.path, hostile))
})

test('conquest joins friendly holdings and draws frontiers inside divided provinces', () => {
  let state = gameReducer(createInitialState(), { type: 'selectState', id: 'sippar' })
  state = gameReducer(state, { type: 'move' })
  state = gameReducer(state, { type: 'selectState', id: 'assur' })
  const before = mapBorderPaths(state.states)
  const south = sharedSegment('sippar', 'assur'), north = sharedSegment('assur', 'nineveh')
  assert.ok(containsSegment(before.frontiers, south))
  assert.ok(containsSegment(before.divisions, north))
  state = gameReducer(state, { type: 'invade' })
  state = gameReducer(state, { type: 'resolve', plan: 'assault' })
  assert.equal(state.states.find((p) => p.id === 'assur')!.owner, 'babylon')
  const after = mapBorderPaths(state.states)
  assert.ok(containsSegment(after.provinces, south))
  assert.ok(!containsSegment(after.frontiers, south))
  assert.ok(containsSegment(after.frontiers, north))
  // The administrative state boundary persists underneath the new frontier.
  assert.ok(containsSegment(after.divisions, north))
  assert.equal(after.dominions.find((p) => p.id === 'assur')!.owner, 'babylon')
  assert.ok(!containsSegment(after.dominions.find((p) => p.id === 'assur')!.path, south))
})

test('province borders and internal state borders stay distinct under shared ownership', () => {
  const borders = mapBorderPaths(createInitialState().states)
  const provincial = sharedSegment('nippur', 'susa'), district = sharedSegment('babylon', 'nippur')
  assert.ok(containsSegment(borders.provinces, provincial))
  assert.ok(!containsSegment(borders.divisions, provincial))
  assert.ok(!containsSegment(borders.frontiers, provincial))
  assert.ok(containsSegment(borders.divisions, district))
  assert.ok(!containsSegment(borders.provinces, district))
  assert.ok(!containsSegment(borders.frontiers, district))
})

test('each province is a connected group of adjacent states, and the whole campaign is connected', () => {
  const s = createInitialState()
  for (const ids of [...s.provinces.map((p) => p.stateIds), s.states.map((p) => p.id)]) {
    const visited = new Set<string>(), queue = [ids[0]]
    while (queue.length) {
      const id = queue.pop()!
      if (visited.has(id)) continue
      visited.add(id)
      queue.push(...s.states.find((p) => p.id === id)!.neighbors.filter((neighbor) => ids.includes(neighbor) && !visited.has(neighbor)))
    }
    assert.equal(visited.size, ids.length, `Disconnected group: ${ids.join(', ')}`)
  }
})

test('a connected approach does not unlock every border of its parent province', () => {
  let s = gameReducer(createInitialState(), { type: 'selectState', id: 'rhagae' })
  assert.match(unavailable(s, 'invade')!, /border/)
  s = { ...s, states: s.states.map((p) => ['paraitakene','western-valley'].includes(p.id) ? { ...p, owner: 'babylon' } : p) }
  s = gameReducer(s, { type: 'selectState', id: 'paraitakene' })
  s = gameReducer(s, { type: 'move' })
  s = gameReducer(s, { type: 'selectState', id: 'rhagae' })
  assert.equal(unavailable(s, 'invade'), null)
  // Atropatene is in the same province but does not border Paraitakene.
  s = gameReducer(s, { type: 'selectState', id: 'atropatene' })
  assert.match(unavailable(s, 'invade')!, /border/)
})

test('the shared mesh has one closed outer boundary without cracks or holes', () => {
  const edges = new Map<string, [number, number][]>()
  for (const ring of Object.values(stateRings)) ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], key = a < b ? `${a}:${b}` : `${b}:${a}`
    edges.set(key, [...(edges.get(key) ?? []), [a, b]])
  })
  const boundary = new Map<number, number[]>()
  for (const references of edges.values()) {
    assert.ok(references.length <= 2, 'More than two states share an edge')
    if (references.length === 2) {
      assert.deepEqual(references[0], [...references[1]].reverse(), 'Shared edges must run in opposite directions')
    } else {
      const [a, b] = references[0]
      boundary.set(a, [...(boundary.get(a) ?? []), b])
      boundary.set(b, [...(boundary.get(b) ?? []), a])
    }
  }
  for (const neighbors of boundary.values()) assert.equal(neighbors.length, 2, 'A crack reaches the campaign boundary')
  const visited = new Set<number>(), queue = [[...boundary.keys()][0]]
  while (queue.length) {
    const vertex = queue.pop()!
    if (visited.has(vertex)) continue
    visited.add(vertex)
    queue.push(...boundary.get(vertex)!.filter((next) => !visited.has(next)))
  }
  assert.equal(visited.size, boundary.size, 'An internal gap creates an additional boundary loop')
})

test('province label anchors fall within one of their constituent states', () => {
  const s = createInitialState()
  for (const province of s.provinces) assert.ok(province.stateIds.some((id) => inside([province.labelX, province.labelY], points(id))), province.name)
})

const polygon = (ring: readonly Point[]): clipping.Polygon => {
  const coordinates = ring.map((p) => [p[0],p[1]] as [number,number])
  return [[...coordinates,coordinates[0]]]
}
const ringArea = (ring: readonly Point[]) => Math.abs(ring.reduce((sum,p,i) => {
  const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1]
},0))/2
const differenceArea = (a: clipping.MultiPolygon, b: clipping.MultiPolygon) => clipping.xor(a,b).reduce((sum,poly) => sum+ringArea(poly[0])-poly.slice(1).reduce((s,hole)=>s+ringArea(hole),0),0)

test('state polygons exactly cover the coastline-clipped campaign mainland', () => {
  const s=createInitialState(), polygons=s.states.map(p=>[polygon(points(p.id))])
  const union=clipping.union(...polygons)
  const source=JSON.parse(readFileSync(new URL('../scripts/campaign-outline.json',import.meta.url),'utf8')) as clipping.MultiPolygon
  let physical:clipping.MultiPolygon=[]
  for(const {points} of physicalLandRings)physical=clipping.xor(physical,[polygon(points)])
  const northernCoast=clipping.intersection([polygon(atropateneProvinceOutline.map(project))],physical)
  assert.ok(differenceArea(union,clipping.union(source,[polygon(mountainEntranceRing)],northernCoast))<.001)
  assert.ok(differenceArea(union,[polygon(campaignOutline)])<.001)
  // Validate actual state resolution across the whole campaign, not just labels.
  for(let x=130;x<830;x+=11)for(let y=60;y<610;y+=11){
    const matches=s.states.filter(p=>pointInState([x,y],p.id))
    assert.equal(matches.length,inside([x,y],[...campaignOutline])&&!inMountainTerrain([x,y])?1:0,`Coverage at ${x},${y}`)
  }
})
test('province outlines are exact child unions and exclude internal state edges', () => {
  const s=createInitialState()
  for(const p of s.provinces){
    const children=p.stateIds.map(id=>[polygon(points(id))])
    const union=clipping.union(...children)
    assert.ok(differenceArea(union,[polygon(provinceOutlines[p.id])])<.001,p.name)
    for(const id of p.stateIds){
      const state=s.states.find(s=>s.id===id)!
      for(const neighbor of state.neighbors){
        const segment=sharedSegment(id,neighbor)
        assert.equal(containsSegment(p.borderPath,segment),!p.stateIds.includes(neighbor),`${p.name}: ${id}/${neighbor}`)
      }
    }
  }
})
test('Pontus and Assyria have distinct real state geometry and resolve to their correct parents', () => {
  const s=createInitialState()
  for(const [id,provinceId] of [['amasia','pontus'],['comana','pontus'],['trapezus','pontus'],['nineveh','assyria'],['arbela','assyria'],['assur','assyria']]){
    const p=s.states.find(p=>p.id===id)!, resolved=territoryAt([p.labelX,p.labelY],s.states)!
    assert.equal(resolved.state.id,id);assert.equal(resolved.provinceId,provinceId)
    assert.ok(s.provinces.find(p=>p.id===provinceId)!.stateIds.includes(id))
    assert.equal(s.provinces.filter(p=>p.stateIds.includes(id)).length,1)
  }
})
test('every settlement is inside its own state and can identify its parent province', () => {
  const s=createInitialState()
  assert.equal(new Set(s.settlements.map(p=>p.id)).size,s.settlements.length)
  for(const place of s.settlements){
    const resolved=territoryAt([place.x,place.y],s.states)!
    assert.equal(resolved.state.id,place.stateId,place.name)
    assert.equal(resolved.provinceId,s.states.find(p=>p.id===place.stateId)!.provinceId)
  }
  assert.equal(new Set(s.provinces.map(p=>p.mainSettlementId)).size,s.provinces.length)
  for(const province of s.provinces){
    const main=s.settlements.find(p=>p.id===province.mainSettlementId)
    assert.ok(main,`${province.name}: missing main settlement`)
    assert.ok(province.stateIds.includes(main.stateId),`${province.name}: main settlement outside province`)
  }
})

test('Babylonia and Susiana share the lower Tigris as their provincial frontier', () => {
  const outline=provinceOutlines.babylonia
  const river=easternFrontierRiver.map(project)
  for(let i=1;i<river.length;i++){
    const a=river[i-1],b=river[i]
    for(const t of [0,.25,.5,.75,1]){
      const point: Point=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]
      for(const id of ['babylonia','susiana']){
        const border=provinceOutlines[id]
        assert.ok(Math.min(...border.map((a,j)=>distanceToSegment(point,a,border[(j+1)%border.length]).distance))<.00001,`${id}: frontier stays on the channel at ${point}`)
      }
    }
    for(let j=0;j<outline.length;j++){
      const c=outline[j],d=outline[(j+1)%outline.length]
      assert.ok(!(cross(a,b,c)*cross(a,b,d)<-.001&&cross(c,d,a)*cross(c,d,b)<-.001),'Provincial frontier crosses the Tigris')
    }
  }
})

test('Babylon has an urban hinterland containing Borsippa, while surrounding river cities remain separate', () => {
  const game = createInitialState()
  const babylon = game.states.find(state => state.id === 'babylon')!
  const borsippa = game.settlements.find(place => place.id === 'borsippa-city')!
  assert.equal(borsippa.stateId, babylon.id)
  assert.ok(pointInState([borsippa.x, borsippa.y], babylon.id))
  assert.ok(!game.states.some(state => state.id === 'borsippa'))
  for (const id of ['sippar', 'nippur']) {
    assert.equal(game.states.find(state => state.id === id)!.provinceId, babylon.provinceId)
    assert.equal(game.settlements.find(place => place.name.toLowerCase() === id)!.stateId, id)
  }
  const provinceStates = game.states.filter(state => state.provinceId === babylon.provinceId)
  const capitalIncome = babylon.income + babylon.buildings.market * 4
  assert.ok(provinceStates.every(state => state.income + state.buildings.market * 4 <= capitalIncome))
  assert.ok(pointInState([babylon.labelX, babylon.labelY], babylon.id))
})

test('Babylonia state borders share displayed river segments along the Tigris and lower Euphrates', () => {
  const key = (a: Point, b: Point) => [a.join(','),b.join(',')].sort().join('/')
  const riverLength = (a: string, b: string, bank: readonly Point[]) => {
    const water = bank.map(point=>project(point).map(value=>+value.toFixed(6)) as [number,number])
    const waterEdges = new Set(water.slice(1).map((p,i)=>key(water[i],p)))
    const other = points(b), edges = new Set(other.map((p,i)=>key(p,other[(i+1)%other.length])))
    const ring = points(a)
    return ring.reduce((sum,p,i)=>{
      const next=ring[(i+1)%ring.length],edge=key(p,next)
      return sum+(waterEdges.has(edge)&&edges.has(edge)?Math.hypot(next[0]-p[0],next[1]-p[1]):0)
    },0)
  }
  assert.ok(riverLength('diyala','sippar',diyalaTributaryBank)>20)
  assert.ok(riverLength('diyala','sippar',diyalaTributaryBank)+riverLength('zagros','sippar',diyalaTributaryBank)>40,'The lower tributary remains shared river frontage after Zagros takes its upper approach')
  assert.ok(riverLength('diyala','babylon',middleTigrisBank)>35)
  assert.ok(riverLength('diyala','nippur',middleTigrisBank)>10)
  assert.ok(riverLength('sippar','babylon',upperEuphratesBank)>15)
  assert.ok(riverLength('chaldaea','nippur',nippurEuphratesBank)>30)
})

test('Babylon keeps a selectable urban hinterland on both banks instead of using its river as a divider', () => {
  const center=project([44.25,32.5])
  for (const dx of [-8,0,8]) assert.ok(pointInState([center[0]+dx,center[1]],'babylon'))
  const game=createInitialState()
  assert.equal(game.states.find(state=>state.id==='chaldaea')!.terrain,'plain')
  for(const state of game.states.filter(state=>state.provinceId==='babylonia')) assert.ok(state.landscape)
})
