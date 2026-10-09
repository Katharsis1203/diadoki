import { inMountainPass } from '../src/game/mountainTerrain.ts'
import { mountainLand } from '../src/game/mountainGeometry.ts'
import test from 'node:test'
import { ridgeBaseLine } from '../src/game/ridgeBorders.ts'
import assert from 'node:assert/strict'
import clipping from 'polygon-clipping'
import { theatreDistricts, theatreDistrictById, theatreRegions, theatreBorders, pointInTheatreState, theatreStateAt } from '../src/game/theatreGeography.ts'
import { theatreCoreRings, theatreStateRings, theatreNeighbors, theatreBoundaryGuides, theatreVertices } from '../src/game/theatreGeometry.ts'
import { theatreFootprints } from '../src/game/theatreContent.ts'
import { createInitialState, project } from '../src/game/data.ts'
import { income, victoryTarget } from '../src/game/engine.ts'
import { territoryAt } from '../src/game/geography.ts'
import { physicalLandRings, physicalLakes, linearPathRings } from '../src/game/physicalLand.ts'
import { coreRivers, coreRangeGround, distanceToSegment } from '../src/game/terrainBackbone.ts'
import { overviewRanges } from '../src/game/overviewRelief.ts'
import { babyloniaRanges } from '../src/game/babyloniaRanges.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import type { MapPoint } from '../src/game/mapProjection.ts'
import { mountainEntrancePersisSeam } from '../src/game/mountainEntranceGeography.ts'

const polygon=(ring:readonly MapPoint[]):clipping.MultiPolygon=>{
  const points=ring.map(p=>[p[0],p[1]] as [number,number])
  return [[[...points,points[0]]]]
}
const multi=(state:typeof theatreDistricts[number]):clipping.MultiPolygon=>state.polygons.map(poly=>poly.map(ring=>polygon(ring)[0][0]))
const ringArea=(ring:readonly MapPoint[])=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1]},0))/2
const area=(polys:clipping.MultiPolygon)=>polys.reduce((sum,poly)=>sum+ringArea(poly[0])-poly.slice(1).reduce((s,h)=>s+ringArea(h),0),0)

test('Mountain Entrance and Persis share a smooth, oppositely oriented valley seam',()=>{
  const core=theatreCoreRings['mountain-entrance'].flat()
  const atlasEdges=new Set(theatreStateRings['western-foothills'].flat().flatMap(r=>r.map((a,i)=>`${a}:${r[(i+1)%r.length]}`)))
  const shared=core.flatMap(r=>r.map((a,i)=>[a,r[(i+1)%r.length]]).filter(([a,b])=>atlasEdges.has(`${b}:${a}`)))
  assert.ok(shared.length>=20,'Both provinces reference the same sampled contour')
  const samples=mountainEntrancePersisSeam.map(project)
  const turns=samples.slice(1,-1).map((p,i)=>{
    const a=samples[i],b=samples[i+2],u=[p[0]-a[0],p[1]-a[1]],v=[b[0]-p[0],b[1]-p[1]]
    return Math.abs(Math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]))
  })
  assert.ok(Math.max(...turns)<.4,'The province boundary has no sharp waypoint corners')
})

test('the Alps-to-Bengal first pass has unique districts and one seat per province without changing the campaign',()=>{
  assert.equal(theatreRegions.length,57)
  assert.equal(theatreDistricts.length,181)
  assert.equal(new Set(theatreDistricts.map(s=>s.id)).size,theatreDistricts.length)
  const game=createInitialState()
  assert.equal(game.states.length,50);assert.equal(game.provinces.length,11)
  assert.equal(income(game),106);assert.equal(game.treasury,228);assert.equal(victoryTarget(game),26)
  for(const p of theatreRegions){
    assert.equal(p.districts.filter(s=>s.isCapital).length,1,p.name)
    assert.equal(p.capitalStateId,p.districts.find(s=>s.isCapital)!.id)
    assert.ok(p.districts.some(s=>pointInTheatreState(p.label,s)),`${p.name}: label outside province`)
    for(const s of p.districts){assert.equal(s.provinceId,p.id);assert.ok(!game.states.some(old=>old.id===s.id))}
  }
  for(const id of ['roma','athens','alexandria','persepolis','bactra','taxila','pataliputra','eastern-bengal'])assert.ok(theatreDistrictById.has(id))
})

test('every draft centre and label belongs to its own state, clear of the original campaign',()=>{
  const core=createInitialState().states
  for(const s of theatreDistricts){
    for(const at of [s.anchor,s.label]){
      assert.ok(pointInTheatreState(at,s),`${s.name}: misplaced centre/label`)
      assert.equal(theatreStateAt(at)?.id,s.id)
      assert.equal(territoryAt(at,core),null,`${s.name}: overlaps original state`)
    }
    assert.ok(s.path&&s.polygons.length)
    for(const ring of theatreStateRings[s.id].flat())assert.equal(new Set(ring).size,ring.length,`${s.name}: repeated mesh vertex`)
  }
})

