import { inMountainTerrain } from '../src/game/mountainTerrain.ts'
import test from 'node:test'
import clipping from 'polygon-clipping'
import { atlasLand, stateLand, mountainRegionLand } from '../src/game/mountainGeometry.ts'
import assert from 'node:assert/strict'
import { createInitialState, project } from '../src/game/data.ts'
import { persisCentres, persisProvinceOutline, persisDistrictMasks, persisNorthernRidges } from '../src/game/persisGeography.ts'
import { persisScenery, inPersisValley } from '../src/game/persisScenery.ts'
import { persisTerrainFeatures, persisWaterways, persisHighlandFeatures } from '../src/game/persisTerrain.ts'
import { theatreDistrictById, pointInTheatreState, theatreBorders } from '../src/game/theatreGeography.ts'
import { theatreStateRings } from '../src/game/theatreGeometry.ts'
import { sceneryObjects } from '../src/game/babyloniaScenery.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { prepareMapScene } from '../src/game/mapScene.ts'
import { theatreCentreLabel } from '../src/game/theatreScene.ts'
import { backbonePeaks } from '../src/game/terrainBackbone.ts'
import { coreGroundBrushes, terrainGroundBrushes } from '../src/game/groundBrushes.ts'
import { DEFAULT_MAP_SETTINGS } from '../src/game/mapSettings.ts'
import { visibleLabels } from '../src/game/mapView.ts'

const ids=persisCentres.map(p=>p.stateId),projection=mapProjection(true)
test('Persis has one atlas centre per district and a distinct provincial capital',()=>{
  const centres=persisScenery.filter(p=>p.asset==='settlement')
  assert.deepEqual(centres.map(p=>p.stateId),ids)
  assert.deepEqual(centres.filter(p=>p.isCapital).map(p=>p.stateId),['persepolis'])
  for(const p of centres){
    const state=theatreDistrictById.get(p.stateId)!
    assert.equal(p.name,state.name)
    assert.equal(p.scope,'theatre')
    assert.deepEqual(p.position,state.anchor)
    assert.ok(pointInTheatreState(p.position,state))
    assert.equal(p.tier,p.isCapital?'city':['pasargadae','persian-coast'].includes(p.stateId)?'village':'homestead')
  }
  assert.equal(centres[0].style,'persian')
  assert.equal(centres[1].style,'pasargadan')
})

test('Persis highlights remain sparse and inside their own district',()=>{
  for(const f of [...persisTerrainFeatures,...persisWaterways]){
    assert.ok(f.width<=(f.type==='fertile'?20:14)&&f.opacity<=(f.type==='fertile'?.60:.45))
    assert.ok(ids.includes(f.stateId as typeof ids[number]))
    for(const at of f.points)assert.ok(pointInTheatreState(project(at),theatreDistrictById.get(f.stateId!)!),`${f.id}: ${at}`)
  }
  assert.ok(persisTerrainFeatures.every(f=>f.marks?.length===0))
  for(const p of persisScenery)if(p.asset!=='settlement'){
    assert.ok(p.scale<=(p.asset==='rocks'?.34:p.asset==='scrub'?.28:.24))
    assert.ok(ids.some(id=>pointInTheatreState(p.position,theatreDistrictById.get(id)!))||(p.asset==='rocks'&&inMountainTerrain(p.position)),p.id)
  }
})

test('Persepolis has an irregular city-centred hinterland with a separate Pasargadae corridor',()=>{
  const capital=theatreDistrictById.get('persepolis')!,pasargadae=theatreDistrictById.get('pasargadae')!
  const width=capital.bounds.right-capital.bounds.left,height=capital.bounds.bottom-capital.bounds.top
  assert.ok(width>65&&width<85&&height>65&&height<90,'Capital must fit its local plain rather than reach Carmania')
  assert.ok(Math.abs(capital.anchor[0]-(capital.bounds.left+capital.bounds.right)/2)<width*.25)
  assert.ok(Math.abs(capital.anchor[1]-(capital.bounds.top+capital.bounds.bottom)/2)<height*.25)
  assert.ok(Math.hypot(pasargadae.anchor[0]-capital.anchor[0],pasargadae.anchor[1]-capital.anchor[1])>45,'Separate royal centres leave room for a rounded capital')
  assert.ok(!pointInTheatreState(pasargadae.anchor,capital))
  assert.ok(pointInTheatreState(pasargadae.anchor,pasargadae))
  assert.ok(!pointInTheatreState(theatreDistrictById.get('carmanian-uplands')!.anchor,capital),'Enlarged capital stays on the Persis side of the ridge')
  assert.ok(persisDistrictMasks.length===2&&persisProvinceOutline.length>12)
  for(const at of [[53.2,33.7],[55.8,32.3]] as const)
    assert.ok(ids.every(id=>!pointInTheatreState(project(at),theatreDistrictById.get(id)!)),'Persis stays below the northern and eastern mountain belts')
  const refs=new Map<number,Set<string>>()
  for(const [id,polys] of Object.entries(theatreStateRings))for(const vertex of polys.flat(2)){
    if(!refs.has(vertex))refs.set(vertex,new Set())
    refs.get(vertex)!.add(id)
  }
  for(const vertex of theatreStateRings.persepolis[0][0])assert.ok(refs.get(vertex)!.size>=2,'Capital boundary must be shared')
  assert.ok(theatreStateRings.persepolis[0][0].length>=50,'Rounded capital perimeter')
})

