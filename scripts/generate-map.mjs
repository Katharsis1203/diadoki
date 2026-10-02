import fs from 'node:fs'
import clipping from 'polygon-clipping'
import { provinceDefinitions, settlementDefinitions, stateDefinitions } from '../src/game/geographyContent.ts'
import { terrainFeatures } from '../src/game/terrainContent.ts'
import { rivers } from '../src/game/mapGeometry.ts'
import { babyloniaDistrictMasks, babyloniaEasternFrontier } from '../src/game/babyloniaGeography.ts'
import { terrainBoundaryCuts, terrainJunctions } from '../src/game/terrainBoundaries.ts'

// One coastline-clipped campaign envelope. There are no legacy province shapes.
const envelope = JSON.parse(fs.readFileSync(new URL('./campaign-outline.json', import.meta.url)))
const project = ([lon,lat]) => [60+(lon-29)*33,35+(43-lat)*40]
const close = (ring) => [...ring, ring[0]]
const polygon = (ring) => [[close(ring)]]
const area = (ring) => Math.abs(ring.reduce((sum,p,i) => { const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1] },0))/2
const main = (multi, id) => {
  const sorted = [...multi].sort((a,b)=>area(b[0])-area(a[0]))
  if (!sorted.length || sorted[0].length !== 1 || sorted.slice(1).some(p=>area(p[0])>.000001)) throw new Error(`${id}: disconnected district or hole`)
  return sorted[0][0].slice(0,-1)
}
// Nearest district centres form irregular catchments. Cities, coastlines and
// geography constraints determine their size; no horizontal/vertical slicing.
const seeds = stateDefinitions.map(s=>({ ...s, point: project(s.center) }))
const halfPlane = (ring, a, b, limit) => {
  const result=[]
  ring.forEach((p,i)=>{
    const q=ring[(i+1)%ring.length], dp=a*p[0]+b*p[1]-limit, dq=a*q[0]+b*q[1]-limit
    if(dp<=1e-8) result.push(p)
    if((dp<0)!==(dq<0)) {const t=dp/(dp-dq);result.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])])}
  })
  return result
}
const raw={}
for(const seed of seeds){
  let cell=[[-2000,-2000],[2000,-2000],[2000,2000],[-2000,2000]]
  for(const other of seeds){
    if(seed.id===other.id)continue
    const [x,y]=seed.point,[ox,oy]=other.point
    cell=halfPlane(cell,2*(ox-x),2*(oy-y),ox*ox+oy*oy-x*x-y*y)
  }
  raw[seed.id]=main(clipping.intersection(envelope,polygon(cell)),seed.id)
}
const round=(p)=>p.map(n=>+n.toFixed(6))
const allPoints=[...new Map(Object.values(raw).flat().map(p=>[round(p).join(','),round(p)])).values()]
const nodes=[],indexByPoint=new Map(),noded={}
const index=(p)=>{const key=p.join(',');if(!indexByPoint.has(key)){indexByPoint.set(key,nodes.length);nodes.push(p)}return indexByPoint.get(key)}
// Insert every junction into every adjoining ring before curving shared edges.
for(const [id,rawRing] of Object.entries(raw)){
  const ring=rawRing.map(round), result=[]
  ring.forEach((a,i)=>{
    const b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy
    allPoints.map(p=>({p,t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2}))
      .filter(({p,t})=>t>=0&&t<1-1e-8&&Math.abs(dx*(p[1]-a[1])-dy*(p[0]-a[0]))<.0001)
      .sort((a,b)=>a.t-b.t).forEach(({p})=>result.push(index(p)))
  })
  noded[id]=result
}
const edgeMap=new Map()
for(const [id,ring] of Object.entries(noded))ring.forEach((a,i)=>{
  const b=ring[(i+1)%ring.length],key=a<b?`${a}:${b}`:`${b}:${a}`
  if(!edgeMap.has(key))edgeMap.set(key,{a:Math.min(a,b),b:Math.max(a,b),states:[]})
  edgeMap.get(key).states.push(id)
})
const physicalLines=rivers.flatMap(r=>r.path.split('M').filter(Boolean).map(line=>line.split('L').map(p=>p.split(',').map(Number))))
const ridges=terrainFeatures.filter(f=>f.type==='mountain'&&f.detail==='macro').map(f=>f.points.map(project))
const segments=[...physicalLines.flatMap(line=>line.slice(1).map((p,i)=>[line[i],p,'river'])),...ridges.flatMap(line=>line.slice(1).map((p,i)=>[line[i],p,'ridge']))]
const cities=settlementDefinitions.map(s=>project(s.position))
const nearestFeature=(p,dx,dy)=>{
  let best=null,distance=16
  for(const [a,b,kind] of segments){
    // River cities need hinterlands on both banks; do not pull their districts
    // onto the water just because a convenient river segment is nearby.
    if(kind==='river' && cities.some(city=>Math.hypot(city[0]-p[0],city[1]-p[1])<22))continue
    const vx=b[0]-a[0],vy=b[1]-a[1],len=Math.hypot(vx,vy)
    if(!len||Math.abs((vx*dx+vy*dy)/len)<.65)continue
    const t=Math.max(0,Math.min(1,((p[0]-a[0])*vx+(p[1]-a[1])*vy)/(len*len)))
    const q=[a[0]+t*vx,a[1]+t*vy],d=Math.hypot(q[0]-p[0],q[1]-p[1])
    if(d<distance){distance=d;best=q}
  }
  return best
}
let states,edges
// Curves are authored once per shared edge, reused in reverse by the neighbour.
// Reduce bending if validation finds an intersection near a narrow city district.
for(const bendScale of [1,.5,.25,0]){
  edges=new Map()
  for(const [key,edge] of edgeMap){
    const a=nodes[edge.a],b=nodes[edge.b],length=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/length,dy=(b[1]-a[1])/length
    const count=edge.states.length===2?Math.max(1,Math.ceil(length/8)):1
    const points=Array.from({length:count+1},(_,i)=>{
      const t=i/count,fade=Math.sin(Math.PI*t)**2,p=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]
      if(!i||i===count)return p
      const wobble=Math.min(3.5,length*.055)*fade*Math.sin((a[0]+b[1])/28+Math.PI*t)
      p[0]-=dy*wobble*bendScale;p[1]+=dx*wobble*bendScale
      const feature=nearestFeature(p,dx,dy)
      if(feature){p[0]+=(feature[0]-p[0])*fade*.8*bendScale;p[1]+=(feature[1]-p[1])*fade*.8*bendScale}
      return round(p)
    })
    edges.set(key,points)
  }
  states=Object.fromEntries(Object.entries(noded).map(([id,ring])=>[id,ring.flatMap((a,i)=>{
    const b=ring[(i+1)%ring.length],key=a<b?`${a}:${b}`:`${b}:${a}`,curve=edges.get(key)
    return (a<b?curve:[...curve].reverse()).slice(0,-1)
  })]))
  const ids=Object.keys(states)
  let valid=true
  for(let i=0;i<ids.length&&valid;i++)for(let j=i+1;j<ids.length;j++){
    const overlap=clipping.intersection(polygon(states[ids[i]]),polygon(states[ids[j]]))
    if(overlap.some(p=>area(p[0])>.00001)){valid=false;break}
  }
  if(valid){console.log(`Validated shared boundary curvature at ${bendScale}.`);break}
  if(!bendScale)throw new Error('Invalid district partition')
}
// Replace Babylonia's eastern seam on both sides, keeping the rest of the
// campaign fixed. The lower frontier follows one bank rather than crossing it.
const babylonIds = stateDefinitions.filter(state => state.provinceId === 'babylonia').map(state => state.id)
const susianaIds = stateDefinitions.filter(state => state.provinceId === 'susiana').map(state => state.id)
const oldBabylon = clipping.union(...babylonIds.map(id => polygon(states[id])))
const oldSusiana = clipping.union(...susianaIds.map(id => polygon(states[id])))
const oldOutline = main(oldBabylon, 'old Babylonia')
const susianaOutline = main(oldSusiana, 'old Susiana')
const shared = oldOutline.map((p,i) => ({p,i})).filter(({p}) => susianaOutline.some(q => Math.hypot(p[0]-q[0],p[1]-q[1]) < .00001))
const north = shared[0], south = shared.at(-1)
const lonLat = ([x,y]) => [29+(x-60)/33,43-(y-35)/40]
const frontier = babyloniaEasternFrontier(lonLat(north.p),lonLat(south.p)).map(project)
const combined = clipping.union(oldBabylon, oldSusiana)
const babylonEnvelope = clipping.intersection(combined, polygon([...oldOutline.slice(0,north.i), ...frontier, ...oldOutline.slice(south.i+1)]))
const susianaEnvelope = clipping.difference(combined, babylonEnvelope)
// Existing Susiana interiors persist; only transferred strips are allocated
// to the nearest adjoining catchment, then noded with their new western bank.
const transferred = clipping.difference(susianaEnvelope, oldSusiana)
for (const id of susianaIds) {
  let catchment = [[-2000,-2000],[2000,-2000],[2000,2000],[-2000,2000]]
  const seed = seeds.find(s => s.id === id)
  for (const other of seeds.filter(s => s.provinceId === 'susiana' && s.id !== id)) {
    const [x,y] = seed.point, [ox,oy] = other.point
    catchment = halfPlane(catchment,2*(ox-x),2*(oy-y),ox*ox+oy*oy-x*x-y*y)
  }
  states[id] = main(clipping.union(clipping.intersection(polygon(states[id]),susianaEnvelope), clipping.intersection(transferred,polygon(catchment))),id)
}
// Babylonia's internal catchments use authored rivers and dryland margins.
let unassignedBabylonia = babylonEnvelope
for (const {stateId, outline} of babyloniaDistrictMasks) {
  const mask = polygon(outline.map(project))
  states[stateId] = main(clipping.intersection(unassignedBabylonia, mask), stateId)
  unassignedBabylonia = clipping.difference(unassignedBabylonia, mask)
}
states.nippur = main(unassignedBabylonia, 'nippur')

