import { persisNorthernHighlandsOutline, persisNorthernHighlandsLabel } from './persisGeography.ts'
import { project } from './geographicProjection.ts'

// Authored campaign-scale crossings. A pass cuts a narrow corridor through
// independent mountain land; ordinary open plains need no special crossing.
export const mountainPasses = [
  {id:'diyala-saddle',name:'Diyala saddle',at:[46.73,34.25]},
  {id:'zagros-saddle',name:'Northern Zagros pass',at:[46.55,34.84]},
  {id:'western-valley-pass',name:'Western valley pass',at:[48.20,33.18]},
  {id:'persian-gates',name:'Mountain Entrance pass',at:[50.17,31.96]},
  {id:'carmanian-pass',name:'Pasargadae eastern pass',at:[56.30,31.05]},
  {id:'cilician-pass',name:'Cilician approach',at:[34.78,37.44]},
  {id:'damascus-approach',name:'Damascus valley approach',at:[36.29,33.51]},
].map(p=>({...p,point:project(p.at as [number,number])}))

// The cultivated royal plain is an inhabited basin already cleared in the
// illustrated relief. Its land stays open between the surrounding ridges.
export const mountainBasins=[{id:'persepolis-basin',point:project([52.9,29.95]),rx:21,ry:14}]

// Named area barriers use the same ownership and movement exclusions as ridges.
export const mountainRegions=[{id:'persis-northern-highlands',name:'Northern Highlands',
  provinceId:'persis',outline:persisNorthernHighlandsOutline.map(project),
  label:project(persisNorthernHighlandsLabel)}]
