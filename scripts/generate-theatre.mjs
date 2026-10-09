import fs from 'node:fs'
import { roundedBorder, roundedOpenBorder } from '../src/game/borderCurves.ts'
import { ridgeBaseLine } from '../src/game/ridgeBorders.ts'
import { persisProvinceOutline, persisDistrictMasks, pasargadaePassOutline, persisCoastalCut, persisWesternCut } from '../src/game/persisGeography.ts'
import clipping from 'polygon-clipping'
import { theatreStates, theatreProvinces, theatreFootprints } from '../src/game/theatreContent.ts'
import { project } from '../src/game/data.ts'
import { mapBounds } from '../src/game/worldTerrain.ts'
import { coreRivers, coreRangeGround } from '../src/game/terrainBackbone.ts'
import { physicalLandRings, physicalLakes, linearPathRings } from '../src/game/physicalLand.ts'
import { mapVertices, stateRings } from '../src/game/stateGeometry.ts'

const round=p=>p.map(n=>+n.toFixed(6))
const key=p=>round(p).join(',')
const close=ring=>[...ring,ring[0]]
const polygon=ring=>[[close(ring)]]
const ringArea=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1]},0))/2
const area=multi=>multi.reduce((sum,poly)=>sum+ringArea(poly[0])-poly.slice(1).reduce((s,h)=>s+ringArea(h),0),0)
const clean=multi=>multi.filter(poly=>ringArea(poly[0])>1e-7).map(poly=>poly.map(ring=>ring.slice(0,-1).map(round)))
const closed=multi=>multi.map(poly=>poly.map(close))
const insideRing=(p,ring)=>{
  let inside=false
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j]
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
  }
  return inside
}
const inside=(p,multi)=>multi.some(poly=>insideRing(p,poly[0])&&!poly.slice(1).some(h=>insideRing(p,h)))
const distance=(p,a,b)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy
  const t=len2?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2)):0
  return {point:[a[0]+t*dx,a[1]+t*dy],distance:Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
}
const clearance=(p,multi)=>Math.min(...multi.flat(1).flatMap(ring=>ring.map((a,i)=>distance(p,a,ring[(i+1)%ring.length]).distance)))
// Geographic land holes (notably the Caspian) use the same even-odd fill as SVG.
let land=[]
for(const {points} of physicalLandRings)land=clipping.xor(land,polygon(points))
for(const lake of physicalLakes)for(const ring of linearPathRings(lake.path))land=clipping.difference(land,polygon(ring))
const footprint=clipping.union(...theatreFootprints.map(ring=>polygon(ring.map(project))))
const core=Object.fromEntries(Object.entries(stateRings).map(([id,ring])=>[id,polygon(ring.map(i=>mapVertices[i]))]))
const coreEnvelope=clipping.union(...Object.values(core))
const envelope=clipping.difference(clipping.intersection(land,footprint),coreEnvelope)

