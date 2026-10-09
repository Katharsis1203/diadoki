import type { LonLat, SettlementDefinition } from './geographyContent.ts'
import { riverReach } from './babyloniaGeography.ts'

// The eastern bank leaves Assur's existing centre and the lower Tigris in the
// western catchment. The adjoining Zab boundary reuses the displayed river axis.
const assurTigrisMargin: readonly LonLat[] = riverReach('Tigris',[43.25,35.95],[43.54,35.20]).map(([lon,lat])=>[lon+.07,lat])
export const assyriaJunctions: readonly {states:readonly string[];at:LonLat}[] = [
  {states:['nineveh','arbela','assur'],at:[43.346364,35.94575]},
  {states:['arbela','assur','zagros'],at:[44.78,35.60]},
]
export const assyriaBoundaryCuts: readonly {states:readonly [string,string];feature:string;via:readonly LonLat[]}[] = [
  {states:['upper-euphrates','nisibis'],feature:'Western Jazira plain and dry interfluve',via:[[40.12,37.48],[40.18,37.25],[40.28,37.02],[40.50,36.79],[40.68,36.59],[40.80,36.34],[40.96,36.11],[41.04,35.92],[41.22,35.72]]},
  {states:['nisibis','nineveh'],feature:'Western Tigris terraces and northern plain',via:[[42.53,37.32],[42.48,37.10],[42.39,36.89],[42.19,36.68],[41.96,36.48],[41.82,36.20],[41.69,35.94]]},
  {states:['nineveh','assur'],feature:'Northern Assur terrace and Zab confluence',via:[[41.95,35.86],[42.15,35.90],[42.37,35.94],[42.62,35.96],[42.83,35.98],[43.05,35.97],[43.24,35.96]]},
  {states:['nineveh','arbela'],feature:'Greater Zab valley',via:[[44.18,37.15],[44.18,36.94],[43.95,36.70],[43.68,36.61],[43.46,36.28],[43.35,36.06]]},
  {states:['arbela','assur'],feature:'Tigris eastern bank and Lesser Zab valley',via:[...assurTigrisMargin,[43.88,35.21],[44.18,35.27],[44.36,35.48]]},
]

// Four historic city anchors already exist. The remaining state gets one
// descriptive campaign centre rather than an invented ancient town name.
export const assyriaAdditionalSettlements: readonly SettlementDefinition[] = [
  {id:'upper-euphrates-centre',name:'Upper Euphrates',stateId:'upper-euphrates',position:[40.0,36.5],kind:'village'},
]
export const assyriaStateNotes: Record<string,string> = {
  'upper-euphrates':'Dry Jazira interfluves open onto narrow cultivated Euphrates terraces; small farming patches leave the steppe plain open.',
  nisibis:'Cultivated northern Mesopotamian plain below the uplands, with small groves and dry terraces toward the Tigris.',
  nineveh:'Tigris-bank farms and the Nineveh plain meet the Greater Zab valley; the city remains Assyria’s campaign capital.',
  arbela:'The farming plain between the Greater and Lesser Zab rises toward the eastern foothills.',
  assur:'The middle Tigris catchment joins river terraces to a dry western hinterland, bounded in the east by the Lesser Zab valley.',
}
