import { project } from './data.ts'
import { babyloniaRanges } from './babyloniaRanges.ts'
import { backbonePeaks, coreRangeGround } from './terrainBackbone.ts'

// The three authored Babylon ridges belong to the same overview peak family
// as the theatre backbone. They previously fell through to a ribbon fallback.
const peaks = [...backbonePeaks, ...babyloniaRanges.flatMap(range => range.peaks.map(([lon, lat, scale]) => ({
  rangeId: range.id, position: project([lon, lat]), scale,
})))]
export const overviewRanges = coreRangeGround.map(range => ({
  ...range, peaks: peaks.filter(p => p.rangeId === range.id).toSorted((a,b) => a.position[1]-b.position[1]),
})).toSorted((a,b) => Math.max(...a.mapPoints.map(p=>p[1]))-Math.max(...b.mapPoints.map(p=>p[1])))
