import type { MapPoint } from './mapProjection.ts'

// Sample a closed geographic contour once offline. Both sides are clipped and
// noded from this same chain, so rounded borders retain shared vertices.
export function roundedBorder(path:readonly MapPoint[]):MapPoint[] {
  return path.flatMap((p1,i)=>{
    const p0=path[(i+path.length-1)%path.length],p2=path[(i+1)%path.length],p3=path[(i+2)%path.length]
    return Array.from({length:5},(_,j)=>{const t=j/5;return p1.map((v,k)=>+(.5*(2*v+(-p0[k]+p2[k])*t+(2*p0[k]-5*v+4*p2[k]-p3[k])*t*t+(-p0[k]+3*v-3*p2[k]+p3[k])*t*t*t)).toFixed(6)) as [number,number]})
  })
}

// Smooth a shared cut without letting remote mask-closing corners influence it.
export function roundedOpenBorder(path:readonly MapPoint[]):MapPoint[] {
  const expanded=[path[0],...path,path[path.length-1]]
  return path.slice(0,-1).flatMap((p1,i)=>{
    const p0=expanded[i],p2=expanded[i+2],p3=expanded[i+3]
    return Array.from({length:5},(_,j)=>{const t=j/5;return p1.map((v,k)=>+(.5*(2*v+(-p0[k]+p2[k])*t+(2*p0[k]-5*v+4*p2[k]-p3[k])*t*t+(-p0[k]+3*v-3*p2[k]+p3[k])*t*t*t)).toFixed(6)) as [number,number]})
  }).concat([[...path[path.length-1]] as [number,number]])
}
