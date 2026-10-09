import { mapProjection } from './mapProjection.ts'
import { mapBounds } from './worldTerrain.ts'

export type MapLevel = 'dominion' | 'province' | 'state'
export const mapLevel = (zoom: number, override: MapLevel | null = null): MapLevel => override ?? (zoom < 1.35 ? 'dominion' : zoom >= 3.8 ? 'state' : 'province')
export const MAP_WIDTH = 850
export const MAP_HEIGHT = 650
export const MIN_ZOOM = .2
export const MAX_ZOOM = 7
export const INITIAL_CAMERA = { x: 584, y: 497, zoom: 2.3 }
export type Camera = typeof INITIAL_CAMERA
export type MapLabel = { id: string; text: string; x: number; y: number; size: number; priority: number; kind: 'state' | 'province' | 'city' | 'dominion' | 'local' | 'terrain'; alternatives?: readonly {x:number;y:number}[] }
export type LabelBox = {left:number;right:number;top:number;bottom:number}
export function worldOverviewCamera(viewport:{width:number;height:number},perspective=false):Camera {
  const projection=mapProjection(perspective)
  const [left,top]=projection.point([mapBounds.left,mapBounds.top]),[right,bottom]=projection.point([mapBounds.right,mapBounds.bottom])
  const base=Math.min(viewport.width/MAP_WIDTH,viewport.height/MAP_HEIGHT)
  const insetX=viewport.width<600?24:65,insetTop=viewport.width<600?140:115,insetBottom=viewport.width<600?140:130
  const zoom=Math.max(MIN_ZOOM,Math.min(.6,(viewport.width-2*insetX)/(right-left+60)/base,
    Math.max(130,viewport.height-insetTop-insetBottom)/(bottom-top+60)/base))
  const centreY=(insetTop+viewport.height-insetBottom)/2
  const [x,y]=projection.inverse([(left+right)/2,(top+bottom)/2-(centreY-viewport.height/2)/(base*zoom)])
  return {x,y,zoom}
}
// Constrain the visible camera, including SVG meet scaling and ground tilt.
// If a whole axis fits on screen, keep it centred rather than panning into empty
// margins. Otherwise allow a small screen-space parchment margin at the edge.
export function clampMapCamera(camera:Camera,viewport:{width:number;height:number},perspective=false):Camera {
  const scale=Math.min(viewport.width/MAP_WIDTH,viewport.height/MAP_HEIGHT)*camera.zoom
  const yScale=mapProjection(perspective).yScale
  const axis=(value:number,min:number,max:number,half:number,padding:number)=>{
    if(max-min<=2*half)return (min+max)/2
    const lo=min+half-padding,hi=max-half+padding
    return Math.max(lo,Math.min(hi,value))
  }
  return {...camera,
    x:axis(camera.x,mapBounds.left,mapBounds.right,viewport.width/(2*scale),32/scale),
    y:axis(camera.y,mapBounds.top,mapBounds.bottom,viewport.height/(2*scale*yScale),32/(scale*yScale)),
  }
}
export const boxesOverlap = (a: LabelBox, b: LabelBox) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
const smooth = (a:number,b:number,value:number) => {const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t)}
export function terrainWeights(zoom:number,override?:MapLevel) {
  if(override) return {macro:override==='dominion'?1:0,regional:override==='province'?1:0,local:override==='state'?1:0}
  const macro=1-smooth(1.1,1.85,zoom),local=smooth(3.2,4.3,zoom)
  return {macro,regional:1-macro-local,local}
}

// Fit actual child geometry into the usable part of the screen. The SVG uses
// meet scaling, so portrait devices need a different fit from wide desktops.
export function focusCamera(shapes:readonly string[],viewport:{width:number;height:number},panel=false,perspective=false):Camera {
  const projection=mapProjection(perspective)
  const points=shapes.flatMap(shape=>shape.split(' ').map(p=>projection.point(p.split(',').map(Number) as [number,number])))
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys)
  const base=Math.min(viewport.width/MAP_WIDTH,viewport.height/MAP_HEIGHT),mobile=viewport.width<600
  const insetX=mobile?32:85,insetTop=mobile?145:115,insetBottom=mobile?(panel?viewport.height*.43:135):135
  const insetRight=panel&&!mobile?370:insetX
  const usableWidth=Math.max(180,viewport.width-insetX-insetRight),usableHeight=Math.max(155,viewport.height-insetTop-insetBottom)
  const zoom=Math.max(1.4,Math.min(5.5,Math.min(usableWidth/(right-left+28),usableHeight/(bottom-top+28))/base))
  const screenCenterX=(insetX+viewport.width-insetRight)/2,screenCenterY=(insetTop+viewport.height-insetBottom)/2
  const [x,y]=projection.inverse([(left+right)/2-(screenCenterX-viewport.width/2)/(base*zoom),(top+bottom)/2-(screenCenterY-viewport.height/2)/(base*zoom)])
  return {x,y,zoom}
}
export const labelLines = (text: string) => text.includes('\n') ? text.split('\n') : text.includes(' ') && text.length > 12 ? [text.slice(0, text.lastIndexOf(' ')), text.slice(text.lastIndexOf(' ') + 1)] : [text]
// Estimate in screen pixels, then compare in map space. More district names fit
// as the camera zooms in; adjacent city/state labels never pile on one another.
export function visibleLabels(labels: readonly MapLabel[], scale: number, obstacles:readonly LabelBox[] = [], relief:readonly LabelBox[] = []) {
  const occupied: LabelBox[] = [...obstacles]
  const result:MapLabel[]=[]
  for (const label of [...labels].sort((a,b) => b.priority-a.priority)) {
    const lines=labelLines(label.text), width=Math.max(...lines.map(l=>l.length))*label.size*(label.kind==='dominion'?.72:.56)/scale
    const height=lines.length*label.size*1.15/scale
    const verticalPad=label.kind==='dominion'?3/scale:0
    const candidates=[label,...label.alternatives??[]].map(at=>({at,box:{left:at.x-width/2-3/scale,right:at.x+width/2+3/scale,top:at.y-label.size/scale-verticalPad,bottom:at.y+height-label.size/scale+verticalPad}}))
    // Prefer open ground, but dense mountain districts must retain their names.
    // Ink halos keep fallback captions legible; markers and other labels remain
    // hard obstacles. Relief never makes a state's entire caption disappear.
    const open=candidates.filter(({box})=>!relief.some(other=>boxesOverlap(box,other)))
    for(const {at,box} of [...open,...candidates.filter(c=>!open.includes(c))]) {
      if(occupied.some(other=>boxesOverlap(box,other)))continue
      occupied.push(box);result.push({...label,x:at.x,y:at.y});break
    }
  }
  return result
}
