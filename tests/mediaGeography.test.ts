import test from 'node:test'
import assert from 'node:assert/strict'
import {createInitialState,project} from '../src/game/data.ts'
import {pointInState,territoryAt} from '../src/game/geography.ts'
import {mapVertices,stateRings} from '../src/game/stateGeometry.ts'
import {travelRegions} from '../src/game/mountainGeometry.ts'
import {mediaNorthernRiver,zagrosWesternBorder,zagrosNorthernRiver,rhagaeWesternRidgeEdge} from '../src/game/mediaGeography.ts'
import {provinceControl,gameReducer} from '../src/game/engine.ts'
import {mapFactionById} from '../src/game/politicalContent.ts'
import {factionSymbols} from '../src/game/factionSymbols.ts'
import {distanceToSegment} from '../src/game/riverGeometry.ts'
import {coreRangeGround} from '../src/game/terrainBackbone.ts'
import {ganzakUpperRiver,atropateneWesternPassOutline} from '../src/game/atropateneGeography.ts'
import {inMountainTerrain,canTravelDirectly,inLandRing} from '../src/game/mountainTerrain.ts'

const borderDistance=(id:string,point:readonly [number,number])=>{
  const ring=stateRings[id].map(i=>mapVertices[i])
  return Math.min(...ring.map((a,i)=>distanceToSegment(point,a,ring[(i+1)%ring.length]).distance))
}

test('Ganzak follows the upper Lesser Zab beside Atropatene’s western pass extension',()=>{
  for(const at of ganzakUpperRiver){
    const p=project(at)
    assert.ok(borderDistance('ganzak',p)<.00001)
    assert.ok(borderDistance('atropatene',p)<.00001)
  }
  assert.ok(borderDistance('atropatene',project(ganzakUpperRiver.at(-1)!))<.00001)
  const game=createInitialState()
  assert.equal(territoryAt(project([45.83,36.57]),game.states)?.state.id,'atropatene')
  assert.equal(territoryAt(project([45.83,36.51]),game.states)?.state.id,'ganzak')
})

test('Western Valley stays in Susiana without changing its settlement, owner or the opening economy',()=>{
  const game=createInitialState(),valley=game.states.find(s=>s.id==='western-valley')!
  const media=game.provinces.find(p=>p.id==='media')!,susa=game.provinces.find(p=>p.id==='susiana')!
  assert.equal(valley.provinceId,'susiana')
  assert.ok(susa.stateIds.includes(valley.id)&&!media.stateIds.includes(valley.id))
  assert.equal(media.stateIds.length,4)
  assert.equal(susa.stateIds.length,5)
  assert.equal(media.mainSettlementId,'ecbatana-city')
  assert.equal(valley.owner,game.states.find(s=>s.id==='susa')!.owner)
  assert.deepEqual(valley.settlementIds,['western-valley-village'])
  assert.equal(game.states.filter(s=>s.owner==='babylon').length,10)
  assert.equal(game.treasury,228)
})

test('Zagros uses the local upper Diyala while Nisaean Plain keeps its separate northern river',()=>{
  for(const at of zagrosNorthernRiver){
    const p=project(at)
    assert.ok(borderDistance('zagros',p)<.00001,`Local Diyala vertex ${at}`)
    assert.ok(borderDistance('assur',p)<.00001,'The retired western Atropatene tail joins Assyria’s foothills')
  }
  for(const at of mediaNorthernRiver){
    const p=project(at)
    assert.ok(borderDistance('nisaea',p)<.00001,'Nisaean Plain follows its displayed northern channel')
    assert.ok(borderDistance('ganzak',p)<.00001)
    assert.ok(borderDistance('zagros',p)>15,'Zagros must not reach the distant northern river')
  }
  for(const at of zagrosWesternBorder){
    const p=project(at)
    assert.ok(borderDistance('zagros',p)<.00001,'The western approach uses its straight upper join and lower river bank')
    assert.ok(borderDistance('sippar',p)<.00001,'Both banks use the same channel boundary')
  }
})

test('Nicanor holds Media and Babylonian Zagros while Ganzak and Atropatene form their own province',()=>{
  const game=createInitialState(),media=game.provinces.find(p=>p.id==='media')!
  const north=game.provinces.find(p=>p.id==='atropatene')!,babylon=game.provinces.find(p=>p.id==='babylonia')!
  assert.deepEqual([...media.stateIds].sort(),['ecbatana','nisaea','paraitakene','rhagae'])
  assert.deepEqual([...north.stateIds].sort(),['atropatene','atropatene-coast','atropatene-river-basin','ganzak','northern-atropatene'])
  assert.equal(north.mainSettlementId,'ganzak-city')
  for(const id of north.stateIds)assert.equal(game.states.find(s=>s.id===id)!.owner,'atropatene')
  assert.equal(mapFactionById.get('atropatene')!.seatStateId,'ganzak')
  assert.ok(factionSymbols.atropatene)
  assert.equal(provinceControl(game,media),'nicanor')
  assert.equal(provinceControl(game,north),'atropatene')
  assert.equal(provinceControl(game,babylon),null,'Babylonia has mixed ownership')
  const zagros=game.states.find(s=>s.id==='zagros')!
  assert.equal(zagros.provinceId,'babylonia');assert.equal(zagros.owner,'nicanor')
  assert.equal(mapFactionById.get('nicanor')!.seatStateId,'ecbatana')
  assert.ok(factionSymbols.nicanor)
  const commander=game.commanders.find(c=>c.id==='nicanor')!
  assert.equal(commander.faction,'nicanor');assert.equal(commander.locationStateId,'ecbatana')
  assert.ok(!game.recruitables.some(c=>c.id==='nicanor'))
  const invasion=gameReducer({...game,selectedStateId:'ecbatana',commanders:game.commanders.map(c=>c.id===game.selectedCommanderId?{...c,locationStateId:'western-valley'}:c)},{type:'invade'})
  assert.equal(invasion.battle?.enemyCommander.id,'nicanor','Nicanor actually defends his capital')
  assert.equal(territoryAt(project([48.4,36.5]),game.states)?.provinceId,'atropatene','The former northern capital spur joins the separate province')
})

