import fs from 'node:fs'
import clipping from 'polygon-clipping'
import {coreRangeGround,backbonePeaks,distanceToSegment} from '../src/game/terrainBackbone.ts'
import {mapVertices,stateRings,stateLabels,provinceLabels} from '../src/game/stateGeometry.ts'
import {theatreVertices,theatreStateRings,theatreSettlementAnchors,theatreStateLabels,theatreProvinceLabels} from '../src/game/theatreGeometry.ts'
import {stateDefinitions,settlementDefinitions,provinceDefinitions} from '../src/game/geographyContent.ts'
import {theatreProvinces} from '../src/game/theatreContent.ts'
import {mountainPasses,mountainBasins,mountainRegions} from '../src/game/mountainPasses.ts'
import {project} from '../src/game/geographicProjection.ts'
import {susianRiverMountainMargin} from '../src/game/susaGeography.ts'
const round=p=>p.map(v=>+v.toFixed(6)),key=p=>round(p).join(',')
const close=r=>[...r,r[0]],polygon=r=>[[close(r)]]
const signed=r=>r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1]},0)/2
const ringArea=r=>Math.abs(signed(r)),area=m=>m.reduce((s,p)=>s+ringArea(p[0])-p.slice(1).reduce((a,r)=>a+ringArea(r),0),0)
const closed=m=>m.map(p=>p.map(close)),clean=m=>m.filter(p=>ringArea(p[0])>1e-5).map(p=>p.filter((r,i)=>i===0||ringArea(r)>1e-5).map(r=>r.slice(0,-1).map(round)))
const insideRing=(p,r)=>{let yes=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
const inside=(p,m)=>m.some(poly=>insideRing(p,poly[0])&&!poly.slice(1).some(r=>insideRing(p,r)))
const circle=(p,r)=>polygon(Array.from({length:16},(_,i)=>[p[0]+r*Math.cos(i*Math.PI/8),p[1]+r*Math.sin(i*Math.PI/8)]))
const sourceRanges=coreRangeGround.filter(r=>r.relief!=='hill')
const corridors=mountainPasses.map(pass=>{
  const segments=sourceRanges.flatMap(r=>r.mapPoints.slice(1).map((b,i)=>({a:r.mapPoints[i],b,width:r.width,...distanceToSegment(pass.point,r.mapPoints[i],b)})))
  const nearest=segments.sort((a,b)=>a.distance-b.distance)[0]
  const dx=nearest.b[0]-nearest.a[0],dy=nearest.b[1]-nearest.a[1],len=Math.hypot(dx,dy),normal=[-dy/len,dx/len],along=[dx/len,dy/len]
  const half=nearest.width*.6+7,p=pass.point
  const at=(n,t)=>[p[0]+normal[0]*n+along[0]*t,p[1]+normal[1]*n+along[1]*t]
  return {...pass,shape:polygon([at(-half,-3.5),at(half,-3.5),at(half,3.5),at(-half,3.5)]),points:[at(-half,0),at(half,0)].map(round)}
})
const ranges=sourceRanges.map(r=>{
  // Water and pass clearance omit the western Fars peaks beside the Karun.
  // Start the barrier at the first mountain actually drawn, not the empty
  // source axis: the omitted stump is open land shared by the two states.
  // The Qezel Owzan valley omits the first two Eastern Median symbols;
  // the northern ridge also ends before its unsampled source endpoint. Stop
  // the independent terrain at the artwork so these empty reaches stay open.
  if(r.id==='media-east'){
    const first=backbonePeaks.find(p=>p.rangeId===r.id)
    if(!first)throw new Error('Missing Eastern Median relief')
    return {...r,mapPoints:[first.position,...r.mapPoints.slice(2)]}
  }
  if(r.id==='media-north'){
    const last=backbonePeaks.filter(p=>p.rangeId===r.id).at(-1)
    if(!last)throw new Error('Missing northern Atropatene relief')
    return {...r,mapPoints:[...r.mapPoints.slice(0,-1),last.position]}
  }
  if(r.id!=='zagros-fars-north')return r
  const first=backbonePeaks.find(p=>p.rangeId===r.id&&!corridors.some(c=>distanceToSegment(p.position,c.points[0],c.points[1]).distance<5))
  if(!first)throw new Error('Missing northern Fars relief')
  return {...r,mapPoints:[first.position,...r.mapPoints.slice(1)]}
})
const passages=clipping.union(...corridors.map(p=>p.shape),...mountainBasins.map(v=>polygon(Array.from({length:24},(_,i)=>[v.point[0]+v.rx*Math.cos(i*Math.PI/12),v.point[1]+v.ry*Math.sin(i*Math.PI/12)]))))
// Area barriers are clipped to their province's authoring envelope so a new
// highland block cannot consume a neighbouring valley or relocate its centre.
const areaBarriers=mountainRegions.map(region=>{
  const province=theatreProvinces.find(p=>p.id===region.provinceId)
  const shapes=province.stateIds.map(id=>theatreStateRings[id].map(poly=>
    poly.map(r=>close(r.map(i=>theatreVertices[i])))))
  return clipping.intersection(polygon(region.outline),clipping.union(...shapes))
})
const expandedAreaBarriers=extra=>areaBarriers.flatMap(m=>[m,...(extra?m.flat().flatMap(r=>r.slice(0,-1).flatMap((a,i)=>{
  const b=r[i+1],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)
  if(length<1e-8)return []
  const nx=-dy/length*extra,ny=dx/length*extra
  return [polygon([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]]),circle(a,extra)]
})):[])])
const footprint=extra=>{
  const pieces=ranges.flatMap(r=>r.mapPoints.slice(1).flatMap((b,i)=>{
    const a=r.mapPoints[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),normal=[-dy/len,dx/len]
    const taper=j=>r.endScale?r.endScale[0]+(r.endScale[1]-r.endScale[0])*j/(r.mapPoints.length-1):1
    const ra=r.width*.4*taper(i)+extra,rb=r.width*.4*taper(i+1)+extra
    return [polygon([[a[0]+normal[0]*ra,a[1]+normal[1]*ra],[b[0]+normal[0]*rb,b[1]+normal[1]*rb],[b[0]-normal[0]*rb,b[1]-normal[1]*rb],[a[0]-normal[0]*ra,a[1]-normal[1]*ra]]),circle(a,ra),circle(b,rb)]
  }))
  return clipping.difference(clipping.union(...pieces,...expandedAreaBarriers(extra),polygon(susianRiverMountainMargin.map(project))),passages)
}
const mountain=closed(clean(footprint(0))),borderMountain=closed(clean(footprint(1.5)))
const rawCore=Object.fromEntries(Object.entries(stateRings).map(([id,r])=>[id,polygon(r.map(i=>mapVertices[i]))]))
const rawAtlas=Object.fromEntries(Object.entries(theatreStateRings).map(([id,m])=>[id,m.map(p=>p.map(r=>close(r.map(i=>theatreVertices[i]))))]))
const cut=raw=>Object.fromEntries(Object.entries(raw).map(([id,m])=>[id,clean(clipping.difference(m,mountain))]))
const core=cut(rawCore),atlas=cut(rawAtlas),all={...core,...atlas}
const anchors={},labels={},provinceLandLabels={},provinceLand={}
const nearestLand=(original,m)=>{
  if(inside(original,m))return round(original)
  for(let radius=1;radius<=60;radius++){
    const candidates=[]
    for(let i=0;i<64;i++){const theta=i*Math.PI/32,p=[original[0]+radius*Math.cos(theta),original[1]+radius*Math.sin(theta)];if(inside(p,m))candidates.push(p)}
    if(candidates.length)return round(candidates[0])
  }
  throw new Error('No land near anchor '+original)
}
for(const [id,m] of Object.entries(all)){
  if(!m.length)throw new Error(id+': mountain terrain consumes district')
  const original=rawCore[id]?project(stateDefinitions.find(s=>s.id===id).center):theatreSettlementAnchors[id]
  anchors[id]=nearestLand(original,m)
  labels[id]=nearestLand(id==='western-foothills'?anchors[id]:(rawCore[id]?stateLabels:theatreStateLabels)[id],m)
}
for(const place of settlementDefinitions)if(!inside(project(place.position),core[place.stateId]))throw new Error(place.id+': settlement in independent mountain terrain')
for(const province of [...provinceDefinitions,...theatreProvinces]){
  const ids=province.stateIds??stateDefinitions.filter(s=>s.provinceId===province.id).map(s=>s.id)
  const m=clean(clipping.union(...ids.map(id=>closed(all[id]))))
  provinceLand[province.id]=m
  provinceLandLabels[province.id]=nearestLand((provinceLabels[province.id]??theatreProvinceLabels[province.id]),m)
}
// Node passable core components separately: crossing within a split state must
// not teleport an army from one side of a mountain belt to the other.
const regions=Object.fromEntries(Object.entries(all).flatMap(([id,m])=>m.map((poly,i)=>[`${id}:${i}`,{stateId:id,poly}])))
const points=[...new Map(Object.values(regions).flatMap(r=>r.poly.flat()).map(p=>[key(p),p])).values()]
const grid=new Map(),size=20
for(const p of points){const k=`${Math.floor(p[0]/size)}:${Math.floor(p[1]/size)}`;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(p)}
const edges=new Map(),travel=Object.fromEntries(Object.entries(regions).map(([id,r])=>[id,{stateId:r.stateId,neighbors:new Set()}]))
for(const [id,r] of Object.entries(regions))for(const ring of r.poly)ring.forEach((a,i)=>{
  const b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy
  if(len2<1e-10)return
  const candidates=[]
  for(let x=Math.floor(Math.min(a[0],b[0])/size);x<=Math.floor(Math.max(a[0],b[0])/size);x++)for(let y=Math.floor(Math.min(a[1],b[1])/size);y<=Math.floor(Math.max(a[1],b[1])/size);y++)candidates.push(...grid.get(`${x}:${y}`)??[])
  const nodes=[a,...candidates.map(p=>({p,t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2})).filter(({p,t})=>t>1e-8&&t<1-1e-8&&Math.abs(dx*(p[1]-a[1])-dy*(p[0]-a[0]))/Math.sqrt(len2)<1e-5).sort((a,b)=>a.t-b.t).map(p=>p.p),b]
  for(let j=1;j<nodes.length;j++){
    const a=key(nodes[j-1]),b=key(nodes[j]);if(a===b)continue
    const k=a<b?`${a};${b}`:`${b};${a}`
    if(!edges.has(k))edges.set(k,{ids:new Set(),length:Math.hypot(nodes[j][0]-nodes[j-1][0],nodes[j][1]-nodes[j-1][1])})
    edges.get(k).ids.add(id)
  }
})
const shared=new Map()
for(const {ids,length} of edges.values())if(ids.size===2){const [a,b]=[...ids],k=a<b?`${a}|${b}`:`${b}|${a}`;shared.set(k,(shared.get(k)??0)+length)}
for(const [k,length] of shared)if(length>1){const [a,b]=k.split('|');travel[a].neighbors.add(b);travel[b].neighbors.add(a)}
const anchorRegions=Object.fromEntries(Object.keys(core).map(id=>[id,Object.entries(regions).find(([,r])=>r.stateId===id&&inside(anchors[id],[r.poly]))?.[0]]))
if(Object.values(anchorRegions).some(id=>!id))throw new Error('Missing travel anchor')
const original=clipping.union(...Object.values(rawCore)),expected=clipping.difference(original,mountain),actual=clipping.union(...Object.values(core).map(closed))
if(Math.abs(area(expected)-area(actual))>.005)throw new Error('Passable core coverage mismatch')
// The atlas inspector also uses physical land adjacency: a province on the
// other side of an excluded highland block is no longer an open neighbour.
const atlasPassableNeighbors=Object.fromEntries(Object.keys(atlas).map(id=>[id,
  [...new Set(Object.values(travel).filter(r=>r.stateId===id).flatMap(r=>[...r.neighbors]
    .map(next=>travel[next].stateId).filter(next=>next!==id&&atlas[next])))].sort()]))
