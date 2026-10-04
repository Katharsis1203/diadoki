import { paintGroundCanvas } from './groundPaint.ts'
import type { GroundTilePainter } from './groundTiles.ts'

// Runtime/authoring comparison and bitmap-error fallback. The default map uses
// prepared ground directly and does not encode or decode these tiles while panning.
export const createGroundTilePainter=():GroundTilePainter=>async tile=>{
  const {canvas}=paintGroundCanvas(tile),pixels=canvas.width
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Ground tile encoding failed')),'image/png'))
  const href=URL.createObjectURL(blob),image=new Image()
  image.src=href
  try{await image.decode()}catch(error){URL.revokeObjectURL(href);throw error}
  canvas.width=canvas.height=0
  return {href,bytes:pixels*pixels*4,release:()=>{image.src='';URL.revokeObjectURL(href)}}
}