// Small coast simplification discrepancies can put an authored port just in
// water. Move its visual anchor only to the nearest land interior, never across
// the original campaign or to an unrelated province. Fail on a distant centre.
const seeds=theatreStates.map(state=>{
  const original=project(state.center)
  if(inside(original,coreEnvelope))throw new Error(`${state.id}: overlaps an existing state centre`)
  let point=original
  if(!inside(point,envelope)){
    const candidates=[]
    for(let dx=-12;dx<=12;dx+=.5)for(let dy=-12;dy<=12;dy+=.5){
      const at=[original[0]+dx,original[1]+dy]
      if(inside(at,envelope)&&clearance(at,envelope)>.35)candidates.push(at)
    }
    point=candidates.sort((a,b)=>Math.hypot(a[0]-original[0],a[1]-original[1])-Math.hypot(b[0]-original[0],b[1]-original[1]))[0]
    if(!point)throw new Error(`${state.id}: centre outside the theatre land`)
    console.log(`Coast anchor ${state.id}: ${Math.hypot(point[0]-original[0],point[1]-original[1]).toFixed(2)} map units inward.`)
  }
  // Keep the original catchment seeds until the authored Persis partition is
  // applied, so moving a settlement cannot reshape neighbouring provinces.
  const persisSeed=state.id==='western-foothills'?[53.8,32.1]:state.id==='pasargadae'?[53.85,30.90]:null
  return {...state,point:persisSeed?project(persisSeed):round(point)}
})
const box=[[mapBounds.left,mapBounds.top],[mapBounds.right,mapBounds.top],[mapBounds.right,mapBounds.bottom],[mapBounds.left,mapBounds.bottom]]
const halfPlane=(ring,a,b,limit)=>{
  const result=[]
  ring.forEach((p,i)=>{
    const q=ring[(i+1)%ring.length],dp=a*p[0]+b*p[1]-limit,dq=a*q[0]+b*q[1]-limit
    if(dp<=1e-8)result.push(p)
    if((dp<0)!==(dq<0)){const t=dp/(dp-dq);result.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])])}
  })
  return result
}
const raw=Object.fromEntries(seeds.map(seed=>{
  let cell=box
  for(const other of seeds){
    if(other.id===seed.id)continue
    const [x,y]=seed.point,[ox,oy]=other.point
    cell=halfPlane(cell,2*(ox-x),2*(oy-y),ox*ox+oy*oy-x*x-y*y)
  }
  return [seed.id,cell.map(round)]
}))
const nodes=[...new Map(Object.values(raw).flat().map(p=>[key(p),p])).values()]
const nodeIds=new Map(nodes.map((p,i)=>[key(p),i]))
const rings=Object.fromEntries(Object.entries(raw).map(([id,ring])=>[id,ring.flatMap((a,i)=>{
  const b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy
  if(len2<1e-12)return []
  return nodes.map(p=>({p,t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2}))
    .filter(({p,t})=>t>=-1e-9&&t<1-1e-8&&Math.abs(dx*(p[1]-a[1])-dy*(p[0]-a[0]))/Math.sqrt(len2)<1e-5)
    .sort((a,b)=>a.t-b.t).map(({p})=>nodeIds.get(key(p)))
})]))
const edges=new Map()
for(const [id,ring] of Object.entries(rings))ring.forEach((a,i)=>{
  const b=ring[(i+1)%ring.length],k=a<b?`${a}:${b}`:`${b}:${a}`
  if(!edges.has(k))edges.set(k,{a:Math.min(a,b),b:Math.max(a,b),states:[]})
  edges.get(k).states.push(id)
})
const byId=new Map(seeds.map(s=>[s.id,s]))
// Guide boundaries with the geographic axes, never individual mountain icons.
const features=[...coreRivers.flatMap(r=>r.mapLines.map(points=>({id:r.id,kind:'river',points}))),
  ...coreRangeGround.flatMap(r=>[-1,1].map(side=>({id:`${r.id}-base-${side}`,kind:'ridge',points:ridgeBaseLine(r.mapPoints,r.width,side,r.endScale)})))]
  .map(f=>({...f,segments:f.points.slice(1).map((b,i)=>[f.points[i],b])}))
