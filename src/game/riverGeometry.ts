import { project } from './geographicProjection.ts'
import type { LonLat } from './geographyContent.ts'
import type { MapPoint } from './mapProjection.ts'
import { rivers } from './mapGeometry.ts'
import { riverCourses } from './riverCourses.ts'
import { worldRiverCourses } from './worldRiverCourses.ts'
import { linearPathRings } from './physicalLand.ts'

type River = {id:string;name:string;lines:readonly (readonly LonLat[])[];joins?:string}
// Approximate major courses absent from the Natural Earth selection. Vertex
// courses are deliberately editable; mouths are snapped to the displayed main
// channel below, so the two datasets cannot leave dangling confluence gaps.
const authoredRivers: readonly River[] = [
  {id:'seyhan',name:'Sarus (Seyhan)',lines:[[[36.5,38.8],[36.15,38.42],[35.95,38.12],[35.82,37.80],[35.58,37.55],[35.40,37.28],[35.30,37.03],[35.33,36.81],[35.16,36.71]]]},
  {id:'orontes',name:'Orontes',lines:[[[36.20,34.06],[36.36,34.39],[36.58,34.65],[36.71,34.92],[36.75,35.14],[36.57,35.29],[36.36,35.60],[36.31,35.91],[36.25,36.18],[36.39,36.27],[36.18,36.19],[36.10,36.04],[35.96,36.04]]]},
  {id:'greater-zab',name:'Greater Zab',joins:'tigris',lines:[[[44.40,38.65],[44.30,38.35],[44.15,38.05],[44.03,37.70],[43.85,37.43],[44.18,37.15],[44.18,36.94],[43.95,36.70],[43.68,36.61],[43.46,36.28],[43.35,36.06],[43.25,35.95]]]},
  {id:'lesser-zab',name:'Lesser Zab',joins:'tigris',lines:[[[45.97,36.62],[45.62,36.42],[45.48,36.17],[45.02,36.02],[44.89,35.80],[44.78,35.60],[44.36,35.48],[44.18,35.27],[43.88,35.21],[43.54,35.20]]]},
  {id:'diyala',name:'Diyala',joins:'tigris',lines:[[[46.37,35.30],[46.15,35.04],[45.82,34.91],[45.57,34.70],[45.45,34.31],[45.28,34.11],[45.17,33.87],[44.91,33.70],[44.73,33.49],[44.58,33.25]]]},
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
