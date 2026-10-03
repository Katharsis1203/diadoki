import { theatreProvinces, theatreStates } from './theatreContent.ts'
import { theatreVertices, theatreStateRings, theatreProvinceLabels, theatreStateLabels, theatreSettlementAnchors, theatreNeighbors } from './theatreGeometry.ts'
import { boundsIntersect, pointBounds } from './mapViewport.ts'
import type { MapPoint } from './mapProjection.ts'

// Everything expensive is generated offline or prepared once here. Camera
// frames only cull polygons and choose labels; no runtime polygon operations.
export const theatreDistricts = theatreStates.map(state => {
  const polygons = theatreStateRings[state.id].map(poly=>poly.map(ring=>ring.map(i=>theatreVertices[i])))
  const path = polygons.flat().map(ring=>`M${ring.map(p=>p.join(',')).join('L')}Z`).join('')
  return {...state,polygons,path,bounds:pointBounds(polygons.flat(2)),
    anchor:theatreSettlementAnchors[state.id],label:theatreStateLabels[state.id],neighbors:theatreNeighbors[state.id]}
})
export type TheatreDistrict = typeof theatreDistricts[number]
export const theatreDistrictById = new Map(theatreDistricts.map(s=>[s.id,s]))
const edges = new Map<string,{a:MapPoint;b:MapPoint;states:string[]}>()
for(const state of theatreDistricts)for(const ring of theatreStateRings[state.id].flat())ring.forEach((a,i)=>{
  const b=ring[(i+1)%ring.length],key=a<b?`${a}:${b}`:`${b}:${a}`
  const edge=edges.get(key)
  if(edge)edge.states.push(state.id)
  else edges.set(key,{a:theatreVertices[a],b:theatreVertices[b],states:[state.id]})
})
export const theatreBorders = [...edges.values()].map(({a,b,states})=>({
  path:`M${a.join(',')}L${b.join(',')}`,bounds:pointBounds([a,b]),states,
  provincial:states.length===1||theatreDistrictById.get(states[0])!.provinceId!==theatreDistrictById.get(states[1])!.provinceId,
}))
export const theatreRegions = theatreProvinces.map(province=>{
  const children=new Set(province.stateIds)
  const districts=province.stateIds.map(id=>theatreDistrictById.get(id)!)
  return {...province,label:theatreProvinceLabels[province.id],districts,
    bounds:pointBounds(districts.flatMap(s=>[[s.bounds.left,s.bounds.top],[s.bounds.right,s.bounds.bottom]] as MapPoint[])),
    borderPath:theatreBorders.filter(e=>e.states.filter(id=>children.has(id)).length===1).map(e=>e.path).join('')}
})
export const theatreRegionById = new Map(theatreRegions.map(p=>[p.id,p]))

export function pointInTheatreState(point:MapPoint,state:TheatreDistrict) {
  if(!boundsIntersect(state.bounds,{left:point[0],right:point[0],top:point[1],bottom:point[1]}))return false
  const inRing=(ring:readonly MapPoint[])=>{
    let inside=false
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[i],b=ring[j]
      if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
    }
    return inside
  }
  return state.polygons.some(poly=>inRing(poly[0])&&!poly.slice(1).some(inRing))
}
export const theatreStateAt=(point:MapPoint)=>theatreDistricts.find(s=>pointInTheatreState(point,s))