// Move shared junctions and replace each geographic cut once on BOTH sides.
// Keep the mesh topology, memberships and campaign exterior intact. No ridge
// icons are sampled: the authored backbone describes substantial catchments.
const pointKey = p => round(p).join(',')
for (const {states: ids, at} of terrainJunctions) {
  const common = states[ids[0]].filter(p => ids.every(id => states[id].some(q => pointKey(p) === pointKey(q))))
  if (common.length !== 1) throw new Error(`Expected one junction: ${ids.join('/')}`)
  const oldKey = pointKey(common[0]), replacement = project(at)
  for (const id of Object.keys(states)) states[id] = states[id].map(p => pointKey(p) === oldKey ? replacement : p)
}
const edgeKey = (a,b) => [pointKey(a),pointKey(b)].sort().join('/')
const sharedRun = (ring, other) => {
  const otherEdges = new Set(other.map((p,i) => edgeKey(p,other[(i+1)%other.length])))
  const shared = ring.map((p,i) => otherEdges.has(edgeKey(p,ring[(i+1)%ring.length])))
  const starts = shared.flatMap((yes,i) => yes && !shared[(i+shared.length-1)%shared.length] ? [i] : [])
  if (starts.length !== 1) throw new Error('Geographic cut must be one connected shared boundary')
  const start = starts[0]
  let count = 0
  while (shared[(start+count)%shared.length]) count++
  return {start,count,from:ring[start],to:ring[(start+count)%ring.length]}
}
for (const {states:[a,b],via,feature} of terrainBoundaryCuts) {
  const first=sharedRun(states[a],states[b]), second=sharedRun(states[b],states[a])
  if(pointKey(first.from)!==pointKey(second.to) || pointKey(first.to)!==pointKey(second.from)) {
    throw new Error(`${a}/${b}: shared boundary endpoints disagree`)
  }
  // Source cuts run north-to-south, or west-to-east for transverse margins.
  const from=first.from,to=first.to
  const distance=p=>Math.hypot(p[0]-from[0],p[1]-from[1])
  const middle=via.map(project)
  if(middle.length>1 && distance(middle[0])>distance(middle.at(-1)))middle.reverse()
  const path=[from,...middle,to].map(round)
  const replace=(ring,run,line)=>[...line.slice(0,-1),...Array.from({length:ring.length-run.count},(_,i)=>ring[(run.start+run.count+i)%ring.length])]
  states[a]=replace(states[a],first,path)
  states[b]=replace(states[b],second,[...path].reverse())
  console.log(`Authored ${a}/${b}: ${feature}.`)
}