const nearest=(p,feature)=>feature.segments.map(([a,b])=>distance(p,a,b)).sort((a,b)=>a.distance-b.distance)[0]
const guide=(a,b,edge)=>{
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/len,dy=(b[1]-a[1])/len
  const provincial=byId.get(edge.states[0]).provinceId!==byId.get(edge.states[1]).provinceId
  let best=null,score=provincial?26:17
  for(const feature of features){
    const sample=[.25,.5,.75].map(t=>[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])
    const matched=sample.map(p=>nearest(p,feature))
    const candidate=matched.reduce((sum,p)=>sum+p.distance,0)/3
    const [first,last]=[matched[0].point,matched[2].point]
    const direction=Math.hypot(last[0]-first[0],last[1]-first[1])
    if(!direction||Math.abs(((last[0]-first[0])*dx+(last[1]-first[1])*dy)/direction)<.72)continue
    if(candidate<score){score=candidate;best=feature}
  }
  return best
}
let districts,guides=[]
for(const strength of [1,.5,.25,0]){
  const curves=new Map(),matches=[]
  for(const [k,edge] of edges){
    const a=nodes[edge.a],b=nodes[edge.b],length=Math.hypot(b[0]-a[0],b[1]-a[1])
    const feature=edge.states.length===2?guide(a,b,edge):null
    const count=feature?Math.max(2,Math.ceil(length/5)):1
    let matchedLength=0
    const points=Array.from({length:count+1},(_,i)=>{
      const t=i/count,p=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]
      if(feature&&i&&i<count){
        // Intersect the feature with the normal through this sample. Tangential
        // movement would let neighbouring samples fold back over each other.
        const vx=(b[0]-a[0])/length,vy=(b[1]-a[1])/length
        const crossings=feature.segments.flatMap(([start,end])=>{
          const sx=end[0]-start[0],sy=end[1]-start[1],den=sx*vx+sy*vy
          if(Math.abs(den)<1e-8)return []
          const u=((p[0]-start[0])*vx+(p[1]-start[1])*vy)/den
          if(u<0||u>1)return []
          const point=[start[0]+u*sx,start[1]+u*sy]
          return [{point,distance:Math.hypot(point[0]-p[0],point[1]-p[1])}]
        }).sort((a,b)=>a.distance-b.distance)
        const q=crossings[0]
        if(!q)return round(p)
        const room=Math.min(...[...edges.entries()].filter(([other])=>other!==k).map(([,e])=>distance(p,nodes[e.a],nodes[e.b]).distance))*.35
        const fade=Math.min(1,Math.sin(Math.PI*t)**2*2,room/Math.max(q.distance,1e-8))*strength
        // Keep city hinterlands open, including both banks around river seats.
        const nearCentre=seeds.some(s=>Math.hypot(s.point[0]-q.point[0],s.point[1]-q.point[1])<10)
        if(q.distance<30&&!nearCentre){p[0]+=(q.point[0]-p[0])*fade;p[1]+=(q.point[1]-p[1])*fade;if(fade===1)matchedLength+=length/count}
      }
      return round(p)
    })
    curves.set(k,points)
    if(matchedLength>4)matches.push({states:edge.states,featureId:feature.id,kind:feature.kind,length:+matchedLength.toFixed(2)})
  }
  const cells=Object.fromEntries(Object.entries(rings).map(([id,ring])=>[id,ring.flatMap((a,i)=>{
    const b=ring[(i+1)%ring.length],k=a<b?`${a}:${b}`:`${b}:${a}`,curve=curves.get(k)
    return (a<b?curve:[...curve].reverse()).slice(0,-1)
  })]))
  const candidate=Object.fromEntries(Object.entries(cells).map(([id,ring])=>[id,clipping.intersection(envelope,polygon(ring))]))
  const polys=Object.values(candidate),union=clipping.union(...polys)
  const discrepancy=area(clipping.xor(union,envelope)),overlap=polys.reduce((sum,p)=>sum+area(p),0)-area(union)
  if(discrepancy<.001&&overlap<.001&&seeds.every(s=>inside(s.point,candidate[s.id]))){
    districts=Object.fromEntries(Object.entries(candidate).map(([id,multi])=>[id,clean(multi)]));guides=matches
    console.log(`Shared terrain curves validated at ${strength}; ${matches.length} ridge/river guides.`)
    break
  }
  console.log(`Curve ${strength}: gaps ${discrepancy}, overlap ${overlap}, misplaced centres ${seeds.filter(s=>!inside(s.point,candidate[s.id])).map(s=>s.id)}`)
  if(!strength)throw new Error(`Partition mismatch: gaps ${discrepancy}, overlap ${overlap}`)
}

