import { project } from './geographicProjection.ts'
import type { LonLat } from './geographyContent.ts'

// Authored ridge sections follow the eastern uplands. Breaks leave valley/pass
// openings; the Nisaean plain lies east of the western ridge, not under it.
export const babyloniaRanges: readonly { id: string; peaks: readonly (readonly [number, number, number])[] }[] = [
  { id: 'zagros-north', peaks: [[45.72,36.05,.66],[45.91,35.84,.77],[46.07,35.61,.68],[46.15,35.38,.79],
    [46.30,35.16,.72],[46.45,34.98,.83],[46.54,34.78,.67],[46.64,34.59,.75],[46.73,34.39,.58]] },
  { id: 'cossaea-west', peaks: [[46.96,34.04,.63],[47.13,33.90,.73],[47.31,33.72,.69],
    [47.50,33.60,.80],[47.65,33.42,.72],[47.84,33.29,.64],[48.02,33.13,.71],[48.20,33.02,.59]] },
  { id: 'elymais-east', peaks: [[48.58,32.86,.57],[48.76,32.73,.66],[48.94,32.57,.73],
    [49.12,32.47,.65],[49.30,32.30,.72],[49.48,32.14,.57]] },
]

export const rangeGround = babyloniaRanges.map(range => ({
  id: range.id,
  points: range.peaks.map(([lon,lat]) => [lon,lat] as LonLat),
  mapPoints: range.peaks.map(([lon,lat]) => project([lon,lat])),
}))
