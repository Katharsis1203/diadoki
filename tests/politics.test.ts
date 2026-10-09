import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../src/game/data.ts'
import { atlasStates, politicalEdges, politicalBorderPaths, politicalLabelAnchors } from '../src/game/politicalGeography.ts'
import { mapFactions, mapFactionById, provinceOwners, stateOwnerOverrides } from '../src/game/politicalContent.ts'
import { theatreStates, theatreProvinces } from '../src/game/theatreContent.ts'
import { theatreCoreRings, theatreVertices } from '../src/game/theatreGeometry.ts'
import { stateRings, mapVertices } from '../src/game/stateGeometry.ts'
import { territoryAt } from '../src/game/geography.ts'
import { theatreStateAt } from '../src/game/theatreGeography.ts'

const core=createInitialState().states
const all=new Map([...core,...atlasStates].map(s=>[s.id,s]))
test('the political atlas covers every province and state with a known ruler and a held seat',()=>{
  assert.equal(new Set(mapFactions.map(f=>f.id)).size,mapFactions.length)
  assert.equal(Object.keys(provinceOwners).length,theatreProvinces.length)
  assert.equal(atlasStates.length,181)
  for(const id of Object.keys(stateOwnerOverrides))assert.ok(theatreStates.some(s=>s.id===id),id)
  for(const s of atlasStates)assert.ok(mapFactionById.has(s.owner),s.id)
  for(const f of mapFactions)assert.equal(all.get(f.seatStateId)?.owner,f.id,`${f.name}: seat must exist and belong to faction`)
})
test('independent atlas satraps each hold one or two complete provinces',()=>{
  const satraps=mapFactions.filter(f=>f.kind==='satrap'&&f.id!=='nicanor')
  assert.equal(satraps.length,9)
  for(const f of satraps){
    const provinces=theatreProvinces.filter(p=>provinceOwners[p.id]===f.id)
    assert.ok(provinces.length>=1&&provinces.length<=2,f.name)
    for(const p of provinces)assert.ok(atlasStates.filter(s=>s.provinceId===p.id).every(s=>s.owner===f.id))
  }
  assert.equal(provinceOwners.macedonia,'cassander');assert.equal(provinceOwners.thrace,'lysimachus')
  assert.equal(provinceOwners['lower-egypt'],'ptolemy');assert.equal(provinceOwners.cyprus,'ptolemy')
  assert.equal(provinceOwners.lydia,'antigonus');assert.equal(provinceOwners.magadha,'maurya')
  assert.equal(atlasStates.find(s=>s.id==='roma')!.owner,'rome')
  assert.equal(atlasStates.find(s=>s.id==='panormus')!.owner,'carthage')
})
test('one joined political mesh eliminates false core/atlas frontiers and responds to conquest',()=>{
  const paths=politicalBorderPaths(core),frontiers=new Set(paths.frontierEdges.map(e=>e.path))
  let matchingSeams=0,differentSeams=0
  for(const e of politicalEdges){
    assert.ok(e.states.length>=1&&e.states.length<=2)
    const [a,b]=e.states.map(id=>all.get(id)!)
    assert.ok(a);if(e.states.length===2)assert.ok(b)
    assert.equal(frontiers.has(e.path),!b||a.owner!==b.owner)
    if(b&&('shape' in a)!==('shape' in b)){
      if(a.owner===b.owner)matchingSeams++;else differentSeams++
    }
  }
  assert.ok(matchingSeams>0);assert.ok(differentSeams>0)
  const seam=politicalEdges.find(e=>e.states.length===2&&e.states.some(id=>core.some(s=>s.id===id))&&e.states.some(id=>atlasStates.some(s=>s.id===id))&&all.get(e.states[0])!.owner===all.get(e.states[1])!.owner)!
  const coreId=seam.states.find(id=>core.some(s=>s.id===id))!
  const changed=politicalBorderPaths(core.map(s=>s.id===coreId?{...s,owner:'babylon'}:s))
  assert.ok(changed.frontierEdges.some(e=>e.path===seam.path))
  assert.equal(politicalBorderPaths(core).frontiers,paths.frontiers,'Conquest must not mutate original content')
})
test('core noding preserves territory area and faction label anchors stay on owned ground',()=>{
  const signedArea=(ring:readonly (readonly [number,number])[])=>ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1]},0)/2
  for(const s of core){
    const original=Math.abs(signedArea(stateRings[s.id].map(i=>mapVertices[i])))
    const noded=theatreCoreRings[s.id].reduce((sum,p)=>sum+Math.abs(signedArea(p[0].map(i=>theatreVertices[i])))-p.slice(1).reduce((holes,r)=>holes+Math.abs(signedArea(r.map(i=>theatreVertices[i]))),0),0)
    assert.ok(Math.abs(original-noded)<.001,`${s.id}: noding changed area`)
  }
  const labels=politicalLabelAnchors(core)
  assert.equal(labels.length,mapFactions.length)
  for(const l of labels)for(const at of [l.at,...l.alternatives]){
    const s=territoryAt(at,core)?.state??theatreStateAt(at)
    assert.equal(s&&all.get(s.id)?.owner,l.faction.id,`${l.faction.name}: label outside owned territory`)
  }
})
