import { project } from './data.ts'

// Prepare immutable river label anchors once. The map projects and lays these
// out alongside the other label groups, so they share collision space.
export const worldRiverLabels = [
  {id:'nile',name:'Nile',at:[31.0,27.0] as const},
  {id:'indus',name:'Indus',at:[68.6,28.1] as const},
  {id:'ganges',name:'Ganges',at:[82.7,25.6] as const},
  {id:'oxus',name:'Oxus',at:[66.1,37.4] as const},
].map(r=>({id:`river-${r.id}`,text:r.name,position:project(r.at)}))
