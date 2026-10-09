import { mountainRegionLand } from './mountainGeometry.ts'
import { polygonLandPath } from './mountainTerrain.ts'
import { stateLandPaths, provinceLandPaths } from './mountainTerrain.ts'
import { theatreDistrictById } from './theatreGeography.ts'
import { project } from './data.ts'
import { groundGeometry } from './groundGeometry.ts'
import { terrainGroundBrushes, coreGroundBrushes, terrainWashColors, terrainWashStyles, terrainWashKey, riverGroundStyle } from './groundBrushes.ts'
import { earthPatches, surfaceColors, surfaceOpacity } from './groundSurface.ts'
import { coreRiverFootprints } from './terrainBackbone.ts'
import { boundsIntersect } from './mapViewport.ts'
import { GROUND_TILE_BLEED } from './groundTiles.ts'
import type { GroundTile } from './groundTiles.ts'
import type { LabelBox } from './mapView.ts'

// One source of colour/lighting for runtime fallback and generated artwork.
const groundClips=new Map<string,Path2D>()
let rivers:({path:Path2D}&typeof coreRiverFootprints[number])[]|undefined
export function paintGroundCanvas(tile:GroundTile){
  const canvas=document.createElement('canvas'),pixels=Math.round(tile.size*tile.resolution)+2*GROUND_TILE_BLEED
  canvas.width=canvas.height=pixels
  const ctx=canvas.getContext('2d')
  if(!ctx)throw new Error('Canvas 2D unavailable')
  rivers??=coreRiverFootprints.map(r=>({...r,path:new Path2D(r.river.path)}))
  const bleed=GROUND_TILE_BLEED/tile.resolution
  const box:LabelBox={left:tile.x-bleed,right:tile.x+tile.size+bleed,top:tile.y-bleed,bottom:tile.y+tile.size+bleed}
  // Include the width of coastal shallows beyond the bitmap window.
  const geometry=groundGeometry({left:box.left-6,right:box.right+6,top:box.top-6,bottom:box.bottom+6})
  const land=new Path2D(geometry.landPath),coast=new Path2D(geometry.coastPath)
  ctx.scale(tile.resolution,tile.resolution);ctx.translate(-box.left,-box.top)
  ctx.lineJoin='round';ctx.lineCap='round'
  ctx.strokeStyle='#c4ddd4';ctx.globalAlpha=.52;ctx.lineWidth=8;ctx.stroke(coast);ctx.globalAlpha=1
  const landWash=ctx.createLinearGradient(200,80,600,700)
  landWash.addColorStop(0,'#e9d8b0');landWash.addColorStop(.55,'#ddc393');landWash.addColorStop(1,'#d5b37d')
  ctx.fillStyle=landWash
  ctx.fill(land,'evenodd');ctx.strokeStyle='#9c9876';ctx.lineWidth=.65;ctx.stroke(coast)
  ctx.save();ctx.clip(land,'evenodd')
  const ellipse=(x:number,y:number,rx:number,ry:number,rotation:number,color:string,stops:readonly (readonly [number,number])[],opacity=1)=>{
    // Reject off-tile brushes before creating gradients.
    const radius=Math.max(rx,ry)
    if(x+radius<box.left||x-radius>box.right||y+radius<box.top||y-radius>box.bottom)return
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation*Math.PI/180);ctx.scale(rx,ry)
    const gradient=ctx.createRadialGradient(0,0,0,0,0,1)
    for(const [offset,alpha] of stops)gradient.addColorStop(offset,`${color}${Math.round(alpha*255).toString(16).padStart(2,'0')}`)
    ctx.fillStyle=gradient;ctx.globalAlpha=opacity;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore()
  }
  const strength=tile.level==='dominion'?.9:tile.level==='state'?7/6:1
  if(tile.shading!==false){
    for(const {feature,marks,bounds} of terrainGroundBrushes){
      if(!boundsIntersect(bounds,box))continue
      const {color,opacity}=terrainWashStyles[terrainWashKey(feature)]
      ctx.save()
      const clipId=feature.terrainRegionId?`terrain:${feature.terrainRegionId}`:feature.provinceId?`province:${feature.provinceId}`:feature.stateId?`state:${feature.stateId}`:undefined
      if(clipId){
        let clip=groundClips.get(clipId)
        if(!clip){
          const path=feature.terrainRegionId?polygonLandPath(mountainRegionLand[feature.terrainRegionId]):feature.provinceId?provinceLandPaths[feature.provinceId]:stateLandPaths[feature.stateId!]??theatreDistrictById.get(feature.stateId!)?.path
          if(!path)throw new Error(`Unknown terrain clip ${clipId}`)
          clip=new Path2D(path);groundClips.set(clipId,clip)
        }
        ctx.clip(clip,'evenodd')
      }
      for(const p of marks)ellipse(p.x,p.y,p.rx,p.ry,p.rotation,color,[[0,opacity],[.35,opacity*.65],[.7,opacity*.18],[1,0]],feature.opacity*strength)
      ctx.restore()
    }
    for(const ridge of coreGroundBrushes.filter(r=>boundsIntersect(r.bounds,box)))for(const p of ridge.marks)ellipse(p.x,p.y,p.rx,p.ry,0,terrainWashColors.mountain,[[0,.25],[.35,.25*.65],[.7,.25*.18],[1,0]],.9)
    for(const p of earthPatches){const [x,y]=project(p.at),opacity=surfaceOpacity[p.color];ellipse(x,y,p.rx,p.ry,p.angle,surfaceColors[p.color],[[0,opacity],[.4,opacity*6/11],[.75,opacity*7/44],[1,0]])}
    for(const {river,path,bounds} of rivers){
      const style=riverGroundStyle(river),margin=style.width
      if(!boundsIntersect({left:bounds.left-margin,right:bounds.right+margin,top:bounds.top-margin,bottom:bounds.bottom+margin},box))continue
      ctx.save();ctx.strokeStyle=style.color
      if(style.blur)ctx.filter=`blur(${style.blur*tile.resolution}px)`
      ctx.lineWidth=style.width;ctx.globalAlpha=style.opacity;ctx.stroke(path)
      if(style.innerWidth){ctx.lineWidth=style.innerWidth;ctx.globalAlpha=style.innerOpacity;ctx.stroke(path)}
      ctx.restore()
    }
  }
  ctx.restore()
  return {canvas,ctx,land,box}
}