test('Pasargadae crosses the northern Carmanian ridge while the uplands remain Carmanian',()=>{
  const state=theatreDistrictById.get('pasargadae')!,uplands=theatreDistrictById.get('carmanian-uplands')!
  assert.equal(state.provinceId,'persis')
  assert.equal(uplands.provinceId,'carmania')
  for(const at of [[53.85,30.90],[56.65,31.0]] as const)assert.ok(pointInTheatreState(project(at),state),'Both sides of the ridge belong to the same connected state')
  assert.ok(pointInTheatreState(uplands.anchor,uplands))
  const [a,b]=[[55.9,31.45],[56.4,30.9]].map(at=>project(at as [number,number]))
  const side=(at:readonly [number,number])=>{const p=project(at);return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])}
  assert.ok(side([53.85,30.90])*side([56.65,31.0])<0,'Pass reaches across the geographic ridge axis')
  const art=sceneryObjects(projection,4,4,'state',createInitialState().states)
  assert.ok(!art.some(o=>o.placement.id==='kerman-north-peak-2'),'The crossing has an opening in the upright relief')
  assert.ok(['kerman-north-peak-0','kerman-north-peak-6'].every(id=>art.some(o=>o.placement.id===id)),'The ridge stays visible on both sides of the pass')
})

test('the five Persis districts each retain one connected mainland hinterland',()=>{
  const area=(ring:readonly (readonly [number,number])[])=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1]},0))/2
  for(const id of ids){
    const state=theatreDistrictById.get(id)!
    assert.equal(state.polygons.filter(poly=>area(poly[0])>20).length,1,`${id}: disconnected mainland fragment`)
  }
})

test('atlas centre labels are unique, contained and separated at close zoom, including simple-marker fallback',()=>{
  const game=createInitialState(),before=JSON.stringify(game)
  for(const settlements of [true,false]){
    const settings={...DEFAULT_MAP_SETTINGS,settlements}
    const scene=prepareMapScene(game,projection,4.5,6,'state',true,true,settings)
    const centres=[...scene.objects,...scene.simpleCentres].filter(o=>o.placement.asset==='settlement'&&o.placement.scope==='theatre')
    assert.equal(centres.length,5)
    const labels=centres.map(o=>{
      if(o.placement.asset!=='settlement')assert.fail()
      const state=theatreDistrictById.get(o.placement.stateId)!
      const label=theatreCentreLabel(state,projection,6,null,o)
      for(const at of [label,...label.alternatives??[]])assert.ok(pointInTheatreState(projection.inverse([at.x,at.y]),state))
      return label
    })
    const visible=visibleLabels(labels,6,centres.map(o=>o.box))
    assert.equal(visible.length,5)
    assert.equal(new Set(visible.map(l=>l.id)).size,5)
    const core=prepareMapScene(game,projection,4.5,6,'state',true,false,settings)
    assert.ok([...core.objects,...core.simpleCentres].every(o=>o.placement.scope!=='theatre'))
  }
  assert.ok(game.states.every(s=>!ids.includes(s.id as typeof ids[number])))
  assert.equal(JSON.stringify(game),before,'Visual atlas development must not change the live campaign')
  assert.ok(sceneryObjects(projection,4.5,6,'dominion',game.states).length===0)
})

test('cultivated Persis valleys keep generic relief off their field parcels at every illustrated zoom',()=>{
  for(const zoom of [1.8,3.8,7]){
    const objects=sceneryObjects(projection,zoom,zoom,'state',createInitialState().states)
    assert.ok(objects.every(o=>!['mountain','hill'].includes(o.placement.asset)||!inPersisValley(o.placement.position)))
    assert.ok(objects.some(o=>o.placement.rangeId==='zagros-fars-south'),'The surrounding mountain range remains visible')
    assert.ok(!objects.some(o=>o.placement.id==='zagros-fars-south-peak-4-foot'),'A generic foothill must not cover the Persepolis farm plots')
  }
})

test('Persis has broken lowering northern relief and a cultivated basin beneath it',()=>{
  for(const ridge of persisNorthernRidges){
    const peaks=backbonePeaks.filter(p=>p.rangeId===ridge.id)
    assert.ok(peaks.length>=3)
    assert.ok(peaks.every(p=>p.asset===('relief' in ridge?ridge.relief:'mountain')))
    const brushes=coreGroundBrushes.find(r=>r.id===ridge.id)!
    assert.ok(brushes.marks.every(m=>m.rx>0&&m.ry>0))
    if(ridge.id==='persis-northeast-ridge'){
      assert.ok(peaks.at(-1)!.scale<peaks[0].scale*.65,'The Carmanian extension should fall into low foothills')
      assert.ok(brushes.marks.at(-1)!.ry<brushes.marks[0].ry*.6,'Rocky shading tapers with the relief')
    }
  }
  for(const id of ['persis-persepolis-plain','persis-intermontane-basin','persis-southern-plateau-basin']){
    const brush=terrainGroundBrushes.find(b=>b.feature.id===id)!
    assert.ok(brush.marks.length>0&&brush.feature.type==='fertile'&&brush.feature.opacity>0)
    assert.ok(brush.feature.stateId,'Cultivation stays clipped to the correct district')
  }
  assert.ok(terrainGroundBrushes.some(b=>b.feature.id==='persis-highlands-rock'),'Independent highland ground must be painted too')
})

