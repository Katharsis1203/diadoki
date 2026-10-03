import { theatreCoreRings, theatreStateRings, theatreVertices } from './theatreGeometry.ts'
import { theatreDistricts } from './theatreGeography.ts'
import { atlasOwner, mapFactions } from './politicalContent.ts'
import { mapBorderPaths, stateBounds } from './geography.ts'
import { pointBounds } from './mapViewport.ts'
import type { TerritoryState } from './data.ts'
import type { MapPoint } from './mapProjection.ts'

export const atlasStates=theatreDistricts.map(s=>({...s,owner:atlasOwner(s)}))
// The offline generator nodes both meshes together. One static edge registry
// means no doubled frontier, or false frontier where the same ruler crosses
// from the playable core into an atlas province. No runtime polygon clipping.
const edges=new Map<string,{path:string;states:string[];bounds:ReturnType<typeof pointBounds>}>()
for(const [id,polygons] of Object.entries({...theatreCoreRings,...theatreStateRings}))for(const ring of polygons.flat())ring.forEach((a,i)=>{
  const b=ring[(i+1)%ring.length],key=a<b?`${a}:${b}`:`${b}:${a}`
  const edge=edges.get(key)
  if(edge)edge.states.push(id)
  else edges.set(key,{path:`M${theatreVertices[a].join(',')}L${theatreVertices[b].join(',')}`,states:[id],bounds:pointBounds([theatreVertices[a],theatreVertices[b]])})
})
export const politicalEdges=[...edges.values()]
export function politicalBorderPaths(core:readonly TerritoryState[]) {
  const all=[...core,...atlasStates],owners=new Map(all.map(s=>[s.id,s.owner]))
  const outlines=new Map(all.map(s=>[s.id,[] as string[]])),frontierEdges:typeof politicalEdges=[]
  for(const edge of politicalEdges){
    const [a,b]=edge.states
    if(b&&owners.get(a)===owners.get(b))continue
    frontierEdges.push(edge)
    for(const id of edge.states)outlines.get(id)!.push(edge.path)
  }
  return {...mapBorderPaths(core),frontiers:frontierEdges.map(e=>e.path).join(''),frontierEdges,dominions:all.map(s=>({id:s.id,owner:s.owner,path:outlines.get(s.id)!.join(''),bounds:'bounds' in s?s.bounds:stateBounds(s.id)}))}
}
export function politicalLabelAnchors(core:readonly TerritoryState[]) {
  const districts=[...core.map(s=>({id:s.id,owner:s.owner,at:[s.labelX,s.labelY] as MapPoint})),...atlasStates.map(s=>({id:s.id,owner:s.owner,at:s.label}))]
  return mapFactions.flatMap(f=>{
    const held=districts.filter(s=>s.owner===f.id)
    if(!held.length)return []
    const bounds=pointBounds(held.map(s=>s.at)),mid:MapPoint=[(bounds.left+bounds.right)/2,(bounds.top+bounds.bottom)/2]
    const ordered=held.toSorted((a,b)=>Math.hypot(a.at[0]-mid[0],a.at[1]-mid[1])-Math.hypot(b.at[0]-mid[0],b.at[1]-mid[1]))
    return [{faction:f,at:ordered[0].at,alternatives:ordered.slice(1).map(s=>s.at)}]
  })
}