// Sea straits and the fixed core can split a catchment. Transfer a detached
// mainland piece to an adjoining district's centre-containing polygon instead
// of giving (for example) Sinai a disconnected strip on Egypt's Red Sea shore.
// Offshore islands may form intentional coastal/archipelago districts.
let transfers=0
for(let pass=0;pass<seeds.length;pass++){
  let changed=false
  for(const seed of seeds){
    const multi=districts[seed.id]
    const primary=multi.find(poly=>inside(seed.point,[poly]))
    for(const component of [...multi]){
      if(component===primary||ringArea(component[0])<20)continue
      const candidates=seeds.filter(s=>s.id!==seed.id).flatMap(other=>{
        const main=districts[other.id].find(poly=>inside(other.point,[poly]))
        const union=clipping.union(closed([component]),closed([main]))
        if(union.length!==1)return []
        return [{other,main,union,score:Math.min(...component[0].map(p=>Math.hypot(p[0]-other.point[0],p[1]-other.point[1])))}]
      }).sort((a,b)=>a.score-b.score)
      const target=candidates[0]
      if(!target)continue
      districts[seed.id]=districts[seed.id].filter(poly=>poly!==component)
      districts[target.other.id]=[...districts[target.other.id].filter(poly=>poly!==target.main),...clean(target.union)]
      changed=true;transfers++
    }
  }
  if(!changed)break
}
console.log(`Joined ${transfers} detached mainland pieces to adjoining districts.`)

// Repartition the Persis basin on the shared mesh. Retained neighbours keep
// their existing land; transferred strips are assigned to adjoining catchments.
// Relocate the replacement seat only after the unchanged initial catchments are built.
byId.get('western-foothills').point=project(byId.get('western-foothills').center)
byId.get('pasargadae').point=project(byId.get('pasargadae').center)
const beforePersis=clipping.union(...Object.values(districts).map(closed))
const persisIds=theatreProvinces.find(p=>p.id==='persis').stateIds
const adjoining=['hecatompylos','hyrcanian-foothills','karmana','carmanian-uplands']
const oldPersis=clipping.union(...persisIds.map(id=>closed(districts[id])))
const pool=clipping.union(oldPersis,...adjoining.map(id=>closed(districts[id])))
const pass=clipping.intersection(pool,polygon(roundedBorder(pasargadaePassOutline.map(project))))
const basin=clipping.union(clipping.intersection(pool,polygon(roundedBorder(persisProvinceOutline.map(project)))),pass)
const removed=clipping.difference(oldPersis,basin)
for(const id of adjoining){
  let catchment=box
  const seed=byId.get(id)
  for(const other of adjoining.map(id=>byId.get(id))){
    if(other.id===id)continue
    const [x,y]=seed.point,[ox,oy]=other.point
    catchment=halfPlane(catchment,2*(ox-x),2*(oy-y),ox*ox+oy*oy-x*x-y*y)
  }
  districts[id]=clean(clipping.union(clipping.difference(closed(districts[id]),basin),clipping.intersection(removed,polygon(catchment))))
}
let remaining=basin
for(const {stateId,outline} of persisDistrictMasks){
  const mask=polygon(roundedBorder(outline.map(project)))
  const district=clipping.intersection(remaining,stateId==='pasargadae'?clipping.union(mask,pass):mask)
  districts[stateId]=clean(district)
  remaining=clipping.difference(remaining,district)
}
for(const [stateId,cut,closure] of [
  ['persian-coast',persisCoastalCut,[[58,25],[48,25]]],
  ['western-persis',persisWesternCut,[[48,25]]],
]){
  const mask=polygon([...roundedOpenBorder(cut.map(project)),...closure.map(project)])
  const district=clipping.intersection(remaining,mask)
  districts[stateId]=clean(district)
  remaining=clipping.difference(remaining,district)
}
// Tiny enclosed shoulders beside the capital must not become disconnected
// southern pieces of the plateau. Join each to an adjacent bounded district.
const plateauParts=remaining.sort((a,b)=>ringArea(b[0])-ringArea(a[0]))
for(const fragment of plateauParts.slice(1)){
  if(ringArea(fragment[0])>1000)throw new Error('Disconnected plateau hinterland')
  const centre=fragment[0].reduce((p,q)=>[p[0]+q[0]/fragment[0].length,p[1]+q[1]/fragment[0].length],[0,0])
  const candidates=persisIds.filter(id=>id!=='western-foothills').sort((a,b)=>Math.hypot(...byId.get(a).point.map((v,i)=>v-centre[i]))-Math.hypot(...byId.get(b).point.map((v,i)=>v-centre[i])))
  // A southern shoulder belongs with the coastal hinterland, preserving the
  // capital's rounded contour instead of attaching a squared corner to it.
  if(centre[1]>project([54,29.5])[1])candidates.unshift(...candidates.splice(candidates.indexOf('persian-coast'),1))
  const neighbour=candidates.find(id=>clipping.union(closed(districts[id]),[fragment]).filter(p=>ringArea(p[0])>20).length===1)
  if(!neighbour)throw new Error('Plateau shoulder has no connected neighbour')
  districts[neighbour]=clean(clipping.union(closed(districts[neighbour]),[fragment]))
}
districts['western-foothills']=clean(plateauParts.slice(0,1))
const afterPersis=clipping.union(...Object.values(districts).map(closed))
if(area(clipping.xor(beforePersis,afterPersis))>1e-4)throw new Error('Persis partition changed the atlas footprint')
if(Object.values(districts).reduce((sum,p)=>sum+area(p),0)-area(afterPersis)>1e-4)throw new Error('Persis partition overlaps')
for(const seed of seeds)if(!inside(seed.point,districts[seed.id]))throw new Error(`${seed.id}: authored border excludes its centre`)
console.log('Applied Persis foothill entry, elongated corridor and irregular royal plain.')

