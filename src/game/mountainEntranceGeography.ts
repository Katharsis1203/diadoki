import type { LonLat } from './geographyContent.ts'
import { project } from './geographicProjection.ts'
import { roundedOpenBorder } from './borderCurves.ts'
import { riverReach } from './babyloniaGeography.ts'

// One eastern seam shared by Susiana and the Persis atlas. Smooth only this
// valley edge; the northern junction and western river valley keep their cuts.
export const mountainEntrancePersisSeam:readonly LonLat[]=roundedOpenBorder([
  [50.90,32.99],[51.17,32.90],[51.40,32.66],[51.53,32.34],
  [51.49,32.02],[51.25,31.67],[50.99,31.54],
])

// Two separate Susian approaches: a western river valley and a modest
// eastern basin between the mountain belts.
export const mountainEntranceOutline: readonly LonLat[] = [
  [49.08,32.60],[49.35,32.93],[49.70,33.558824],[50.10,33.37],
  [50.50,33.18],...mountainEntrancePersisSeam,
  [50.83,31.50],[50.49,31.74],[50.17,31.96],
  [49.82,32.16],[49.48,32.37],[49.22,32.49],
]
// Closely spaced authored points keep the eastern edge at the mountain bases.
export const mountainEntranceRing=mountainEntranceOutline.map(project)
// The northern provincial frontage hugs the southern Karkheh bank. Its
// physical river vertices are shared with the artwork; a narrow bank margin
// keeps the political ink beside the channel instead of cutting its bends.
export const westernValleyRiver = riverReach('Karkheh',[47.3384,34.1980],[48.9832,33.9478])
export const westernValleyNorthernBank: readonly LonLat[] = westernValleyRiver.map(([lon,lat])=>[lon,lat-1.4/40])
export const westernValleyOutline: readonly LonLat[] = [
  [47.25,34.16],...westernValleyNorthernBank,
  [49.40,33.70],[49.70,33.558824],[49.35,32.93],
  [49.20,32.746667],[48.81,32.97],[48.55,33.02],
  [48.20,33.18],[47.87,33.37],[47.49,33.61],[47.23,33.92],
]
export const westernValleyRing=westernValleyOutline.map(project)
