import { mountainLand, mountainBorderLand, stateLand, provinceLand, landAnchors, landLabels, travelRegions, stateAnchorRegions, mountainPassLines } from './mountainGeometry.ts'
import type { MapPoint } from './mapProjection.ts'

export const polygonLandPath=(polys:readonly (readonly (readonly (readonly number[])[])[])[])=>polys.flat().map(r=>`M${r.map(p=>p.join(',')).join('L')}Z`).join('')
export const mountainLandPath=polygonLandPath(mountainLand)
export const mountainBorderPath=polygonLandPath(mountainBorderLand)
export const stateLandPaths=Object.fromEntries(Object.entries(stateLand).map(([id,m])=>[id,polygonLandPath(m)]))
export const provinceLandPaths=Object.fromEntries(Object.entries(provinceLand).map(([id,m])=>[id,polygonLandPath(m)]))
export const inLandRing=(p:MapPoint,ring:readonly (readonly number[])[])=>{
  let inside=false
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j]
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
  }
  return inside
}
export const inLand=(p:MapPoint,m:readonly (readonly (readonly (readonly number[])[])[])[])=>m.some(poly=>inLandRing(p,poly[0])&&!poly.slice(1).some(h=>inLandRing(p,h)))
export const inMountainTerrain=(p:MapPoint)=>inLand(p,mountainLand)
export const stateGroundAnchor=(id:string)=>landAnchors[id]
export const stateGroundLabel=(id:string)=>landLabels[id]
export const canTravelDirectly=(from:string,to:string)=>!!travelRegions[stateAnchorRegions[from]]?.neighbors.includes(stateAnchorRegions[to])

// Relief symbols leave the same narrow passages open as the travel geometry.
export const inMountainPass=(p:MapPoint)=>mountainPassLines.some(pass=>{
  const [a,b]=pass.points,dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy
  const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length))
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)<5
})
