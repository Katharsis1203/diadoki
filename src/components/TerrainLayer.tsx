import { project } from '../game/data'
import { routeFeatures, terrainFeatures } from '../game/terrainContent'
import type { TerrainDetail, TerrainFeature } from '../game/terrainContent'
import { terrainWeights } from '../game/mapView'
import type { MapLevel } from '../game/mapView'
import { pointInState } from '../game/geography'
import { provinceOutlines, stateLabels } from '../game/stateGeometry'
import { settlementDefinitions } from '../game/geographyContent'
import { inSceneryZone } from '../game/babyloniaScenery'

type Point = readonly [number, number]
function softPath(points: readonly Point[]) {
  if (points.length < 2) return ''
  let path = `M${points[0].join(',')}`
  for (let i=1;i<points.length-1;i++) {
    const p=points[i], next=points[i+1]
    path += `Q${p.join(',')} ${(p[0]+next[0])/2},${(p[1]+next[1])/2}`
  }
  return `${path}L${points.at(-1)!.join(',')}`
}
const colors = { mountain:'#786956',hill:'#998258',desert:'#b98a41',steppe:'#92945c',forest:'#557443',palm:'#657e44',marsh:'#588e7d',fertile:'#5e8451',coastal:'#7d9656',road:'#967b50',river:'#6193a4',pass:'#967b50' }

// Overlapping transparent brush marks feather to zero instead of outlining a
// constant-width tube. Taper and lateral variation follow each authored region.
function corridorWash(feature: TerrainFeature) {
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

// Sample connected corridors at fixed map distances, once when the module loads.
// Local clusters add finer symbols in the same region instead of enlarging them.
function corridorSymbols(feature: TerrainFeature) {
  if (feature.marks) return feature.marks.flatMap(mark => {
    const [x,y] = project(mark.position), size = mark.size * (feature.type==='palm'?.65:1)
    if (feature.stateId) {
      if (!pointInState([x,y],feature.stateId)) return []
      const label = stateLabels[feature.stateId]
      if (Math.hypot(x-label[0],y-label[1]) < size+9) return []
      if (settlementDefinitions.filter(place=>place.stateId===feature.stateId).some(place=>{
        const at=project(place.position)
        return Math.hypot(x-at[0],y-at[1]) < size+6
      })) return []
    }
    return [{x,y,size,rotation:mark.rotation}]
  })
  if (feature.detail==='macro' || ['fertile','coastal'].includes(feature.type)) return []
  const points=feature.points.map(project), step=feature.type==='desert'?(feature.detail==='regional'?28:20):feature.detail==='regional'?17:10
  let walked=0, next=step*.35
  const out:{x:number;y:number;size:number;rotation:number}[]=[]
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)
    while(next<walked+length){
      const t=(next-walked)/length, n=out.length, offset=Math.sin(n*2.1)*feature.width*(feature.detail==='regional'?.12:.22)
      out.push({x:a[0]+t*dx-dy/length*offset,y:a[1]+t*dy+dx/length*offset,size:(feature.detail==='regional'?9:6.5)*feature.scale*(.85+.15*Math.sin(n)),rotation:feature.rotation})
      next+=step
    }
    walked+=length
  }
  return out
}
const illustrated = terrainFeatures.map(feature=>({feature,symbols:corridorSymbols(feature)}))
// Washes are shared across detail levels so crossfades never stack their colour.
const washes = terrainFeatures.filter(feature => feature.detail === 'regional').map(feature => ({ feature, marks: corridorWash(feature) }))
const routes = routeFeatures.filter(feature=>feature.type==='river').map(feature=>({feature,path:feature.provinceId ? `M${feature.points.map(project).map(p=>p.join(',')).join('L')}` : softPath(feature.points.map(project))}))

