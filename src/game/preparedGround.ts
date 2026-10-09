import { preparedGroundManifest } from './preparedGroundManifest.ts'
import { PREPARED_GROUND_SIZE } from './preparedGroundLayout.ts'
import type { PreparedGroundTile } from './preparedGroundLayout.ts'
import type { GroundTilePainter } from './groundTiles.ts'
export const preparedGroundHref=(tile:PreparedGroundTile)=>{
  const file=preparedGroundManifest.files[tile.key]
  return file?`${import.meta.env?.BASE_URL??'/'}textures/ground/${file}`:undefined
}
export function preparedGroundTileFromKey(key:string):PreparedGroundTile{
  const [level,r,x,y]=key.split(':')
  return {key,level:level as PreparedGroundTile['level'],resolution:Number(r),x:Number(x)*PREPARED_GROUND_SIZE,y:Number(y)*PREPARED_GROUND_SIZE,size:PREPARED_GROUND_SIZE}
}
export const createPreparedGroundPainter=():GroundTilePainter=>async(tile,signal)=>{
  const url=preparedGroundHref(tile)
  if(!url)throw new Error('Prepared terrain entry missing')
  const response=await fetch(url,{signal})
  if(!response.ok)throw new Error('Prepared terrain download failed')
  const href=URL.createObjectURL(await response.blob()),image=new Image()
  image.src=href
  try{await image.decode();signal?.throwIfAborted()}catch(error){image.src='';URL.revokeObjectURL(href);throw error}
  return {href,bytes:image.naturalWidth*image.naturalHeight*4,release:()=>{image.src='';URL.revokeObjectURL(href)}}
}
