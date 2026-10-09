import { coreRivers } from './riverGeometry.ts'
import type { LonLat } from './geographyContent.ts'

// Follow the actual displayed water vertices. These are campaign catchments,
// not a reconstruction of ancient administrative boundaries or river courses.
export function riverReach(name: string, from: LonLat, to: LonLat): LonLat[] {
  const project = ([lon, lat]: LonLat) => [60 + (lon - 29) * 33, 35 + (43 - lat) * 40]
  const start = project(from), end = project(to)
  const river = coreRivers.find(river => river.name === name)
  if (!river) throw new Error(`Unknown physical river: ${name}`)
  const lines = river.path.split('M').filter(Boolean)
    .map(line => line.split('L').map(point => point.split(',').map(Number)))
  for (let i=0; i<lines.length; i++) for (let j=i+1; j<lines.length; j++) {
    const a=lines[i], b=lines[j]
    const distance=(p:number[],q:number[])=>Math.hypot(p[0]-q[0],p[1]-q[1])
    if(distance(a.at(-1)!,b[0])<.25) { lines[i]=[...a,...b]; lines.splice(j--,1) }
    else if(distance(b.at(-1)!,a[0])<.25) { lines[i]=[...b,...a]; lines.splice(j--,1) }
  }
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
// Both provinces meet on the displayed channel, sharing the river rather than
// assigning its whole width to Babylonia with an offset onto the Susian bank.
export const easternTigrisMargin: LonLat[] = easternFrontierRiver
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
  const shatt=riverReach('Shatt al-Arab',[47.46851,30.96845],[48.53184,29.9612])
  return [
    ...curvedMargin([north,[46.86,33.13],[46.82,32.87],[46.72,32.68],easternTigrisMargin[0]]),
    ...easternTigrisMargin.slice(1),
    ...shatt.slice(1),
    [48.62,29.60],[48.62,29.20],south,
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
export const babyloniaAuthoringMasks: { stateId: string; outline: LonLat[] }[] = [
  {stateId:'diyala',outline:[...diyalaTigrisBank,[46.00,32.64],[46.19,32.76],[46.42,32.85],[48,32.95],[51,37],[40,37]]},
  {stateId:'chaldaea',outline:[...westernDryMargin,[40,28.8],[40,35]]},
  {stateId:'sippar',outline:[...sipparCanalMargin,[51,37],[40,37]]},
  {stateId:'babylon',outline:[...sipparCanalMargin,...urbanEastBank.slice(1),...babylonSouthernCanals.slice(0,-1).reverse()]},
  {stateId:'ur',outline:[[40,30.85],[44.80,30.9],[45.12,31.02],[45.40,31.10],...lowerEuphratesBank,[49,31],[49,28],[40,28]]},
  {stateId:'uruk',outline:[...urukCanalMargin,[marshJunction[0],28],[40,28]]},
]

// The upper split follows the displayed Diyala tributary into its snapped
// Tigris mouth. Reuse the exact vertices from the physical river artwork.
export const diyalaTributaryBank = riverReach('Diyala', [46.37,35.30], [44.58,33.25])
const diyalaMouth = diyalaTributaryBank.at(-1)!
export const middleTigrisBank = [diyalaMouth,...riverReach('Tigris',[44.5442,33.127],[46.5633,32.4943])]
export const upperEuphratesBank = riverReach('Euphrates',[42.73,33.8655],[44.1221,33.053])
// A short canal/bank connection keeps Sippar itself north of the new boundary;
// it does not move either physical river or cut through the settlement.
const sipparRiverLink = curvedMargin([upperEuphratesBank.at(-1)!,[44.20,32.98],[44.38,32.99],[44.54,33.04],middleTigrisBank[1]])
export const sipparSouthernBank = [...upperEuphratesBank,...sipparRiverLink.slice(1)]
const babylonTigrisBank = riverReach('Tigris',middleTigrisBank[1],[45.5221,32.5558])
export const babylonNorthernBank = [...sipparSouthernBank,...babylonTigrisBank.slice(1)]
export const nippurEuphratesBank = riverReach('Euphrates',[44.477,31.8778],[47.4421,31.0045])
// Use exactly the same western junction for the capital, interfluve and lower
// country. No residual Nippur strip can run west across the Euphrates.
export const babylonSouthernMargin: LonLat[] = [
  [40,nippurEuphratesBank[0][1]],
  ...curvedMargin([nippurEuphratesBank[0],[44.75,31.98],[45.05,32.06],[45.20,32.22],[45.21,32.44],[45.34,32.52],babylonTigrisBank.at(-1)!]),
]
export const babyloniaDistrictMasks: {stateId:string;outline:LonLat[]}[] = [
  {stateId:'diyala',outline:[...diyalaTributaryBank,...middleTigrisBank.slice(1),[46.75,32.67],[48,32.80],[51,37],[40,37]]},
  {stateId:'sippar',outline:[...sipparSouthernBank,diyalaMouth,...diyalaTributaryBank.slice(0,-1).reverse(),[40,37]]},
  {stateId:'babylon',outline:[...babylonNorthernBank,...babylonSouthernMargin.slice(0,-1).reverse()]},
  {stateId:'chaldaea',outline:[...nippurEuphratesBank,[49,31],[49,28],[40,28],[40,nippurEuphratesBank[0][1]]]},
]

export const babyloniaStateNotes: Record<string,string> = {
  sippar:'Upper river country west of the Diyala tributary; its southern edge follows the Euphrates and the short bank connection beside Sippar.',
  babylon:'Babylon and Borsippa share a larger irrigated hinterland across the Euphrates, with the northern edge following the two river banks.',
  chaldaea:'The united lower country stays south of the Euphrates, from western drylands through Ur’s floodplain to southern marshes and the Gulf.',
  nippur:'Nippur occupies the remaining interfluve between the Euphrates and Tigris south of Babylon; irrigation gives way to downstream reed beds.',
  diyala:'The lower Diyala basin stays east of its tributary and the middle Tigris, opening into farms below the northeastern foothills.',
}
