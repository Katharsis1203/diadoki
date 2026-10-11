import { BabyloniaScenery } from './BabyloniaScenery'
import { scenerySymbol } from './scenerySymbol'
import { PixiMapLayer } from './PixiMapLayer'
import type { SceneryObject } from '../game/babyloniaScenery'
import type { LabelBox } from '../game/mapView'

// Rasterize the existing symbols once at sufficient density for the maximum
// authored sprite size, including DPR 2. Geography, opacity and sorting stay shared.
export function PixiScenery({objects,view,scale}:{objects:readonly SceneryObject[];view:LabelBox;scale:number}){
  const fallback=<BabyloniaScenery objects={objects}/>
  if(!objects.length)return fallback
  const sprites=objects.map(o=>({id:o.placement.id,source:`symbol:${scenerySymbol(o)}:${o.placement.asset==='settlement'?23:19}`,
    x:o.x-30*o.size,y:o.y-44*o.size,width:60*o.size,height:52*o.size,alpha:o.opacity}))
  return <PixiMapLayer name="scenery" sprites={sprites} view={view} scaleX={scale} scaleY={scale}>{fallback}</PixiMapLayer>
}