// Node all coast/campaign junctions, including virtual copies of the unchanged
// core polygons, so adjoining states reference precisely the same edge chain.
const meshes={...Object.fromEntries(Object.entries(core).map(([id,multi])=>[id,clean(multi)])),...districts}
const allPoints=[...new Map(Object.values(meshes).flat(3).map(p=>[key(p),p])).values()]
const grid=new Map(),cellSize=24
for(const p of allPoints){const k=`${Math.floor(p[0]/cellSize)}:${Math.floor(p[1]/cellSize)}`;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(p)}
const vertices=[],indices=new Map()
const index=p=>{const k=key(p);if(!indices.has(k)){indices.set(k,vertices.length);vertices.push(round(p))}return indices.get(k)}
const indexed={}
for(const [id,multi] of Object.entries(meshes))indexed[id]=multi.map(poly=>poly.map(ring=>ring.flatMap((a,i)=>{
  const b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy,candidates=[]
  for(let x=Math.floor(Math.min(a[0],b[0])/cellSize);x<=Math.floor(Math.max(a[0],b[0])/cellSize);x++)
    for(let y=Math.floor(Math.min(a[1],b[1])/cellSize);y<=Math.floor(Math.max(a[1],b[1])/cellSize);y++)candidates.push(...(grid.get(`${x}:${y}`)??[]))
  return [index(a),...candidates.map(p=>({p,t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2}))
    .filter(({p,t})=>t>1e-8&&t<1-1e-8&&key(p)!==key(a)&&key(p)!==key(b)&&Math.abs(dx*(p[1]-a[1])-dy*(p[0]-a[0]))<1e-5)
    .sort((a,b)=>a.t-b.t).map(({p})=>index(p))]
})))
// Rounding the two source coast resolutions can leave an out-and-back spur in
// a microscopic coastal wedge. Remove zero-area backtracking, never territory.
for(const [id,multi] of Object.entries(indexed))indexed[id]=multi.map(poly=>poly.map(ring=>{
  const result=[]
  for(const vertex of ring){
    const previous=result.indexOf(vertex)
    if(previous<0)result.push(vertex)
    else {
      const loop=result.slice(previous).map(i=>vertices[i])
      if(ringArea(loop)>1e-6)throw new Error(`${id}: nonzero-area self-touch in mesh`)
      result.splice(previous+1)
    }
  }
  return result
})).filter(poly=>poly[0].length>=3&&ringArea(poly[0].map(i=>vertices[i]))>1e-7).map(poly=>poly.filter(ring=>ring.length>=3))
const meshEdges=new Map()
for(const [id,multi] of Object.entries(indexed))for(const ring of multi.flat(1))ring.forEach((a,i)=>{
  const b=ring[(i+1)%ring.length],k=a<b?`${a}:${b}`:`${b}:${a}`
  if(!meshEdges.has(k))meshEdges.set(k,[])
  meshEdges.get(k).push(id)
})
const neighbors=Object.fromEntries(Object.keys(meshes).map(id=>[id,new Set()]))
for(const ids of meshEdges.values()){
  if(ids.length>2)throw new Error(`More than two states share an edge: ${ids}`)
  if(ids.length===2&&ids[0]!==ids[1]){neighbors[ids[0]].add(ids[1]);neighbors[ids[1]].add(ids[0])}
}
const pole=multi=>{
  const poly=[...multi].sort((a,b)=>ringArea(b[0])-ringArea(a[0]))[0]
  const points=poly[0],xs=points.map(p=>p[0]),ys=points.map(p=>p[1])
  let best=null,bestDistance=-1
  let left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys)
  for(const step of [8,2,.5]){
    for(let x=left;x<=right;x+=step)for(let y=top;y<=bottom;y+=step){
      const p=[x,y]
      if(!inside(p,[poly]))continue
      const d=clearance(p,[poly]);if(d>bestDistance){best=p;bestDistance=d}
    }
    if(!best)continue
    left=best[0]-step;right=best[0]+step;top=best[1]-step;bottom=best[1]+step
  }
  if(!best)throw new Error('No interior label position')
  return round(best)
}
const provincePolygons=Object.fromEntries(theatreProvinces.map(p=>[p.id,clean(clipping.union(...p.stateIds.map(id=>closed(districts[id]))))]))
const labels=Object.fromEntries(seeds.map(s=>[s.id,pole(districts[s.id])]))
const provinceLabels=Object.fromEntries(theatreProvinces.map(p=>[p.id,pole(provincePolygons[p.id])]))
// Include noded core rings for a unified political frontier. This subdivides
// existing edges at shared seam vertices without changing any territory.
const used=[...new Set(Object.values(indexed).flat(3))].sort((a,b)=>a-b)
const remap=new Map(used.map((id,i)=>[id,i]))
// Keep provenance only for terrain-aligned sections surviving land clipping
// and mainland transfers, and record their actual final shared-edge length.
const finalGuides=guides.flatMap(g=>{
  const sources=features.filter(f=>f.id===g.featureId)
  const near=p=>Math.min(...sources.map(f=>nearest(p,f).distance))
  let length=0
  for(const [key,ids] of meshEdges){
    if(ids.length!==2||!ids.every(id=>g.states.includes(id)))continue
    const [a,b]=key.split(':').map(i=>vertices[+i])
    if(near(a)<.001&&near(b)<.001)length+=Math.hypot(b[0]-a[0],b[1]-a[1])
  }
  return length>4?[{...g,length:+length.toFixed(2)}]:[]
})
const output={theatreVertices:used.map(i=>vertices[i]),theatreStateRings:Object.fromEntries(theatreStates.map(s=>[s.id,indexed[s.id].map(poly=>poly.map(ring=>ring.map(i=>remap.get(i))))])),
  theatreCoreRings:Object.fromEntries(Object.keys(core).map(id=>[id,indexed[id].map(poly=>poly.map(ring=>ring.map(i=>remap.get(i))))])),
  theatreStateLabels:labels,theatreProvinceLabels:provinceLabels,theatreSettlementAnchors:Object.fromEntries(seeds.map(s=>[s.id,s.point])),
  theatreNeighbors:Object.fromEntries(Object.entries(neighbors).map(([id,ids])=>[id,[...ids].sort()])),
  theatreBoundaryGuides:finalGuides}
let text='// Generated by scripts/generate-theatre.mjs. Edit theatreContent.ts and terrain axes, then regenerate.\n'
for(const [name,value] of Object.entries(output)){
  const type=name==='theatreVertices'?'readonly (readonly [number,number])[]':(name==='theatreStateRings'||name==='theatreCoreRings')?'Record<string, number[][][]>':
    name==='theatreNeighbors'?'Record<string,string[]>':name==='theatreBoundaryGuides'?'{states:string[];featureId:string;kind:string;length:number}[]':'Record<string,readonly [number,number]>'
  text+=`export const ${name}: ${type} = ${JSON.stringify(value)}\n`
}
fs.writeFileSync(new URL('../src/game/theatreGeometry.ts',import.meta.url),text)
console.log(`Generated ${theatreStates.length} states / ${theatreProvinces.length} provinces; ${used.length} referenced vertices, ${finalGuides.length} surviving terrain guides. Core states share the same noded seams.`)
