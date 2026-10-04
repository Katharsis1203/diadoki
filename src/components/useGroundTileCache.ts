import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { GroundTileCache } from '../game/groundTiles'
import type { GroundTile, GroundTilePainter } from '../game/groundTiles'

// Shared lifecycle/budget for prepared files and runtime comparison textures.
export function useGroundTileCache(createPainter:()=>GroundTilePainter,demand:readonly GroundTile[],enabled:boolean){
  const [cache]=useState(()=>new GroundTileCache(createPainter()))
  useEffect(()=>{if(enabled)cache.activate();else cache.dispose();return ()=>cache.dispose()},[cache,enabled])
  useEffect(()=>cache.setDemand(demand),[cache,demand])
  const subscribe=useCallback((listener:()=>void)=>{
    let frame=0
    const unsubscribe=cache.subscribe(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;listener()})})
    return ()=>{unsubscribe();if(frame)cancelAnimationFrame(frame)}
  },[cache])
  useSyncExternalStore(subscribe,()=>cache.version,()=>0)
  const available:GroundTile[]=[],missing:GroundTile[]=[]
  for(const tile of demand)(cache.texture(tile.key)?available:missing).push(tile)
  return {cache,available,missing,ready:enabled&&demand.length>0&&missing.length===0}
}