test('Persis has a smaller entry state, larger southern country and an inland Pasargadae corridor',()=>{
  const area=(ring:readonly (readonly [number,number])[])=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1]},0))/2
  const sizes=ids.map(id=>theatreDistrictById.get(id)!.polygons.reduce((sum,poly)=>sum+area(poly[0])-poly.slice(1).reduce((a,h)=>a+area(h),0),0))
  const sizesById=Object.fromEntries(ids.map((id,i)=>[id,sizes[i]]))
  assert.ok(sizesById['western-foothills']>1600&&sizesById['western-foothills']<sizesById.persepolis*.65,'The entry gains western corridor land while remaining smaller than the capital')
  assert.ok(ids.filter(id=>id!=='western-foothills').every(id=>sizesById[id]>3000),'The settled districts retain substantial hinterlands')
  const pass=theatreDistrictById.get('pasargadae')!,entry=theatreDistrictById.get('western-foothills')!
  assert.ok(pass.bounds.right-pass.bounds.left>(pass.bounds.bottom-pass.bounds.top)*1.6,'Pasargadae remains an eastward corridor after its western end joins the entry state')
  assert.ok(pass.bounds.bottom<project([54,29.5])[1],'Every point of Pasargadae remains inland')
  assert.ok(theatreBorders.every(b=>!b.states.includes('pasargadae')||b.states.length===2),'Pasargadae has no coastline')
  assert.ok(entry.bounds.bottom<project([54,30.5])[1],'Entry valley has no southern or coastal tail')
  for(const at of [[52.9,28.5],[53.5,28.1],[54.4,27.6]] as const)assert.ok(!pointInTheatreState(project(at),pass))
})


test('the Northern Highlands are an unowned barrier and preserve the western and eastern valley connections',()=>{
  assert.ok(mountainRegionLand['persis-northern-highlands'].length)
  assert.ok(!theatreDistrictById.has('central-plateau'))
  assert.ok(!persisScenery.some(p=>p.asset==='settlement'&&p.name==='Central Plateau'))
  for(const at of [[52.0,32.5],[53.8,32.1],[54.8,32.15]] as const){
    const p=project(at)
    assert.ok(inMountainTerrain(p),'Northern highland fixture is impassable')
    assert.ok([...theatreDistrictById.values()].every(s=>!pointInTheatreState(p,s)),'No atlas district owns the blocked highland')
  }
  for(const f of persisHighlandFeatures){
    assert.equal(f.stateId,undefined,'Blocked terrain contains no state farming')
    for(const at of f.points)assert.ok(inMountainTerrain(project(at)),'Rocky paint lies inside independent terrain')
  }
  const entry=theatreDistrictById.get('western-foothills')!,corridor=theatreDistrictById.get('pasargadae')!
  for(const at of [[52.3,31.5],[52.65,31.2]] as const){
    assert.ok(pointInTheatreState(project(at),entry),'Western corridor land now belongs to the larger entry state')
    assert.ok(!pointInTheatreState(project(at),corridor))
  }
  assert.ok(!entry.neighbors.includes('hecatompylos')&&!entry.neighbors.includes('karmana'),'The northern block cuts off plateau neighbours')
  assert.ok(entry.neighbors.includes(corridor.id)&&corridor.neighbors.includes(entry.id),'The entry opens east into Pasargadae')
  const closed=(m:number[][][][])=>m.map(p=>p.map(r=>[...r,r[0]])) as clipping.MultiPolygon
  const area=(r:number[][])=>Math.abs(r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1]},0)/2)
  const entryApproach=clipping.union(closed(stateLand['mountain-entrance']),closed(atlasLand[entry.id]))
  assert.equal(entryApproach.filter(p=>area(p[0])>20).length,1,'Mountain Entrance has a physical valley border into the entry state')
  const fullCorridor=clipping.union(closed(atlasLand[entry.id]),closed(atlasLand[corridor.id]))
  assert.equal(fullCorridor.filter(p=>area(p[0])>20).length,1,'Pasargadae connects to the entry without crossing the highlands')
  for(const at of [[53.2,31.3],[53.85,30.90],[55.2,30.6],[56.65,31.0]] as const){
    assert.ok(pointInTheatreState(project(at),corridor),'The corridor retains western, settled and far-side valley ground')
    assert.ok(!inMountainTerrain(project(at)))
  }
  assert.equal(theatreDistrictById.get('carmanian-uplands')!.provinceId,'carmania')
})
