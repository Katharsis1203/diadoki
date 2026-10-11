import type { SceneryObject } from '../game/babyloniaScenery'

// Ranges in the developed Mesopotamian and western Iranian theatres.
// Keep the wider world on its existing artwork until those regions are reviewed.
const variedRanges=[
  'zagros-north','cossaea-west','elymais-east','zagros-upper','zagros-zab',
  'nisaean-northwest','media-north','media-east','alborz-west','alborz-east',
  'zagros-central-east','zagros-fars-north','zagros-fars-south',
  'persis-corridor-north-ridge','persis-northeast-ridge',
  'persis-northern-foothills-east','persis-northern-foothills-west',
  'kerman-north','kerman-south',
]

export function scenerySymbol(object:SceneryObject){
  const p=object.placement
  // Reuse authored anchors, bounds and object count; broader faces add mass
  // without closing valleys. Read both primary and derived sprite indices.
  const rangeIndex=p.rangeId?variedRanges.indexOf(p.rangeId):-1
  if(rangeIndex>=0&&(p.asset==='mountain'||p.asset==='hill')){
    const index=Number(p.id.match(/-(\d+)(?:-(?:shoulder|foot))?$/)?.[1]??0)+rangeIndex
    const variant=p.asset==='hill'?[0,3,1,4,2][index%5]:p.id.includes('shoulder')?[2,5,1][index%3]:[0,3,1,4,2,5,1,0,2][index%9]
    return `scenery-${p.asset}-${variant}`
  }
  return p.asset==='settlement'&&p.style&&p.style!=='pasargadan'&&p.tier==='city'?`scenery-${p.style}-city`:p.asset==='settlement'&&p.style==='pasargadan'&&p.tier==='village'?'scenery-pasargadan-village':`scenery-${p.asset==='settlement'?p.tier:p.asset}-${p.asset==='settlement'&&p.tier==='city'?(p.isCapital?0:1+(p.variant??0)%2):p.variant??0}`
}
