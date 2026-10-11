import { memo } from 'react'
import { GROUND_TILE_BLEED, groundTileClip } from '../game/groundTiles'
import { createPreparedGroundPainter } from '../game/preparedGround'
import { coarseGroundKey, PREPARED_GROUND_JOBS } from '../game/preparedGroundPlan'
import { useGroundTileCache } from './useGroundTileCache'
import type { usePreparedGround } from './usePreparedGround'
import { PixiMapLayer } from './PixiMapLayer'
import type { PixiMapSprite } from './PixiMapLayer'


type Props={prepared:ReturnType<typeof usePreparedGround>;camera:{x:number;y:number};scale:number;yScale:number;size:{width:number;height:number};pixi?:boolean}
export const PreparedGroundMap=memo(function PreparedGroundMap({prepared,camera,scale,yScale,size,pixi=false}:Props){
  const {tiles,geometry,demand}=prepared
  const {cache}=useGroundTileCache(createPreparedGroundPainter,demand,!!geometry,PREPARED_GROUND_JOBS)
  const ready=cache.ready(tiles)
  if(!geometry)return null
  const artwork=tiles.map(tile=>{
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
    })
  const sprites:PixiMapSprite[]=tiles.flatMap(tile=>{
    const fine=cache.texture(tile.key),texture=fine??cache.texture(coarseGroundKey(tile))
    if(!texture)return []
    const resolution=fine?tile.resolution:.5,bleed=GROUND_TILE_BLEED/resolution
    const clip=groundTileClip(tile,camera,scale,yScale,size,window.devicePixelRatio)
    return [{id:tile.key,source:texture.href,x:clip.left,y:clip.top,width:clip.right-clip.left,height:clip.bottom-clip.top,
      frame:{x:(clip.left-tile.x+bleed)*resolution,y:(clip.top-tile.y+bleed)*resolution,
        width:(clip.right-clip.left)*resolution,height:(clip.bottom-clip.top)*resolution}}]
  })
  const view={left:camera.x-size.width/(2*scale),right:camera.x+size.width/(2*scale),
    top:camera.y-size.height/(2*scale*yScale),bottom:camera.y+size.height/(2*scale*yScale)}
  return <g className="prepared-ground map-context" pointerEvents="none" aria-hidden="true" data-ready={ready} data-cache-bytes={cache.stats.bytes} data-cache-reserved={cache.stats.reservedBytes} data-cache-jobs={cache.stats.jobs} data-cache-active={cache.stats.active} data-cache-failed={cache.stats.failed}>
    {pixi&&sprites.length===tiles.length?<PixiMapLayer name="ground" sprites={sprites} view={view} scaleX={scale} scaleY={scale*yScale}>{artwork}</PixiMapLayer>:artwork}
    {scale>2&&<path d={geometry.coastPath} fill="none" stroke="#9c9876" strokeWidth=".65" strokeLinejoin="round"/>}
  </g>
})
