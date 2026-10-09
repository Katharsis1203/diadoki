import { GROUND_CACHE_BYTES, GROUND_TILE_BLEED } from './groundTiles.ts'
import { preparedGroundTiles, PREPARED_GROUND_SIZE } from './preparedGroundLayout.ts'
import type { PreparedGroundTile } from './preparedGroundLayout.ts'
import { boundsIntersect } from './mapViewport.ts'
import { mapBounds } from './worldTerrain.ts'
import type { LabelBox, MapLevel } from './mapView.ts'

export const PREPARED_GROUND_JOBS=3
export const preparedTileBytes=(tile:PreparedGroundTile)=>(tile.size*tile.resolution+2*GROUND_TILE_BLEED)**2*4
export const coarseGroundKey=(tile:PreparedGroundTile)=>`${tile.level}:0.5:${tile.x/PREPARED_GROUND_SIZE}:${tile.y/PREPARED_GROUND_SIZE}`

export function planPreparedGround(view:LabelBox,visible:LabelBox,level:MapLevel,resolution:number){
  const cx=(visible.left+visible.right)/2,cy=(visible.top+visible.bottom)/2
  const distance=(tile:PreparedGroundTile)=>Math.hypot(tile.x+tile.size/2-cx,tile.y+tile.size/2-cy)
  const nearest=(tiles:PreparedGroundTile[])=>tiles.toSorted((a,b)=>distance(a)-distance(b))
  const inView=(tile:PreparedGroundTile)=>boundsIntersect({left:tile.x,right:tile.x+tile.size,top:tile.y,bottom:tile.y+tile.size},visible)
  const tiles=nearest(preparedGroundTiles([view],level,resolution))
  if(!tiles.length)return {tiles,demand:[],prefetch:[],bytes:0}
  const coarse=nearest(preparedGroundTiles([mapBounds],level,.5,false))
  const rendered=new Set(tiles.map(coarseGroundKey))
  // Coarse visible coverage comes first, followed by sharp visible images and
  // the retained buffer. Preloading the rest of the coarse theatre is cheap.
  const demand=new Map<string,PreparedGroundTile>()
  for(const group of [coarse.filter(inView),tiles.filter(inView),coarse.filter(t=>rendered.has(t.key)),tiles,coarse]){
    for(const tile of group)demand.set(tile.key,tile)
  }
  let bytes=[...demand.values()].reduce((sum,tile)=>sum+preparedTileBytes(tile),0)
  const prefetch:PreparedGroundTile[]=[]
  if(tiles[0]?.resolution===2){
    const pad=PREPARED_GROUND_SIZE
    const neighbours=nearest(preparedGroundTiles([{left:view.left-pad,right:view.right+pad,top:view.top-pad,bottom:view.bottom+pad}],level,2,false))
    for(const tile of neighbours){
      if(demand.has(tile.key)||bytes+preparedTileBytes(tile)>GROUND_CACHE_BYTES*.875)continue
      demand.set(tile.key,tile);prefetch.push(tile);bytes+=preparedTileBytes(tile)
    }
  }
  return {tiles,demand:[...demand.values()],prefetch,bytes}
}
