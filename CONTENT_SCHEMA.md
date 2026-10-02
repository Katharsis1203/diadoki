# Content schema

## Canonical geography collections

`src/game/geographyContent.ts` stores province definitions, named district definitions, settlements and local events. Geometry is generated into `stateGeometry.ts`. `data.ts` combines content and geometry into typed campaign state. The renderer reads these collections rather than containing state-specific ownership, labels or polygons.

## Province

```json
{
  "id": "babylonia",
  "name": "Babylonia",
  "mainSettlementId": "babylon-city",
  "stateIds": ["sippar", "babylon", "chaldaea", "nippur", "uruk", "diyala", "ur"],
  "borderPath": "exterior edges derived from child states",
  "labelX": 0,
  "labelY": 0
}
```

A province has no separately stored owner, income or playable polygon. `provinceSummary` derives total/local income, control, child count, garrisons and settlement count. Its exterior is the exact child union; cached generated outlines are validation/reference data. `mainSettlementId` references a settlement in one of its states. It has a small ring marker at province/detail scales, unless a faction seal already marks that city. The designation persists when ownership changes.

## State

```json
{
  "id": "babylon",
  "name": "Babylon",
  "provinceId": "babylonia",
  "owner": "babylon",
  "terrain": "river",
  "income": 13,
  "defense": 15,
  "garrison": 26,
  "buildings": {"market": 2, "fort": 0},
  "settlementIds": ["babylon-city", "borsippa-city"],
  "resolvedEventIds": [],
  "neighbors": ["sippar", "chaldaea", "nippur", "uruk"],
  "shape": "shared-mesh polygon points",
  "labelX": 0,
  "labelY": 0
}
```

The internal faction ID `babylon` denotes the Seleucids; state and faction IDs occupy separate namespaces. A state is the target for selection, movement, invasion, conquest, income, garrisons, buildings and local event triggers. Development is stored as market level, rather than duplicating another mutable development counter.

Source `StateDefinition` can supply an optional `labelPosition` in longitude/latitude. Otherwise the generator finds a point with good clearance inside the polygon. All label anchors are validated during generation.

State terrain classifications also include `desert` and `marsh`. An optional `landscape` string explains authored local geography in the selected-state details. These descriptions/classifications do not activate new combat or economic modifiers.

## Terrain feature

`src/game/terrainContent.ts` stores illustration separately from mutable campaign state. Each feature supports:

```ts
type TerrainFeature = {
  id: string
  name: string
  type: 'mountain' | 'hill' | 'desert' | 'steppe' | 'forest' | 'palm' | 'marsh'
      | 'fertile' | 'coastal' | 'river'
  detail: 'macro' | 'regional' | 'local'
  points: readonly LonLat[]
  width: number
  scale: number
  rotation: number
  opacity: number
  zoomVisibility: readonly [number, number]
  modifierRef?: string
  provinceId?: string
  stateId?: string
  marks?: readonly { position: LonLat; size: number; rotation: number }[]
}
```

Connected positions define geographic corridors projected by the renderer. Width controls the map-space wash; scale and rotation control reusable relief symbols. The common detail controller governs crossfades; `zoomVisibility` records each feature's intended zoom range. `modifierRef` reserves future gameplay integration and currently has no effect. Macro mountain corridors also guide boundary generation. Canals and tributaries are stored in `routeFeatures`; roads and pass routes are not drawn.

Reviewed province features can provide explicit `marks` for irregular terrain patches instead of corridor sampling. `stateId` constrains symbols to their actual state and reserves clearance around its label and settlements; `provinceId` scopes local illustration and waterways. Babylonia's marks and canal districts live in `babyloniaTerrain.ts`, while shared boundary guides live in `babyloniaGeography.ts`.

## Prototype scenery placement

`src/game/babyloniaScenery.ts` defines immutable illustration placements separately from campaign state:

