import { project } from './data.ts'
import { terrainFeatures } from './terrainContent.ts'
import type { TerrainFeature } from './terrainContent.ts'
import { coreRangeGround, inCoreWater } from './terrainBackbone.ts'
import { pointBounds } from './mapViewport.ts'

export const terrainWashColors = { mountain:'#786956',hill:'#998258',desert:'#b98a41',steppe:'#92945c',forest:'#557443',palm:'#657e44',marsh:'#588e7d',fertile:'#5e8451',coastal:'#7d9656' }

export function corridorWash(feature: TerrainFeature) {
  const points = feature.points.map(project)
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  const total = lengths.reduce((sum, length) => sum + length, 0)
  const step = feature.width * .45, phase = points[0][0] * .13 + points[0][1] * .07
  const marks: { x: number; y: number; rx: number; ry: number; rotation: number }[] = []
  let walked = 0, next = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = lengths[i - 1]
    if (!length) continue
    const dx = (b[0] - a[0]) / length, dy = (b[1] - a[1]) / length
    while (next <= walked + length) {
      const t = (next - walked) / length, progress = next / total
      const taper = .38 + .62 * Math.sin(Math.PI * progress) ** .45
      const width = feature.width * taper * (1 + .15 * Math.sin(progress * 13 + phase))
      const drift = Math.sin(progress * 17 + phase) * feature.width * .09
      marks.push({ x: a[0] + t * (b[0] - a[0]) - dy * drift, y: a[1] + t * (b[1] - a[1]) + dx * drift,
        rx: width * .8, ry: width * .6, rotation: Math.atan2(dy, dx) * 180 / Math.PI })
      next += step
    }
    walked += length
  }
  return marks
}

const brushBounds=(marks:readonly {x:number;y:number;rx:number;ry:number}[])=>pointBounds(marks.flatMap(p=>{
  const radius=Math.max(p.rx,p.ry)
  return [[p.x-radius,p.y-radius],[p.x+radius,p.y+radius]] as const
}))
export const terrainGroundBrushes=terrainFeatures.filter(f=>f.detail==='regional'&&!['mountain','hill'].includes(f.type)).map(feature=>{
  const marks=corridorWash(feature)
  return {feature,marks,bounds:brushBounds(marks)}
})
export const coreGroundBrushes=coreRangeGround.map(({id,mapPoints,width})=>{
  const marks=mapPoints.flatMap((p,i)=>{
    if(!i)return [p]
    const a=mapPoints[i-1],count=Math.max(1,Math.ceil(Math.hypot(p[0]-a[0],p[1]-a[1])/(width*.5)))
    return Array.from({length:count},(_,j)=>[a[0]+(p[0]-a[0])*(j+1)/count,a[1]+(p[1]-a[1])*(j+1)/count] as const)
  }).map(([x,y],i)=>({x,y,rx:width*(.72+.08*Math.sin(i*1.8)),ry:width*.62,rotation:0})).filter(p=>!inCoreWater([p.x,p.y],width*.35))
  return {id,marks,bounds:brushBounds(marks)}
})
