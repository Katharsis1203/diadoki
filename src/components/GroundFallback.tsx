import { memo } from 'react'
import { groundTileClip } from '../game/groundTiles'
import type { CachedGroundState } from './useCachedGround'
import type { MapLevel } from '../game/mapView'
import { ContextLand, PhysicalFeatures } from './MapLayers'
import { TerrainLayer } from './TerrainLayer'
import { CoreTerrainGround } from './CoreTerrain'
import { BabyloniaSurface } from './BabyloniaSurface'

type Props={ground:CachedGroundState;camera:{x:number;y:number};scale:number;yScale:number;size:{width:number;height:number};level:MapLevel;shading:boolean}
// Ready images remain mounted. Only missing tile rectangles draw vector ground
// while they load; interaction, rivers and scenery remain separate live layers.
export const GroundFallback=memo(function GroundFallback({ground,camera,scale,yScale,size,level,shading}:Props){
  return <g className="ground-tile-fallback" pointerEvents="none" aria-hidden="true">
    {ground.fallbackPieces.map(({tile,geometry})=>{
      const {left,right,top,bottom}=groundTileClip(tile,camera,scale,yScale,size,window.devicePixelRatio)
      const clipId=`fallback-${tile.key.replaceAll(':','-')}`,view={left:tile.x,right:tile.x+tile.size,top:tile.y,bottom:tile.y+tile.size}
      return <g key={tile.key} data-ground-fallback={tile.key}>
        <clipPath id={clipId}><rect x={left} y={top} width={right-left} height={bottom-top}/></clipPath>
        <g clipPath={`url(#${clipId})`}><ContextLand geometry={geometry}/>
          {shading&&<><TerrainLayer zoom={1} scale={scale} override={level} view={view} groundOnly/>
            <CoreTerrainGround view={view}/><BabyloniaSurface level={level} groundOnly/>
            <PhysicalFeatures view={view} groundOnly/></>}
        </g>
      </g>
    })}
  </g>
})
