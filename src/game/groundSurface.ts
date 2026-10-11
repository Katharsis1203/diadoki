import { project } from './data.ts'
import type { LonLat } from './geographyContent.ts'

// Broad physical ground regions, independent of administrative boundaries.
// Solid interiors establish the base; only their edges feather into neighbours.
export const regionalBaseBlur=6
const regionalBaseRegions:readonly {id:string;color:string;opacity:number;points:readonly LonLat[]}[]=[
  {id:'median-steppe',color:'#d4bb8b',opacity:.92,points:[[46.0,38.5],[49.0,38.6],[54.0,37.3],[55.8,34.0],[53.9,32.3],[50.7,32.0],[48.2,33.6],[46.0,36.0]]},
  {id:'zagros-foothills',color:'#c8b08b',opacity:.86,points:[[44.0,38.1],[45.6,38.2],[47.3,36.2],[49.5,34.0],[52.0,31.9],[52.0,30.6],[49.6,31.1],[47.8,32.4],[46.0,34.0],[44.6,36.3]]},
  {id:'persis-sandy-ground',color:'#d0ad79',opacity:.9,points:[[50.1,32.4],[53.6,32.2],[56.9,31.3],[57.0,28.0],[54.6,26.6],[51.4,27.3],[49.8,29.6]]},
  {id:'susiana-lowlands',color:'#cbd0a0',opacity:.86,points:[[46.9,34.0],[47.7,33.8],[49.2,32.7],[50.1,31.4],[49.4,30.0],[47.1,29.8],[46.4,31.3],[46.6,32.8]]},
  {id:'mesopotamian-alluvium',color:'#b9c18b',opacity:.88,points:[[42.3,37.5],[43.7,37.6],[44.8,36.5],[45.4,35.1],[46.0,34.0],[46.7,32.6],[47.3,31.0],[48.4,30.0],[47.6,29.3],[45.5,30.0],[44.1,31.1],[43.4,32.8],[42.3,34.8]]},
  // Open upland basins and valley floors have their own quieter soil colours.
  {id:'atropatene-lake-basin',color:'#c3c49b',opacity:.68,points:[[45.1,38.9],[46.4,39.0],[47.2,38.3],[47.8,37.3],[46.8,36.8],[45.4,37.0],[44.9,38.0]]},
  {id:'nisaean-grassland',color:'#c9c39a',opacity:.74,points:[[46.0,36.7],[47.3,36.8],[48.2,36.2],[47.8,35.5],[46.9,35.2],[46.2,35.7]]},
  {id:'western-valley-floor',color:'#c8c29a',opacity:.78,points:[[46.9,34.9],[48.1,34.7],[49.0,34.0],[48.7,33.6],[48.1,33.5],[47.2,34.0]]},
  {id:'mountain-entrance-valley',color:'#c7bd9b',opacity:.74,points:[[48.9,33.8],[49.9,33.5],[50.5,33.1],[50.8,32.7],[50.4,32.2],[49.9,32.2],[49.1,32.7],[48.7,33.1]]},
  {id:'pasargadae-basin',color:'#c5c39a',opacity:.82,points:[[52.1,31.45],[52.8,31.65],[53.7,31.55],[54.6,31.35],[55.4,31.0],[55.6,30.7],[54.6,30.3],[53.8,30.35],[52.9,30.65],[52.1,31.0]]},
  {id:'persepolis-farming-basin',color:'#cdc69c',opacity:.76,points:[[51.9,30.4],[52.8,30.6],[53.6,30.1],[53.6,29.6],[53.0,29.0],[52.0,29.2],[51.7,29.8]]},

]
export const regionalBaseGround=regionalBaseRegions.map(region=>({
  ...region,path:`M${region.points.map(at=>project(at).join(',')).join('L')}Z`,
}))

export const earthPatches = [
  {at:[43.9,32.4],rx:35,ry:42,color:'dry',angle:-18},
  {at:[44.2,31.2],rx:26,ry:35,color:'dry',angle:15},
  {at:[45.5,33.0],rx:26,ry:24,color:'soil',angle:-25},
  {at:[45.0,32.0],rx:24,ry:16,color:'fertile',angle:25},
  {at:[46.4,31.3],rx:27,ry:18,color:'marsh',angle:24},
  {at:[46.9,30.7],rx:30,ry:17,color:'marsh',angle:-12},
  {at:[48.0,32.8],rx:32,ry:20,color:'rock',angle:30},
  {at:[48.8,32.0],rx:26,ry:34,color:'soil',angle:30},
  {at:[44.65,32.48],rx:34,ry:42,color:'irrigated',angle:-24},
  {at:[45.80,31.55],rx:42,ry:24,color:'irrigated',angle:24},
  {at:[43.50,35.55],rx:20,ry:43,color:'irrigated',angle:-16},
  {at:[48.25,31.85],rx:35,ry:40,color:'susian',angle:25},
  {at:[46.60,35.20],rx:26,ry:50,color:'foothill',angle:-33},
  {at:[48.60,33.00],rx:30,ry:48,color:'foothill',angle:-30},
  {at:[50.00,31.80],rx:30,ry:36,color:'foothill',angle:-25},
  {at:[48.90,35.10],rx:55,ry:42,color:'steppe',angle:15},
  {at:[50.50,34.30],rx:65,ry:46,color:'steppe',angle:-15},
  {at:[51.30,34.20],rx:28,ry:18,color:'salt',angle:12},
  {at:[50.30,35.80],rx:24,ry:17,color:'salt',angle:-10},
  {at:[53.40,30.50],rx:78,ry:55,color:'persis',angle:18},
  {at:[53.90,28.65],rx:64,ry:30,color:'persis',angle:-15},
] as const

export const surfaceColors={dry:'#b17f38',soil:'#ad8654',fertile:'#608550',marsh:'#568e7c',rock:'#786b57',
  irrigated:'#889b6c',susian:'#a0aa79',foothill:'#b49a72',steppe:'#b99c66',salt:'#eee1bc',persis:'#c3a06b'} as const
export const surfaceOpacity:Record<keyof typeof surfaceColors,number>={dry:.22,soil:.22,fertile:.22,marsh:.22,rock:.22,
  irrigated:.20,susian:.24,foothill:.28,steppe:.32,salt:.42,persis:.30}
