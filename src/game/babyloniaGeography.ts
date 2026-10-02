import { rivers } from './mapGeometry.ts'
import type { LonLat } from './geographyContent.ts'

// Follow the actual displayed water vertices. These are campaign catchments,
// not a reconstruction of ancient administrative boundaries or river courses.
export function riverReach(name: string, from: LonLat, to: LonLat): LonLat[] {
  const project = ([lon, lat]: LonLat) => [60 + (lon - 29) * 33, 35 + (43 - lat) * 40]
  const start = project(from), end = project(to)
  const river = rivers.find(river => river.name === name)
  if (!river) throw new Error(`Unknown physical river: ${name}`)
  const lines = river.path.split('M').filter(Boolean)
    .map(line => line.split('L').map(point => point.split(',').map(Number)))
  const nearest = (line: number[][], point: number[]) => line.reduce((best, candidate, i) =>
    Math.hypot(candidate[0] - point[0], candidate[1] - point[1]) < Math.hypot(line[best][0] - point[0], line[best][1] - point[1]) ? i : best, 0)
  const line = lines.reduce((best, candidate) => {
    const distance = (points: number[][]) => [start, end].reduce((sum, point) => {
      const closest = points[nearest(points, point)]
      return sum + Math.hypot(closest[0] - point[0], closest[1] - point[1])
    }, 0)
    return distance(candidate) < distance(best) ? candidate : best
  })
  const a = nearest(line, start), b = nearest(line, end)
  const reach = line.slice(Math.min(a, b), Math.max(a, b) + 1)
  if (a > b) reach.reverse()
  return reach.map(([x, y]) => [29 + (x - 60) / 33, 43 - (y - 35) / 40])
}

export const diyalaTigrisBank = riverReach('Tigris', [43.6, 35], [45.8091, 32.5023])
export const lowerEuphratesBank = riverReach('Euphrates', [45.6852, 31.184], [47.4421, 31.0045])
export const easternFrontierRiver = riverReach('Tigris', [46.5633,32.4943], [47.4412,30.999])
// Keep the complete lower river inside Babylonia. A small eastern bank margin
// leaves room for both the blue water and the province's political outline.
export const easternTigrisMargin: LonLat[] = easternFrontierRiver.map(([lon, lat], i, line) => {
  const a = line[Math.max(0, i-1)], b = line[Math.min(line.length-1, i+1)]
  const dx = (b[0]-a[0])*33, dy = (a[1]-b[1])*40, length = Math.hypot(dx,dy)
  return [lon + dy/length*4/33, lat + dx/length*4/40]
})
const urbanEastBank = riverReach('Tigris', [44.8709,32.9252], [45.3836,32.6035])
function curvedMargin(points: LonLat[]): LonLat[] {
  const middle = (a: LonLat, b: LonLat): LonLat => [(a[0]+b[0])/2,(a[1]+b[1])/2]
  const result: LonLat[] = [points[0], middle(points[0], points[1])]
  for (let i=1; i<points.length-1; i++) {
    const from = result.at(-1)!, control = points[i], to = middle(points[i],points[i+1])
    for (let j=1; j<=4; j++) {
      const t=j/4, s=1-t
      result.push([s*s*from[0]+2*s*t*control[0]+t*t*to[0],s*s*from[1]+2*s*t*control[1]+t*t*to[1]])
    }
  }
  return [...result, points.at(-1)!]
}
export function babyloniaEasternFrontier(north: LonLat, south: LonLat): LonLat[] {
  return [
    ...curvedMargin([north,[46.86,33.13],[46.82,32.87],[46.72,32.68],easternTigrisMargin[0]]),
    ...easternTigrisMargin.slice(1),
    ...curvedMargin([easternTigrisMargin.at(-1)!,[47.58,30.70],[47.60,30.38],[47.64,30.05],[47.69,29.74],south]).slice(1),
  ]
}
// A transverse canal district separates the two urban catchments, rather than
// cutting each city away from its river. Reused by the canal illustration.
export const sipparCanalMargin = curvedMargin([[42,32.76],[43.65,32.85],[43.9,32.90],[44.08,32.93],[44.25,32.96],[44.48,32.94],[44.65,32.92],urbanEastBank[0]])
export const westernDryMargin = curvedMargin([[42.5,32.35],[43.52,32.35],[43.82,32.31],[44.04,32.24],[44.16,31.91],[44.20,31.65],[44.37,31.43],[44.56,31.29],[44.8,31.13],[44.94,30.8],[45.09,30.43],[45.14,30.03],[45.18,29.78],[45.1,28.8]])
export const babylonSouthernCanals = curvedMargin([[42,32.06],[43.60,32.09],[43.87,32.12],[44.12,32.03],[44.37,32.04],[44.62,32.0],[44.84,32.05],[44.94,32.20],[45.0,32.38],[45.16,32.51],urbanEastBank.at(-1)!])
const marshJunction = riverReach('Euphrates', [46.8855,30.9588], [47.4421,31.0045])[0]
export const urukCanalMargin = curvedMargin([[42,31.86],[44.16,31.86],[44.40,31.80],[44.65,31.74],[44.92,31.78],[45.19,31.84],[45.40,31.89],[45.62,31.82],[45.90,31.74],[46.12,31.62],[46.30,31.46],[46.55,31.40],[46.70,31.17],marshJunction])

// Ordered masks are clipped to the existing province. Shared cuts are drawn
// once; Nippur receives the connected interfluve left by the other catchments.
export const babyloniaDistrictMasks: { stateId: string; outline: LonLat[] }[] = [
  {stateId:'diyala',outline:[...diyalaTigrisBank,[46.00,32.64],[46.19,32.76],[46.42,32.85],[48,32.95],[51,37],[40,37]]},
  {stateId:'chaldaea',outline:[...westernDryMargin,[40,28.8],[40,35]]},
  {stateId:'sippar',outline:[...sipparCanalMargin,[51,37],[40,37]]},
  {stateId:'babylon',outline:[...sipparCanalMargin,...urbanEastBank.slice(1),...babylonSouthernCanals.slice(0,-1).reverse()]},
  {stateId:'ur',outline:[[40,30.85],[44.80,30.9],[45.12,31.02],[45.40,31.10],...lowerEuphratesBank,[49,31],[49,28],[40,28]]},
  {stateId:'uruk',outline:[...urukCanalMargin,[marshJunction[0],28],[40,28]]},
]

export const babyloniaStateNotes: Record<string, string> = {
  sippar:'Upper Euphrates farms and palm groves; the Tigris bank bounds the east and a canal district bounds the south.',
  babylon:'Babylon and Borsippa share an irrigated hinterland across the Euphrates, enclosed by canal districts and the eastern Tigris bank.',
  chaldaea:'Dry western steppe and desert fringe; its winding eastern edge follows the transition into irrigated river country.',
  nippur:'Nippur’s canal-fed interfluve reaches toward the lower Tigris, with irrigated fields giving way to reed beds downstream.',
  uruk:'Uruk and Larsa share the lower cultivated plain, between a northern canal district and the southern Euphrates bends.',
  diyala:'The lower Diyala basin lies east of the Tigris, opening into farms and rising toward foothills at the northeastern frontier.',
  ur:'Ur’s lower floodplain and marsh fringe sit south of the Euphrates bends; reed beds taper into the dry southern margin.',
}
