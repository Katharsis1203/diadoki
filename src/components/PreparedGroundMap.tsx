import { GROUND_TILE_BLEED, groundTileClip } from '../game/groundTiles'
import { TerrainLayer } from './TerrainLayer'
import { CoreTerrainGround } from './CoreTerrain'
import { BabyloniaSurface } from './BabyloniaSurface'
import { PhysicalFeatures } from './MapLayers'
import { usePreparedGround } from './usePreparedGround'
import type { MapLevel } from '../game/mapView'


type Props={prepared:ReturnType<typeof usePreparedGround>;level:MapLevel;camera:{x:number;y:number};scale:number;yScale:number;size:{width:number;height:number}}
export function PreparedGroundMap({prepared,level,camera,scale,yScale,size}:Props){
  const {tiles,geometry,ready,cache}=prepared
  if(!geometry)return null
  return <g className="prepared-ground map-context" pointerEvents="none" aria-hidden="true" data-ready={ready} data-cache-bytes={cache.stats.bytes} data-cache-jobs={cache.stats.jobs}>
    {tiles.map(tile=>{
      const texture=cache.texture(tile.key),bleed=GROUND_TILE_BLEED/tile.resolution
      const view={left:tile.x,right:tile.x+tile.size,top:tile.y,bottom:tile.y+tile.size}
      const clip=groundTileClip(tile,camera,scale,yScale,size,window.devicePixelRatio),id=`prepared-ground-${tile.key.replaceAll(':','-')}`
      return <g key={tile.key} data-prepared-ground={tile.key}>
        <clipPath id={id}><rect x={clip.left} y={clip.top} width={clip.right-clip.left} height={clip.bottom-clip.top}/></clipPath>
        <g clipPath={`url(#${id})`}>
          {(!texture)&&<g data-prepared-fallback={tile.key}>
            <path className="map-coastal-shallows" d={geometry.coastPath}/><path className="map-land context-land" d={geometry.landPath} fillRule="evenodd" style={{stroke:'none'}}/><path d={geometry.coastPath} fill="none" stroke="#9c9876" strokeWidth=".65"/>
            <TerrainLayer zoom={1} scale={scale} override={level} view={view} groundOnly/>
            <CoreTerrainGround view={view}/><BabyloniaSurface level={level} groundOnly/><PhysicalFeatures view={view} groundOnly/>
          </g>}
          {texture&&<image href={texture.href} x={tile.x-bleed} y={tile.y-bleed} width={tile.size+2*bleed} height={tile.size+2*bleed}/>}
        </g>
      </g>
    })}
    {scale>2&&<path d={geometry.coastPath} fill="none" stroke="#9c9876" strokeWidth=".65" strokeLinejoin="round"/>}
  </g>
}