```ts
type SceneryPlacement = {
  id: string
  asset: 'mountain' | 'hill' | 'trees' | 'reeds' | 'settlement'
  position: readonly [number, number] // canonical map coordinates, before tilt
  scale: number
  variant?: 0 | 1 | 2
  detail?: boolean
  settlementId?: string
}
```

Settlement placements additionally require `stateId`, `name` and an independent `isCapital` boolean. `primaryCentre()` derives initial `tier: 'homestead' | 'village' | 'fortress' | 'city'` and size from the authored market development; rendered objects refresh these visual values from current `buildings.market`. `settlementAppearance.ts` stores configurable market-level thresholds (1/2/3) and future development-point thresholds (3/10/20). Capitals retain their distinctive asset at any development. Visual tier does not infer defensive fort investment or feed campaign mechanics. Babylonia has one primary placement per state and one capital (Babylon); primary artwork stays visible at province/detail scales. Named centres retain their existing settlement coordinates, while unnamed rural centres use suitable interior positions and their state names. Secondary Borsippa/Larsa references remain in campaign content. Capital support, defensive tier effects and income penalties are planned only in the README.

Positions are converted once from geographic anchors through `project()`. Artwork uses bottom-centre anchors; the renderer projects positions and keeps symbols upright, drawing them in ground-Y order. Only visibility and capped display size depend on the camera. Placement data, gameplay coordinates and ownership are never rewritten by the perspective toggle.

## Faction and derived dominion

```json
{
  "id": "babylon",
  "name": "Seleucids",
  "color": "#94692d",
  "seatSettlementId": "babylon-city"
}
```

`dominionSummary` derives its current state IDs, partially or fully held province IDs, income, garrisons and outer border. State ownership is the sole source of political control. A divided province may appear in multiple dominions' holdings without duplicating any state.

## Settlement

```json
{
  "id": "babylon-city",
  "name": "Babylon",
  "stateId": "babylon",
  "kind": "city",
  "x": 569,
  "y": 453
}
```

Authored source positions are longitude/latitude and are projected at scenario creation. `kind` is city, port or fort. Every settlement reference point must lie inside its own state's polygon.

## Commander and battle

```json
{
  "id": "string",
  "name": "string",
  "faction": "faction-id",
  "specialty": "string",
  "attack": 0,
  "defense": 0,
  "speed": 0,
  "leadership": 0,
  "troops": 0,
  "homeState": "recruitment-origin-state-id",
  "locationStateId": "current-state-id"
}
```

```json
{
  "stateId": "target-state-id",
  "playerCommander": "Commander snapshot",
  "enemyCommander": "Commander snapshot",
  "playerScore": 0,
  "enemyScore": 0
}
```

Movement changes current location while preserving recruitment origin. Successful conquest moves the attacking army to the captured state. Troop losses persist.

## Local event definition

```json
{
  "id": "event-id",
  "stateId": "target-state-id",
  "trigger": "develop|capture",
  "coin": 0,
  "text": "string"
}
```

Events resolve once per state and store their ID in that state's `resolvedEventIds`. The simple pipeline supports local development and capture hooks; branching narrative scenes are future work. Battle previews include any pending capture-event coin.

## Validation

- IDs are unique within collections; commander identities are unique across active and recruitable rosters.
- Every state belongs to exactly one connected province; child IDs and `provinceId` agree.
- States tile the campaign mainland without overlaps or unintended gaps.
- Province exteriors exactly match their child unions.
- Owners reference factions, settlements reference enclosing states, and commander homes/locations and battle targets reference states.
- Shapes, adjacency, province outlines and dominion frontiers derive from one shared-edge mesh.
- Provincial summaries update from state data; capturing one child cannot transfer its siblings.

`GameState` stores provinces, states, settlements, commanders, recruitables, selected state/commander IDs and an optional battle snapshot. Dominions, aggregates, phase and victory target are derived. No save/import format exists yet; future saves need explicit schema versioning and validation.
