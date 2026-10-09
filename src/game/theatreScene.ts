import type { SceneryObject } from './babyloniaScenery.ts'
import type { TheatreDistrict } from './theatreGeography.ts'
import { pointInTheatreState } from './theatreGeography.ts'
import type { MapProjection } from './mapProjection.ts'
import type { MapLabel } from './mapView.ts'

// Keep illustrated centres and their labels together. Alternate label anchors
// remain inside the district, especially in the two adjoining royal valleys.
export function theatreCentreLabel(state:TheatreDistrict,projection:MapProjection,scale:number,selectedId:string|null,centre?:SceneryObject):MapLabel {
  if(!centre){
    const [x,y]=projection.point(state.anchor)
    return {id:state.id,text:state.name,x,y:y+15/scale,size:state.isCapital?14:12,
      priority:state.id===selectedId?8:state.isCapital?5:3,kind:'state',
      alternatives:[-12,28,-26].map(dy=>({x,y:y+dy/scale}))}
  }
  const {x,y}=centre
  const size=state.isCapital?17:13
  const below=(centre.size?(state.isCapital?30:20):15)/scale
  const side=24*centre.size+(state.name.length*size*.56/2+8)/scale
  const options=[{x,y:y+below},{x:x-side,y:y+4/scale},{x:x+side,y:y+4/scale},
    {x,y:(centre.size?centre.box.top:y)-8/scale},{x,y:y+below+16/scale}]
  const positions=options.filter(at=>pointInTheatreState(projection.inverse([at.x,at.y]),state))
  return {id:state.id,text:state.name,...positions[0]??{x,y},alternatives:positions.slice(1),size,
    priority:state.id===selectedId?8:state.isCapital?5:3,kind:'state'}
}
