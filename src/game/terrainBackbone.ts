import { project } from './data.ts'
import type { LonLat } from './geographyContent.ts'
import { babyloniaRanges } from './babyloniaRanges.ts'
import { rivers } from './mapGeometry.ts'
import type { MapPoint } from './mapProjection.ts'
import { riverCourses } from './riverCourses.ts'
import { worldRidgeSections } from './worldTerrain.ts'
import { worldRiverCourses } from './worldRiverCourses.ts'
import { isPhysicalLand, linearPathRings, physicalLakes, pointInPhysicalRing } from './physicalLand.ts'
import { pointBounds } from './mapViewport.ts'

// Major geographic divisions, independent of province polygons. A section is a
// continuous ridge; separate sections leave substantial valley/pass openings.
// These are editable campaign-scale axes, not surveyed administrative borders.
export type RidgeSection = {id:string;name:string;system:string;axis:readonly LonLat[];width:number;scale:number}
const regionalRidgeSections: readonly RidgeSection[] = [
  {id:'pontic-west',name:'Western Pontic Mountains',system:'pontic',axis:[[31.4,40.7],[32.1,40.6],[33.0,40.35],[33.8,40.22],[34.5,40.30]],width:18,scale:.64},
  {id:'pontic-central',name:'Central Pontic Mountains',system:'pontic',axis:[[35.2,40.12],[35.8,40.02],[36.4,39.98],[37.1,40.07]],width:17,scale:.63},
  {id:'pontic-east',name:'Eastern Pontic Mountains',system:'pontic',axis:[[37.5,40.35],[38.2,40.47],[39.0,40.60],[39.8,40.67],[40.5,40.80],[41.3,40.93]],width:20,scale:.77},
  {id:'taurus-west',name:'Western Taurus',system:'taurus',axis:[[31.4,36.75],[32.1,37.05],[32.9,37.28],[33.7,37.43],[34.35,37.43]],width:23,scale:.76},
  {id:'taurus-central',name:'Central Taurus',system:'taurus',axis:[[34.9,37.48],[35.55,37.70],[36.2,37.92],[36.8,38.05]],width:22,scale:.81},
  {id:'taurus-east',name:'Eastern Taurus',system:'taurus',axis:[[37.25,38.25],[37.9,38.60],[38.5,38.84]],width:21,scale:.76},
  {id:'amanus',name:'Amanus Mountains',system:'amanus',axis:[[36.65,37.55],[36.53,37.10],[36.40,36.65],[36.22,36.25]],width:12,scale:.58},
  {id:'armenian-west',name:'Western Armenian Highlands',system:'armenia',axis:[[38.8,39.32],[39.35,39.60],[40.05,39.65],[40.75,39.52]],width:23,scale:.79},
  {id:'armenian-north',name:'Northern Armenian Highlands',system:'armenia',axis:[[40.5,40.45],[41.25,40.48],[41.95,40.50],[42.65,40.46]],width:22,scale:.75},
  {id:'ararat-massif',name:'Ararat uplands',system:'armenia',axis:[[43.4,39.52],[43.95,39.70],[44.45,39.70]],width:22,scale:.92},
  {id:'van-west',name:'Van western uplands',system:'armenia',axis:[[40.05,38.05],[40.7,38.13],[41.3,38.27],[41.8,38.43]],width:19,scale:.68},
  {id:'van-south',name:'Van southern uplands',system:'armenia',axis:[[42.45,37.80],[43.0,37.80],[43.65,37.93],[44.2,38.10]],width:22,scale:.81},
  {id:'zagros-upper',name:'Northern Zagros',system:'zagros',axis:[[44.45,37.60],[44.80,37.32],[45.10,37.02],[45.28,36.70]],width:23,scale:.81},
  {id:'zagros-zab',name:'Zagros between the Zab valleys',system:'zagros',axis:[[44.55,36.72],[44.88,36.43],[45.18,36.22],[45.46,36.02]],width:21,scale:.73},
  {id:'media-north',name:'Atropatene uplands',system:'media',axis:[[46.25,38.05],[46.70,37.80],[47.15,37.45],[47.60,37.13]],width:23,scale:.72},
  {id:'media-east',name:'Eastern Median uplands',system:'media',axis:[[48.1,36.40],[48.55,36.00],[49.15,35.63],[49.65,35.32]],width:19,scale:.60},
  {id:'alborz-west',name:'Western Alborz',system:'alborz',axis:[[49.8,36.55],[50.5,36.40],[51.15,36.13],[51.8,35.96]],width:23,scale:.77},
  {id:'lebanon-north',name:'Northern Lebanon Mountains',system:'lebanon',axis:[[36.18,34.72],[36.04,34.44],[35.90,34.13]],width:10,scale:.47},
  {id:'lebanon-south',name:'Southern Lebanon Mountains',system:'lebanon',axis:[[35.81,33.92],[35.65,33.66],[35.49,33.38]],width:10,scale:.47},
  {id:'anti-lebanon',name:'Anti-Lebanon',system:'anti-lebanon',axis:[[36.65,34.05],[36.46,33.78],[36.24,33.48],[35.98,33.20]],width:10,scale:.48},
]
export const ridgeSections:readonly RidgeSection[]=[...regionalRidgeSections,...worldRidgeSections]

