import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { GroundTileCache, groundTileFromKey, planGroundTiles } from '../game/groundTiles'
import { createGroundTilePainter } from '../game/groundPainter'
import { mapBounds } from '../game/worldTerrain'
import { groundGeometry } from '../game/groundGeometry'
import type { LabelBox, MapLevel } from '../game/mapView'

export function useCachedGround(view:LabelBox,scale:number,level:MapLevel,enabled:boolean,shading=true){
  const [cache]=useState(()=>new GroundTileCache(createGroundTilePainter()))
  const {left,right,top,bottom}=view
  const ratio=typeof window==='undefined'?1:window.devicePixelRatio
  const tiles=useMemo(()=>enabled?planGroundTiles({left,right,top,bottom},scale,ratio,level,mapBounds,shading):[],[left,right,top,bottom,scale,ratio,level,enabled,shading])
  const keys=tiles.map(t=>t.key).sort().join('|')
  // Keep a stable demand when moving within the same geographic tile window.
  // Publish decoded tiles progressively instead of waiting for the window.
  const demand=useMemo(()=>keys?keys.split('|').map(groundTileFromKey):[],[keys])
  useEffect(()=>{if(enabled)cache.activate();else cache.dispose();return ()=>cache.dispose()},[cache,enabled])
  useEffect(()=>cache.setDemand(demand),[cache,demand])
  const subscribe=useCallback((listener:()=>void)=>{
    let frame=0
    const unsubscribe=cache.subscribe(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;listener()})})
    return ()=>{unsubscribe();if(frame)cancelAnimationFrame(frame)}
  },[cache])
  useSyncExternalStore(subscribe,()=>cache.version,()=>0)
  const available:typeof demand=[],missing:typeof demand=[]
  for(const tile of demand)(cache.texture(tile.key)?available:missing).push(tile)
  const ready=enabled&&demand.length>0&&missing.length===0
  const missingKey=missing.map(t=>t.key).join('|')
  const fallbackPieces=useMemo(()=>{
    return missingKey?missingKey.split('|').map(groundTileFromKey).map(tile=>({tile,geometry:groundGeometry({left:tile.x-8,right:tile.x+tile.size+8,top:tile.y-8,bottom:tile.y+tile.size+8})})):[]
  },[missingKey])
  const geometry=useMemo(()=>{
    if(!enabled||!demand.length)return null
    const bounds={left:Math.min(...demand.map(t=>t.x)),right:Math.max(...demand.map(t=>t.x+t.size)),top:Math.min(...demand.map(t=>t.y)),bottom:Math.max(...demand.map(t=>t.y+t.size))}
    return groundGeometry({left:bounds.left-8,right:bounds.right+8,top:bounds.top-8,bottom:bounds.bottom+8})
  },[demand,enabled])
  return {cache,tiles:demand,available,missing,ready,geometry,fallbackPieces}
}
export type CachedGroundState=ReturnType<typeof useCachedGround>
