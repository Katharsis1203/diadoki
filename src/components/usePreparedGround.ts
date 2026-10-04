import { useMemo } from 'react'
import { preparedGroundTiles } from '../game/preparedGroundLayout'
import { createPreparedGroundPainter, preparedGroundTileFromKey } from '../game/preparedGround'
import { useGroundTileCache } from './useGroundTileCache'
import { groundGeometry } from '../game/groundGeometry'
import type { LabelBox, MapLevel } from '../game/mapView'

export function usePreparedGround(view:LabelBox,scale:number,level:MapLevel,enabled:boolean){
  const {left,right,top,bottom}=view
  const ratio=window.devicePixelRatio
  const tiles=useMemo(()=>enabled?preparedGroundTiles([{left,right,top,bottom}],level,scale*Math.min(1.5,ratio)):[],[enabled,left,right,top,bottom,scale,ratio,level])
  const keys=tiles.map(t=>t.key).sort().join('|')
  const demand=useMemo(()=>keys?keys.split('|').map(preparedGroundTileFromKey):[],[keys])
  const textures=useGroundTileCache(createPreparedGroundPainter,demand,enabled)
  // Clip geometry changes only on entering a different chunk window, not every
  // camera pixel or shading profile. Exact source coast/land edges remain live.
  const boundsKey=tiles.length?[Math.min(...tiles.map(t=>t.x)),Math.max(...tiles.map(t=>t.x+t.size)),Math.min(...tiles.map(t=>t.y)),Math.max(...tiles.map(t=>t.y+t.size))].join(':'):''
  const geometry=useMemo(()=>{
    if(!boundsKey)return null
    const [left,right,top,bottom]=boundsKey.split(':').map(Number)
    return groundGeometry({left:left-9,right:right+9,top:top-9,bottom:bottom+9})
  },[boundsKey])
  return {tiles:demand,geometry,...textures}
}