type River = {id:string;name:string;lines:readonly (readonly LonLat[])[];joins?:string}
// Approximate major courses absent from the Natural Earth selection. Vertex
// courses are deliberately editable; mouths are snapped to the displayed main
// channel below, so the two datasets cannot leave dangling confluence gaps.
const authoredRivers: readonly River[] = [
  {id:'seyhan',name:'Sarus (Seyhan)',lines:[[[36.5,38.8],[36.15,38.42],[35.95,38.12],[35.82,37.80],[35.58,37.55],[35.40,37.28],[35.30,37.03],[35.33,36.81],[35.16,36.71]]]},
  {id:'orontes',name:'Orontes',lines:[[[36.20,34.06],[36.36,34.39],[36.58,34.65],[36.71,34.92],[36.75,35.14],[36.57,35.29],[36.36,35.60],[36.31,35.91],[36.25,36.18],[36.39,36.27],[36.18,36.19],[36.10,36.04],[35.96,36.04]]]},
  {id:'greater-zab',name:'Greater Zab',joins:'tigris',lines:[[[44.40,38.65],[44.30,38.35],[44.15,38.05],[44.03,37.70],[43.85,37.43],[44.18,37.15],[44.18,36.94],[43.95,36.70],[43.68,36.61],[43.46,36.28],[43.35,36.06],[43.25,35.95]]]},
  {id:'lesser-zab',name:'Lesser Zab',joins:'tigris',lines:[[[45.97,36.62],[45.62,36.42],[45.48,36.17],[45.02,36.02],[44.89,35.80],[44.78,35.60],[44.36,35.48],[44.18,35.27],[43.88,35.21],[43.54,35.20]]]},
  {id:'diyala',name:'Diyala',joins:'tigris',lines:[[[46.37,35.30],[46.15,35.04],[45.82,34.91],[45.57,34.70],[45.70,34.52],[45.45,34.31],[45.28,34.11],[45.17,33.87],[44.91,33.70],[44.73,33.49],[44.58,33.25]]]},
  {id:'karun',name:'Karun',joins:'shatt-al-arab',lines:[[[50.08,32.43],[49.84,32.23],[49.52,31.94],[49.44,31.70],[49.15,31.75],[48.98,32.07],[48.89,32.20],[48.86,32.04],[48.82,31.84],[48.65,31.65],[48.68,31.34],[48.58,31.13],[48.41,30.84],[48.22,30.64],[48.16,30.43]]]},
  {id:'kabul',name:'Kabul',joins:'indus',lines:[[[68.5,34.7],[68.7,34.4],[69.1,34.5],[69.7,34.55],[70.1,34.4],[70.5,34.45],[71.1,34.16],[71.5,34.02],[72.0,34.1],[72.25,34.0],[72.24,33.9]]]},
]
const pathLines=linearPathRings
export const distanceToSegment = (p:MapPoint,a:MapPoint,b:MapPoint) => {
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy
  const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0
  const point:MapPoint=[a[0]+t*dx,a[1]+t*dy]
  return {point,distance:Math.hypot(p[0]-point[0],p[1]-point[1])}
}
const pathFor = (lines:readonly (readonly MapPoint[])[]) => lines.map(line=>`M${line.map(p=>p.map(n=>+n.toFixed(3)).join(',')).join('L')}`).join('')
type MapRiver = {id:string;name:string;path:string;mapLines:readonly (readonly MapPoint[])[];width:number;source:'existing'|'natural-earth'|'authored';joins?:string}
const existingRivers:MapRiver[]=rivers.map(r=>({...r,id:r.name.toLowerCase(),mapLines:pathLines(r.path),width:1.35,source:'existing'}))
const riverParents:Record<string,string>={'upper-euphrates':'euphrates','upper-tigris':'tigris',murat:'upper-euphrates','shatt-al-arab':'tigris'}
const importedCourses:readonly River[]=[...riverCourses,...worldRiverCourses]
const importedRivers:MapRiver[]=importedCourses.map(r=>({id:r.id,name:r.name,mapLines:r.lines.map(l=>l.map(project)),path:'',width:['shatt-al-arab','nile','indus','ganges'].includes(r.id)?1.35:r.id.startsWith('upper-')?1.2:1.05,source:'natural-earth',joins:r.joins??riverParents[r.id]}))
const newRivers:MapRiver[]=[...importedRivers,...authoredRivers.map(r=>({...r,mapLines:r.lines.map(l=>l.map(project)),path:'',width:.95,source:'authored' as const}))]
// Parent channels precede their tributaries. Snap only the nearest endpoint;
// upstream tributary sources retain their authored/dataset positions.
for(const river of newRivers){
  const parent=[...existingRivers,...newRivers].find(r=>r.id===river.joins)
  if(parent){
    const segments=parent.mapLines.flatMap(l=>l.slice(1).map((b,i)=>[l[i],b] as const))
    const ends=river.mapLines.flatMap((l,i)=>[0,l.length-1].map(j=>({i,j,p:l[j]})))
    const nearest=ends.flatMap(end=>segments.map(([a,b])=>({...end,...distanceToSegment(end.p,a,b)}))).toSorted((a,b)=>a.distance-b.distance)[0]
    if(nearest.distance>12)throw new Error(`${river.id}: parent channel is too distant; supply the missing river reach`)
    river.mapLines=river.mapLines.map((l,i)=>l.map((p,j)=>i===nearest.i&&j===nearest.j?nearest.point:p))
  }
  river.path=pathFor(river.mapLines)
}
export const coreRivers: readonly MapRiver[] = [...existingRivers,...newRivers]
export const coreRiverFootprints=coreRivers.map(r=>({river:r,bounds:pointBounds(r.mapLines.flat())}))
export const riverSegments=coreRivers.flatMap(r=>r.mapLines.flatMap(l=>l.slice(1).map((b,i)=>[l[i],b] as const)))
const lakeRings=physicalLakes.flatMap(l=>pathLines(l.path))
const waterSegments=riverSegments.map(([a,b])=>({a,b,left:Math.min(a[0],b[0]),right:Math.max(a[0],b[0]),top:Math.min(a[1],b[1]),bottom:Math.max(a[1],b[1])}))
export const inCoreWater=(p:MapPoint,clearance=6)=>!isPhysicalLand(p)||lakeRings.some(r=>pointInPhysicalRing(p,r))||waterSegments.some(s=>
  p[0]>=s.left-clearance&&p[0]<=s.right+clearance&&p[1]>=s.top-clearance&&p[1]<=s.bottom+clearance&&distanceToSegment(p,s.a,s.b).distance<clearance)