// Insert new junctions on both sides of every seam before sharing mesh vertices.
const finalPoints = [...new Map(Object.values(states).flat().map(p => [round(p).join(','), round(p)])).values()]
for (const [id, rawRing] of Object.entries(states)) {
  const ring = rawRing.map(round)
  states[id] = ring.flatMap((a, i) => {
    const b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy
    return finalPoints.map(p => ({p, t: ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2}))
      .filter(({p,t}) => t >= 0 && t < 1-1e-8 && Math.abs(dx*(p[1]-a[1])-dy*(p[0]-a[0])) < .0001)
      .sort((a,b) => a.t-b.t).map(({p}) => p)
  })
}

// Every province is the exact union of its child states, never a separate layer
// of independent territory. Preserve the union only as validation/reference data.
const provincePolygons={}
for(const p of provinceDefinitions){
  const children=stateDefinitions.filter(s=>s.provinceId===p.id).map(s=>polygon(states[s.id]))
  provincePolygons[p.id]=main(clipping.union(...children),p.id)
}
const mesh=[],meshIndex=new Map(),rings={}
const meshNode=(p)=>{p=round(p);const key=p.join(',');if(!meshIndex.has(key)){meshIndex.set(key,mesh.length);mesh.push(p)}return meshIndex.get(key)}
for(const [id,ring] of Object.entries(states))rings[id]=ring.map(meshNode)
const inside = ([x,y], ring) => {
  let result = false
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j]
    if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) result=!result
  }
  return result
}
const clearance = (p, ring) => Math.min(...ring.map((a,i) => {
  const b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1]
  const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
}))
// Find an interior label anchor instead of placing labels in neighboring states.
const label = (ring) => {
  let best = ring[0], score = -1
  let bounds = [Math.min(...ring.map(p=>p[0])),Math.min(...ring.map(p=>p[1])),Math.max(...ring.map(p=>p[0])),Math.max(...ring.map(p=>p[1]))]
  for (const step of [8,2,.5]) {
    for (let x=bounds[0];x<=bounds[2];x+=step) for (let y=bounds[1];y<=bounds[3];y+=step) {
      if (!inside([x,y],ring)) continue
      const distance=clearance([x,y],ring)
      if(distance>score) {score=distance;best=[x,y]}
    }
    bounds=[best[0]-step,best[1]-step,best[0]+step,best[1]+step]
  }
  return round(best)
}
const labels=Object.fromEntries(Object.entries(states).map(([id,ring])=>[id,stateDefinitions.find(s=>s.id===id).labelPosition ? project(stateDefinitions.find(s=>s.id===id).labelPosition) : label(ring)]))
for(const [id,point] of Object.entries(labels))if(!inside(point,states[id]))throw new Error(`${id}: label override outside district`)
const provinceLabels=Object.fromEntries(Object.entries(provincePolygons).map(([id,ring])=>[id,label(ring)]))
for(const place of settlementDefinitions){
  if(!inside(project(place.position),states[place.stateId]))throw new Error(`${place.name} lies outside ${place.stateId}`)
}
const campaignRing=main(clipping.union(...Object.values(states).map(polygon)),'campaign')
const symmetricDifference=clipping.xor(envelope,polygon(campaignRing))
if(symmetricDifference.some(p=>area(p[0])>.001))throw new Error('Districts do not exactly cover the campaign mainland')
// Outlines reference the same mesh instead of serializing duplicate coordinates.
// Keep the public coordinate exports for rendering and geographic validation.
const provinceRings = Object.fromEntries(Object.entries(provincePolygons).map(([id, ring]) => [id, ring.map(meshNode)]))
const campaignIndices = campaignRing.map(meshNode)
const output='// Generated by npm run generate:map from geographic content and the campaign coastline.\n\n'
 +`export const mapVertices: readonly (readonly [number, number])[] = ${JSON.stringify(mesh)}\n\n`
 +`export const stateRings: Record<string, readonly number[]> = ${JSON.stringify(rings)}\n\n`
 +`export const stateLabels: Record<string, readonly [number, number]> = ${JSON.stringify(labels)}\n\n`
 +`export const provinceLabels: Record<string, readonly [number, number]> = ${JSON.stringify(provinceLabels)}\n\n`
 +`const provinceRings: Record<string, readonly number[]> = ${JSON.stringify(provinceRings)}\n\n`
 +`export const provinceOutlines: Record<string, readonly (readonly [number, number])[]> = Object.fromEntries(Object.entries(provinceRings).map(([id, ring]) => [id, ring.map(index => mapVertices[index])]))\n\n`
 +`export const campaignOutline: readonly (readonly [number, number])[] = ${JSON.stringify(campaignIndices)}.map(index => mapVertices[index])\n`
fs.writeFileSync(new URL('../src/game/stateGeometry.ts',import.meta.url),output)
console.log(`Generated ${provinceDefinitions.length} provinces, ${stateDefinitions.length} states, ${mesh.length} shared vertices; verified settlement containment and complete mainland coverage.`)