test('new polygons cover the authored land footprint exactly, with no overlaps, ocean fill or gaps against the core',()=>{
  let land:clipping.MultiPolygon=[]
  for(const {points} of physicalLandRings)land=clipping.xor(land,polygon(points))
  for(const lake of physicalLakes)for(const ring of linearPathRings(lake.path))land=clipping.difference(land,polygon(ring))
  const footprint=clipping.union(...theatreFootprints.map(r=>polygon(r.map(project))))
  const core=clipping.union(...createInitialState().states.map(s=>polygon(s.shape.split(' ').map(p=>p.split(',').map(Number) as [number,number]))))
  const expected=clipping.difference(clipping.intersection(land,footprint),core,mountainLand.map(p=>p.map(r=>[...r,r[0]])) as clipping.MultiPolygon)
  const polygons=theatreDistricts.map(multi),union=clipping.union(...polygons)
  const difference=Math.abs(area(expected)-area(union))
  const overlap=polygons.reduce((sum,p)=>sum+area(p),0)-area(union)
  assert.ok(difference<.001,`Uncovered/extra map area: ${difference}`)
  assert.ok(Math.abs(overlap)<.001,`Overlapping states: ${overlap}`)
  assert.ok(area(clipping.intersection(core,union))<.001,'Drafts overlap the original mesh')
})

test('shared edges have opposite orientation, symmetric adjacency and matching province outlines',()=>{
  const edges=new Map<string,{id:string;a:number;b:number}[]>()
  for(const [id,polys] of Object.entries(theatreStateRings))for(const ring of polys.flat())ring.forEach((a,i)=>{
    const b=ring[(i+1)%ring.length],key=a<b?`${a}:${b}`:`${b}:${a}`
    edges.set(key,[...(edges.get(key)??[]),{id,a,b}])
  })
  for(const refs of edges.values()){
    assert.ok(refs.length<=2,'More than two districts share an edge')
    if(refs.length===2){
      assert.equal(refs[0].a,refs[1].b);assert.equal(refs[0].b,refs[1].a)
      assert.ok(theatreNeighbors[refs[0].id].includes(refs[1].id))
    }
  }
  for(const s of theatreDistricts)for(const id of s.neighbors)assert.ok(theatreDistricts.find(other=>other.id===id)!.neighbors.includes(s.id),`${s.id}/${id}: asymmetric passable adjacency`)
  for(const p of theatreRegions){
    const children=new Set(p.stateIds)
    for(const e of theatreBorders.filter(e=>e.states.some(id=>children.has(id))))
      assert.equal(p.borderPath.includes(e.path),e.states.filter(id=>children.has(id)).length===1,`${p.name}: misplaced internal/external border`)
  }
  assert.equal(new Set(Object.values({...theatreCoreRings,...theatreStateRings}).flat(3)).size,theatreVertices.length,'Only referenced vertices should be shipped')
})

test('first-pass boundaries actually share river channels and mountain bases',()=>{
  const features=new Map([...coreRivers.map(r=>[r.id,r.mapLines] as const),...coreRangeGround.flatMap(r=>[-1,1].map(side=>[`${r.id}-base-${side}`,[ridgeBaseLine(r.mapPoints,r.width,side,r.endScale)]] as const))])
  const lengths={river:0,ridge:0}
  for(const guide of theatreBoundaryGuides){
    const lines=features.get(guide.featureId)!
    const distance=(p:MapPoint)=>Math.min(...lines.flatMap(line=>line.slice(1).map((b,i)=>distanceToSegment(p,line[i],b).distance)))
    const matching=theatreBorders.filter(e=>e.states.length===2&&e.states.every(id=>guide.states.includes(id)))
    for(const e of matching){
      const [a,b]=e.path.slice(1).split('L').map(p=>p.split(',').map(Number) as [number,number])
      if(distance(a)<.001&&distance(b)<.001)lengths[guide.kind as keyof typeof lengths]+=Math.hypot(b[0]-a[0],b[1]-a[1])
    }
  }
  assert.ok(lengths.ridge>80,`Ridge-aligned border length ${lengths.ridge}`)
  assert.ok(lengths.river>40,`River-aligned border length ${lengths.river}`)
})

test('Babylon overview relief uses its authored peaks and all draft anchors follow the shared projection',()=>{
  for(const range of babyloniaRanges){
    const actual=overviewRanges.find(r=>r.id===range.id)!
    assert.equal(actual.peaks.length,range.peaks.filter(([lon,lat])=>!inMountainPass(project([lon,lat]))).length)
    for(const [lon,lat,scale] of range.peaks.filter(([lon,lat])=>!inMountainPass(project([lon,lat]))))assert.ok(actual.peaks.some(p=>p.scale===scale&&p.position.every((n,i)=>n===project([lon,lat])[i])))
  }
  for(const enabled of [false,true]){
    const projection=mapProjection(enabled)
    for(const s of theatreDistricts){
      const roundtrip=projection.inverse(projection.point(s.anchor))
      assert.ok(Math.hypot(roundtrip[0]-s.anchor[0],roundtrip[1]-s.anchor[1])<1e-8)
      assert.equal(theatreStateAt(roundtrip)?.id,s.id)
    }
  }
})