export function TerrainSymbols() {
  return <>
    <clipPath id="babylonia-relief"><polygon points={provinceOutlines.babylonia.map(p=>p.join(',')).join(' ')}/></clipPath>
    <mask id="outside-babylonia-relief" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000"><rect x="-1000" y="-1000" width="3000" height="3000" fill="white"/><polygon points={provinceOutlines.babylonia.map(p=>p.join(',')).join(' ')} fill="black"/></mask>
    {Object.entries(colors).map(([type, color]) => {
      const opacity = type === 'fertile' || type === 'marsh' ? .32 : type === 'mountain' ? .25 : .19
      return <radialGradient key={type} id={`terrain-wash-${type}`}>
        <stop stopColor={color} stopOpacity={opacity}/>
        <stop offset=".35" stopColor={color} stopOpacity={opacity * .65}/>
        <stop offset=".7" stopColor={color} stopOpacity={opacity * .18}/>
        <stop offset="1" stopColor={color} stopOpacity="0"/>
      </radialGradient>
    })}
    <filter id="river-wash-soften" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="2"/></filter>
    <linearGradient id="ridge-relief" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#decca0"/><stop offset="1" stopColor="#897557"/></linearGradient>
    <symbol id="terrain-mountain" viewBox="-10 -12 20 20">
      <path d="M-7 5Q0 1 8 4L10 7L-5 7Z" fill="#806847" opacity=".13"/>
      <path d="M-9 5L-2 -9L8 5Z" fill="#bda27a" stroke="#6d5c45" strokeWidth=".65" strokeLinejoin="round"/>
      <path d="M-9 5L-2 -9L-2 -1L1 5Z" fill="#e1cfab"/>
      <path d="M-2 -9L8 5L1 5L-2 -1Z" fill="#837055" opacity=".38"/>
      <path d="M-7 4l3 -3m5 2l2 2M-2 -9L-2 -1" fill="none" stroke="#826e4b" strokeWidth=".5" opacity=".55"/>
    </symbol>
    <symbol id="terrain-hill" viewBox="-10 -12 20 20"><path d="M-9 5Q-5 -6 0 -3Q5 -1 9 5" fill="url(#ridge-relief)" stroke="#998560" strokeWidth=".55"/><path d="M-5 2Q-2 -3 0 -3" fill="none" stroke="#decca0" strokeWidth="1"/></symbol>
    <symbol id="terrain-desert" viewBox="-10 -12 20 20"><path d="M-9 2Q-1 -5 9 2Q1 1 -6 4Z" fill="#bea16d" opacity=".23"/><path d="M-9 2Q-1 -5 9 2M-6 6q5 -2 10 0" fill="none" stroke="#aa8e5e" strokeWidth=".55"/></symbol>
    <symbol id="terrain-steppe" viewBox="-10 -12 20 20"><path d="M-9 2q3 -2 7 0m4 3q3 -2 6 -1M-3 -3l1 -2l1 2" fill="none" stroke="#9b9168" strokeWidth=".6"/></symbol>
    <symbol id="terrain-forest" viewBox="-10 -12 20 20"><path d="M-4 4l10 2" stroke="#7d7b55" opacity=".18" strokeWidth="2"/><path d="M-5 5V-4M3 5V-7" stroke="#797253" strokeWidth=".7"/><path d="M-8 0q-3 -5 2 -6q2 -4 5 0q4 5 0 7ZM0 -1q-3 -5 1 -7q2 -4 5 0q4 5 0 7Z" fill="#738757" stroke="#4f693e" strokeWidth=".5"/></symbol>
    <symbol id="terrain-palm" viewBox="-10 -12 20 20">
      <path d="M-3 6l7 1" stroke="#7d7b55" strokeWidth="1.5" opacity=".15"/>
      <path d="M0 6Q1 0 0 -5" fill="none" stroke="#8a7651" strokeWidth="1"/>
      <path d="M0 -5Q-6 -9 -9 -3Q-4 -6 0 -5M0 -5Q5 -10 9 -4Q4 -6 0 -5M0 -5Q-2 -10 -5 -10M0 -5Q2 -10 5 -10M0 -5Q-6 -4 -6 0M0 -5Q6 -4 7 0" fill="none" stroke="#7f9064" strokeWidth="1.2" strokeLinecap="round"/>
    </symbol>
    <symbol id="terrain-marsh" viewBox="-10 -12 20 20"><path d="M-9 5q4 -2 8 0m2 -2q4 -2 8 0" fill="none" stroke="#79a09a" strokeWidth=".6"/><path d="M-5 3V-4m0 4l-3 -3m3 4l3 -3M3 1V-6m0 4l-2 -2m2 3l3 -3" fill="none" stroke="#879574" strokeWidth=".65"/></symbol>
  </>
}

export function TerrainLayer({zoom,scale,override,sceneryPrototype=false}:{zoom:number;scale:number;override?:MapLevel;sceneryPrototype?:boolean}) {
  const weights=terrainWeights(zoom,override)
  const washStrength = weights.macro * .9 + weights.regional + weights.local * (7 / 6)
  return <g className="map-terrain" aria-hidden="true" pointerEvents="none" clipPath="url(#physical-land)">
    <g className="terrain-washes">{washes.map(({feature: f, marks}) => <g key={f.id} className={`terrain-wash terrain-${f.type}`} opacity={f.opacity * washStrength} clipPath={f.provinceId?'url(#babylonia-relief)':undefined}>
      {marks.map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} transform={`rotate(${p.rotation} ${p.x} ${p.y})`} fill={`url(#terrain-wash-${f.type})`}/>)}
    </g>)}</g>
    {(['macro','regional','local'] as TerrainDetail[]).map(detail=><g key={detail} className={`terrain-detail terrain-${detail}`} data-terrain-detail={detail} style={{opacity:weights[detail]}}>
      {illustrated.filter(({feature})=>feature.detail===detail).map(({feature:f,symbols})=><g key={f.id} className={`terrain-region terrain-${f.type}`} data-terrain={f.id} data-state={f.stateId} opacity={f.opacity}
        mask={f.provinceId?undefined:'url(#outside-babylonia-relief)'} clipPath={f.stateId?`url(#state-clip-${f.stateId})`:undefined}>
        {symbols.filter(p=>!sceneryPrototype||!inSceneryZone([p.x,p.y])).map((p,i)=>{const size=Math.min(p.size,(detail==='local'?12:15)/scale);return <use key={i} href={`#terrain-${f.type}`} transform={`translate(${p.x} ${p.y}) rotate(${p.rotation})`} x={-size} y={-size*1.2} width={size*2} height={size*2}/>})}
      </g>)}
    </g>)}
    <g className="terrain-canals detail-fade" style={{opacity:weights.regional+weights.local}} clipPath="url(#babylonia-relief)">{routes.filter(({feature})=>feature.provinceId==='babylonia'&&feature.detail==='regional'&&feature.type==='river').map(({feature:f,path})=><path key={f.id} d={path} className="map-river map-canal" style={{strokeWidth:f.width}} opacity={f.opacity}><title>{f.name}</title></path>)}</g>
    <g className="terrain-tributaries" style={{opacity:weights.local}}>{routes.filter(({feature})=>feature.type==='river'&&(!feature.provinceId||feature.detail==='local')).map(({feature:f,path})=><path key={f.id} d={path} className="map-river tributary" strokeWidth={f.width} style={f.provinceId?{strokeWidth:f.width}:undefined} opacity={f.opacity} clipPath={f.provinceId?'url(#babylonia-relief)':undefined}/>)}</g>
  </g>
}
