import type { GameState } from './data.ts'
import { factions } from './data.ts'
import { dominionLabel, leader, selectedProvince, selectedState } from './engine.ts'
import { pointInState } from './geography.ts'
import { sceneryObjects } from './babyloniaScenery.ts'
import type { MapProjection } from './mapProjection.ts'
import type { MapLabel, MapLevel } from './mapView.ts'

// Camera-independent scene preparation: pan only changes visibility. Keep the
// candidates, ground anchors and collision obstacles stable between pans.
type SceneState = Pick<GameState, 'states' | 'provinces' | 'settlements' | 'commanders' | 'selectedStateId' | 'selectedCommanderId'>
export function prepareMapScene(game: SceneState, projection: MapProjection, zoom: number, scale: number, level: MapLevel, perspective: boolean) {
  const objects = perspective ? sceneryObjects(projection,zoom,scale,level,game.states) : []
  const centres = new Map(objects.flatMap(o=>o.placement.asset==='settlement'?[[o.placement.stateId,{object:o,name:o.placement.name,isCapital:o.placement.isCapital}] as const]:[]))
  const illustratedSeats = new Set(objects.filter(o=>o.placement.asset==='settlement').map(o=>o.placement.settlementId))
  const markerAt = (x:number,y:number,id:string) => {
    const point=projection.point([x,y])
    return [point[0],point[1]+(illustratedSeats.has(id)?10/scale:0)]
  }
  const state = selectedState(game), province = selectedProvince(game), commander = leader(game)
  const seats = factions.flatMap((f) => {
    const settlement = game.settlements.find((p) => p.id === f.seatSettlementId)
    return settlement && game.states.find((s) => s.id === settlement.stateId)?.owner === f.id ? [{faction:f,settlement}] : []
  })
  const seatIds = new Set(seats.map(p=>p.settlement.id))
  const provinceSeats = game.provinces.map(p=>({province:p,settlement:game.settlements.find(s=>s.id===p.mainSettlementId)!}))
  const provinceSeatIds = new Set(provinceSeats.map(p=>p.settlement.id))
  const dominionLabels: MapLabel[] = factions.flatMap((f) => {
    const anchor = dominionLabel(game, f.id)
    const [x,y]=projection.point(anchor?[anchor.labelX,anchor.labelY]:[0,0])
    return anchor ? [{ id: f.id, text: f.name, x, y:y+65/scale, alternatives:[95,40,125].map(dy=>({x,y:y+dy/scale})), size: 22, priority: 1, kind: 'dominion' as const }] : []
  })
  const labels:MapLabel[] = [...game.states.map((p) => {
    const seat=provinceSeats.find(s=>s.settlement.stateId===p.id)
    const centre=centres.get(p.id)
    if(centre){
      const {x,y,size}=centre.object, fontSize=centre.isCapital?17:15
      const below=(centre.isCapital?44:24)/scale
      const side=(24*size+(centre.name.length*fontSize*.56/2+8)/scale)
      const positions=[{x,y:y+below},{x:x-side,y:y+4/scale},{x:x+side,y:y+4/scale},
        {x,y:y+below+16/scale},{x,y:centre.object.box.top-8/scale}]
        .filter(at=>pointInState(projection.inverse([at.x,at.y]),p.id))
      const preferred=positions[0]??{x,y}
      return {id:p.id,text:centre.name,...preferred,alternatives:positions.slice(1),size:fontSize,priority:p.id===state?.id?10:p.provinceId===province?.id?6:4,kind:'state' as const}
    }
    const [x,y]=projection.point([p.labelX,p.labelY])
    const offsets=perspective?[-20,20,-35,35,-55,55]:[-20,20,-35,35]
    const alternatives=offsets.map(dy=>({x,y:y+dy/scale}))
    if(perspective)alternatives.push(...[-45,45,-65,65,-95,95].map(dx=>({x:x+dx/scale,y})),
      ...[-70,70].flatMap(dx=>[-25,35].map(dy=>({x:x+dx/scale,y:y+dy/scale}))))
    return {id:p.id,text:p.name,x,y,alternatives:alternatives.filter(at=>pointInState(projection.inverse([at.x,at.y]),p.id)),size:seat?17:15,priority:p.id===state?.id?10:p.provinceId===province?.id?6:4,kind:'state' as const}
  }), ...game.settlements.filter(p=>level==='state'||provinceSeatIds.has(p.id)||p.stateId===state?.id).filter(p=>game.states.find(s=>s.id===p.stateId)?.name!==p.name).map((p) => {
    const [x,y]=projection.point([p.x,p.y])
    return {id:p.id,text:p.name,x,y:y+13/scale,size:11,priority:provinceSeatIds.has(p.id)?9:p.stateId===state?.id?5:1,kind:'city' as const}
  })]
  seats.forEach(({settlement:p})=>{
    const [x,y]=projection.point([p.x,p.y])
    dominionLabels.push({id:p.id,text:p.name,x,y:y+30/scale,size:12,priority:5,kind:'city'})
  })
  const obstacles=provinceSeats.map(({settlement:p})=>{
    const [x,y]=markerAt(p.x,p.y,p.id)
    const radius=(seatIds.has(p.id)?13:6)/scale
    return {left:x-radius,right:x+radius,top:y-radius,bottom:y+radius}
  })
  const cityObstacles=objects.filter(o=>o.placement.asset==='settlement').map(o=>o.box)
  const ridgeObstacles=objects.filter(o=>o.placement.asset==='mountain'&&o.placement.rangeId).map(o=>o.box)
  const [localX,localY]=projection.point(state?[state.labelX,state.labelY]:[0,0])
  const localDetails: MapLabel[] = level === 'state' && state ? [{
    id: `${state.id}-details`, text: `${state.garrison} garrison\n${state.buildings.market} market${state.buildings.fort > 0 ? ` · ${state.buildings.fort} fort` : ''}`,
    x: localX, y: localY + 40 / scale, size: 10, priority: 0, kind: 'local',
    alternatives: [55, 70, -35, -50].map(dy => ({ x: localX, y: localY + dy / scale })).filter(at => pointInState(projection.inverse([at.x, at.y]), state.id)),
  }] : []
  return { objects, illustratedSeats, state, province, commander, seats, seatIds, provinceSeats, provinceSeatIds, markerAt, labels, localDetails, dominionLabels, obstacles, cityObstacles, ridgeObstacles }
}