const coreTravel=Object.fromEntries(Object.entries(travel).filter(([,r])=>core[r.stateId]).map(([id,r])=>
  [id,{stateId:r.stateId,neighbors:[...r.neighbors].filter(next=>core[travel[next].stateId]).sort()}]))
const output={atlasPassableNeighbors,mountainRegionLand:Object.fromEntries(mountainRegions.map((r,i)=>[r.id,clean(clipping.difference(areaBarriers[i],passages))])),mountainLand:clean(mountain),mountainBorderLand:clean(borderMountain),stateLand:core,atlasLand:atlas,provinceLand,landAnchors:anchors,landLabels:labels,provinceLandLabels,travelRegions:coreTravel,stateAnchorRegions:anchorRegions,mountainPassLines:corridors.map(({id,name,points})=>({id,name,points}))}
let source='// Generated by npm run generate:barriers. Mountains are independent land, with authored pass corridors.\n'
for(const [name,value] of Object.entries(output)){
 const type=['mountainLand','mountainBorderLand'].includes(name)?'number[][][][]':['stateLand','atlasLand','provinceLand','mountainRegionLand'].includes(name)?'Record<string,number[][][][]>':['landAnchors','landLabels','provinceLandLabels'].includes(name)?'Record<string,readonly [number,number]>':name==='travelRegions'?'Record<string,{stateId:string;neighbors:string[]}>':name==='stateAnchorRegions'?'Record<string,string>':name==='atlasPassableNeighbors'?'Record<string,string[]>':'{id:string;name:string;points:number[][]}[]'
 source+=`export const ${name}: ${type} = ${JSON.stringify(value)}\n`
}
fs.writeFileSync(new URL('../src/game/mountainGeometry.ts',import.meta.url),source)
console.log(`Independent mountains: ${ranges.length} belts, ${corridors.length} passes, ${Object.keys(coreTravel).length} core land components; ${mountainRegions.length} named area barriers.`)