// Deterministic map-space sampling: no random scatter or pan/zoom-dependent
// density. River gaps express valleys; shoulders follow the ridge normal.
export const backbonePeaks = ridgeSections.flatMap(section=>{
  const points=section.axis.map(project), peaks:{id:string;rangeId:string;position:MapPoint;scale:number;variant:0|1|2;normal:MapPoint}[]=[]
  let walked=0,next=0,index=0
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)
    const normal:MapPoint=[-dy/length,dx/length]
    while(next<=walked+length){
      const t=(next-walked)/length,drift=Math.sin(index*1.8)*1.7
      const position:MapPoint=[a[0]+t*dx+normal[0]*drift,a[1]+t*dy+normal[1]*drift]
      if(!inCoreWater(position,7))peaks.push({id:`${section.id}-peak-${index}`,rangeId:section.id,position,normal,
        scale:section.scale*(.83+.19*Math.sin(index*2.3+.8)),variant:(index%3) as 0|1|2})
      next+=9.5+1.8*Math.sin(index*1.7);index++
    }
    walked+=length
  }
  return peaks
})
export const coreRangeGround = [
  ...ridgeSections.map(s=>({...s,mapPoints:s.axis.map(project)})),
  ...babyloniaRanges.map(s=>({id:s.id,name:'Zagros Mountains',system:'zagros',axis:s.peaks.map(([lon,lat])=>[lon,lat] as LonLat),mapPoints:s.peaks.map(([lon,lat])=>project([lon,lat])),width:20,scale:.7})),
]