test('the enlarged Zagros approach includes both passes while mountain barriers remain unowned',()=>{
  const game=createInitialState()
  for(const at of [[46.55,34.84],[46.73,34.25]] as const){
    assert.equal(territoryAt(project(at),game.states)?.state.id,'zagros','Both entry saddles belong to Zagros')
    assert.ok(!inMountainTerrain(project(at)))
  }
  assert.ok(inMountainTerrain(project([46.30,35.16])))
  assert.equal(territoryAt(project([46.30,35.16]),game.states),null)
  assert.equal(canTravelDirectly('mountain-entrance','paraitakene'),false,'The established northern crossing stays closed')
  assert.ok(canTravelDirectly('susa','western-valley'),'The existing western pass remains open')
  assert.ok(canTravelDirectly('elymais','mountain-entrance'))
})

test('the redrawn Median hinterlands contain their centres and keep Paraitakene out of Western Valley',()=>{
  for(const [id,at] of [['zagros',[46.2,34.8]],['nisaea',[47.6,34.5]],['ecbatana',[48.52,34.8]],
    ['rhagae',[51.44,35.6]],['paraitakene',[50.2,33.8]],['western-valley',[48.15,33.85]]] as const)
    assert.ok(pointInState(project(at),id),`${id}: centre remains in its hinterland`)
  assert.ok(pointInState(project([49.48,33.20]),'western-valley'))
  assert.ok(!pointInState(project([49.48,33.20]),'paraitakene'))
})


test('Rhagae’s western ridge contour replaces the old stepped division without changing its province',()=>{
  for(const at of rhagaeWesternRidgeEdge){
    const p=project(at)
    assert.ok(borderDistance('ecbatana',p)<.00001,'Capital side of the ridge contour')
    assert.ok(borderDistance('rhagae',p)<.00001,'Rhagae shares the same smooth contour')
  }
  const game=createInitialState()
  assert.equal(game.states.find(s=>s.id==='rhagae')!.provinceId,'media')
  assert.equal(game.states.find(s=>s.id==='rhagae')!.owner,'nicanor')
})


test('five Atropatene districts follow the rivers and keep the Assyrian sides of both ridges outside their province',()=>{
  const game=createInitialState()
  for(const [at,id] of [
    [[46.1,37.8],'atropatene'],[[46.5,36.7],'ganzak'],
    [[47.65,38.2],'northern-atropatene'],[[48.45,36.75],'atropatene-river-basin'],
    [[48.65,37.55],'atropatene-coast'],
  ] as const){
    const hit=territoryAt(project(at),game.states)
    assert.equal(hit?.state.id,id)
    assert.equal(hit?.provinceId,'atropatene')
    assert.equal(hit?.state.owner,'atropatene')
  }
  // Sample the western foothills rather than just the state labels. A clipped
  // mountain centre alone would miss territory leaking onto the opposite bank.
  for(const ridge of coreRangeGround.filter(r=>['zagros-upper','zagros-zab'].includes(r.id)))
    for(let i=1;i<ridge.mapPoints.length;i++){
      const a=ridge.mapPoints[i-1],b=ridge.mapPoints[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)
      for(const t of [.2,.5,.8]){
        const p=[a[0]+t*dx-dy/length*16,a[1]+t*dy+dx/length*16] as const
        if(inLandRing(p,atropateneWesternPassOutline.map(project)))
          assert.notEqual(territoryAt(p,game.states)?.state.id,'ganzak','Only the lake state extends into the western pass')
        else assert.notEqual(territoryAt(p,game.states)?.provinceId,'atropatene',`${ridge.id}: western foothill spill`)
      }
    }
  for(const at of [[45.75,36.25],[46.08,36.10]] as const)
    assert.equal(territoryAt(project(at),game.states)?.state.id,'ganzak','The eastern foothill gap belongs to Ganzak up to the mountain barrier')
  for(const at of [[44.95,34.7],[45.3,35.5]] as const)
    assert.notEqual(territoryAt(project(at),game.states)?.provinceId,'atropatene','The retired southwestern arm stays outside the province')
})

test('Atropatene reaches the western pass and the Median shoulder closes the former Assyrian mountain gap',()=>{
  const game=createInitialState()
  for(const at of [[45.30,36.45],[45.45,36.50]] as const){
    assert.equal(territoryAt(project(at),game.states)?.state.id,'atropatene')
    assert.ok(!inMountainTerrain(project(at)))
  }
  assert.ok(Object.values(travelRegions).some(r=>r.stateId==='atropatene'&&r.neighbors.some(id=>travelRegions[id].stateId==='arbela')),'The western pass meets Assyrian valley ground without bypassing its mountains')
  for(const [at,id] of [[[46.40,35.90],'ganzak'],[[46.50,36.00],'ganzak'],[[46.50,35.78],'nisaea']] as const){
    const p=project(at)
    assert.ok(inMountainTerrain(p),'The orange-marked gap is independent mountain terrain')
    assert.equal(territoryAt(p,game.states),null)
    assert.ok(inLandRing(p,stateRings[id].map(i=>mapVertices[i])),'The administrative shoulder belongs on the Median side, rather than in Assyria')
  }
})
