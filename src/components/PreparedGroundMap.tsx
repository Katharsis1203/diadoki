import { memo } from 'react'
import { GROUND_TILE_BLEED, groundTileClip } from '../game/groundTiles'
import { createPreparedGroundPainter } from '../game/preparedGround'
import { coarseGroundKey, PREPARED_GROUND_JOBS } from '../game/preparedGroundPlan'
import { useGroundTileCache } from './useGroundTileCache'
import type { usePreparedGround } from './usePreparedGround'


type Props={prepared:ReturnType<typeof usePreparedGround>;camera:{x:number;y:number};scale:number;yScale:number;size:{width:number;height:number}}
export const PreparedGroundMap=memo(function PreparedGroundMap({prepared,camera,scale,yScale,size}:Props){
  const {tiles,geometry,demand}=prepared
  const {cache}=useGroundTileCache(createPreparedGroundPainter,demand,!!geometry,PREPARED_GROUND_JOBS)
  const ready=cache.ready(tiles)
  if(!geometry)return null
  return <g className="prepared-ground map-context" pointerEvents="none" aria-hidden="true" data-ready={ready} data-cache-bytes={cache.stats.bytes} data-cache-reserved={cache.stats.reservedBytes} data-cache-jobs={cache.stats.jobs} data-cache-active={cache.stats.active} data-cache-failed={cache.stats.failed}>
    {tiles.map(tile=>{
      const fine=cache.texture(tile.key),texture=fine??cache.texture(coarseGroundKey(tile))
      const resolution=fine?tile.resolution:.5,bleed=GROUND_TILE_BLEED/resolution
      const clip=groundTileClip(tile,camera,scale,yScale,size,window.devicePixelRatio),id=`prepared-ground-${tile.key.replaceAll(':','-')}`
      return <g key={tile.key} data-prepared-ground={tile.key}>
        <clipPath id={id}><rect x={clip.left} y={clip.top} width={clip.right-clip.left} height={clip.bottom-clip.top}/></clipPath>
        <g clipPath={`url(#${id})`}>
          {(!texture)&&<g data-prepared-fallback={tile.key}>
            <path className="map-coastal-shallows" d={geometry.coastPath}/><path className="map-land context-land" d={geometry.landPath} fillRule="evenodd" style={{stroke:'none'}}/><path d={geometry.coastPath} fill="none" stroke="#9c9876" strokeWidth=".65"/>
          </g>}
          {texture&&<image data-ground-resolution={resolution} href={texture.href} x={tile.x-bleed} y={tile.y-bleed} width={tile.size+2*bleed} height={tile.size+2*bleed}/>}
        </g>
      </g>
    })}
    {scale>2&&<path d={geometry.coastPath} fill="none" stroke="#9c9876" strokeWidth=".65" strokeLinejoin="round"/>}
  </g>
})
