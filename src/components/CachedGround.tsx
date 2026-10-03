import { memo } from 'react'
import { GROUND_TILE_BLEED, groundTileClip } from '../game/groundTiles'
import type { CachedGroundState } from './useCachedGround'

type Props={ground:CachedGroundState;camera:{x:number;y:number};scale:number;yScale:number;size:{width:number;height:number}}

export const CachedGround=memo(function CachedGround({ground,camera,scale,yScale,size}:Props){
  return <g className="map-context cached-ground" pointerEvents="none" aria-hidden="true" data-cache-bytes={ground.cache.stats.bytes} data-cache-jobs={ground.cache.stats.jobs}>
    {ground.available.map(tile=>{
      const texture=ground.cache.texture(tile.key)!,bleed=GROUND_TILE_BLEED/tile.resolution
      const {left,right,top,bottom}=groundTileClip(tile,camera,scale,yScale,size,window.devicePixelRatio)
      const clipId=`ground-tile-${tile.key.replaceAll(':','-')}`
      // Keep sampling bleed, but crop translucent shading to its own tile.
      return <g key={tile.key}>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse"><rect x={left} y={top} width={right-left} height={bottom-top}/></clipPath>
        <image data-ground-tile={tile.key} href={texture.href} x={tile.x-bleed} y={tile.y-bleed} width={tile.size+2*bleed} height={tile.size+2*bleed} clipPath={`url(#${clipId})`}/>
      </g>
    })}
  </g>
})
