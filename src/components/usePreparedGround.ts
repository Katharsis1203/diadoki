import { useMemo } from 'react'
import { planPreparedGround } from '../game/preparedGroundPlan'
import { groundGeometry } from '../game/groundGeometry'
import { PERSPECTIVE_Y_SCALE } from '../game/mapProjection'
import type { LabelBox, MapLevel } from '../game/mapView'

// Pure scene planning: the image component owns subscriptions and downloads.
export function usePreparedGround(view:LabelBox,scale:number,level:MapLevel,enabled:boolean,overscan=0){
  const {left,right,top,bottom}=view
  const ratio=window.devicePixelRatio
  const plan=useMemo(()=>enabled?planPreparedGround({left,right,top,bottom},
    {left:left+overscan/scale,right:right-overscan/scale,top:top+overscan/(scale*PERSPECTIVE_Y_SCALE),bottom:bottom-overscan/(scale*PERSPECTIVE_Y_SCALE)},
    level,scale*Math.min(1.5,ratio)):{tiles:[],demand:[],prefetch:[],bytes:0},[enabled,left,right,top,bottom,scale,ratio,level,overscan])
  const {tiles}=plan
  // Clip geometry changes only on entering a different chunk window, not every
  // camera pixel or shading profile. Exact source coast/land edges remain live.
  const boundsKey=tiles.length?[Math.min(...tiles.map(t=>t.x)),Math.max(...tiles.map(t=>t.x+t.size)),Math.min(...tiles.map(t=>t.y)),Math.max(...tiles.map(t=>t.y+t.size))].join(':'):''
  const geometry=useMemo(()=>{
    if(!boundsKey)return null
    const [left,right,top,bottom]=boundsKey.split(':').map(Number)
    return groundGeometry({left:left-9,right:right+9,top:top-9,bottom:bottom+9})
  },[boundsKey])
  return useMemo(()=>({...plan,geometry}),[plan,geometry])
}
