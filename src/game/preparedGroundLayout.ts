import { mapBounds } from './worldTerrain.ts'
import { GROUND_CACHE_BYTES, GROUND_TILE_BLEED } from './groundTiles.ts'
import type { LabelBox, MapLevel } from './mapView.ts'

// Broad colour washes need much less resolution than coastlines or scenery.
// Fine coast/land edges remain in the separate, exact-resolution ground tiles.
export const PREPARED_GROUND_SIZE=512
export const PREPARED_GROUND_RESOLUTIONS=[.5,2] as const
export const PREPARED_GROUND_LEVELS=['dominion','province','state'] as const
export type PreparedGroundTile={key:string;level:MapLevel;resolution:number;x:number;y:number;size:number}
export function preparedGroundTiles(regions:readonly LabelBox[],level:MapLevel,resolution:number,bounded=true):PreparedGroundTile[]{
  const quality=resolution<=.5?.5:2,tiles=new Map<string,PreparedGroundTile>()
  for(const region of regions){
    const left=Math.max(region.left,mapBounds.left),right=Math.min(region.right,mapBounds.right)
    const top=Math.max(region.top,mapBounds.top),bottom=Math.min(region.bottom,mapBounds.bottom)
    if(left>=right||top>=bottom)continue
    for(let y=Math.floor(top/PREPARED_GROUND_SIZE);y<Math.ceil(bottom/PREPARED_GROUND_SIZE);y++)for(let x=Math.floor(left/PREPARED_GROUND_SIZE);x<Math.ceil(right/PREPARED_GROUND_SIZE);x++){
      const key=`${level}:${quality}:${x}:${y}`
      tiles.set(key,{key,level,resolution:quality,x:x*PREPARED_GROUND_SIZE,y:y*PREPARED_GROUND_SIZE,size:PREPARED_GROUND_SIZE})
    }
  }
  const planned=[...tiles.values()]
  return bounded&&quality===2&&planned.length*(PREPARED_GROUND_SIZE*quality+2*GROUND_TILE_BLEED)**2*4>GROUND_CACHE_BYTES*.75?preparedGroundTiles(regions,level,.5):planned
}
