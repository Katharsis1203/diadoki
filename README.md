# Diadochi

A browser-first, single-player, turn-based conquest prototype set in a fictionalized successor-war scenario. React, TypeScript, and Vite.

## Run

Use Node.js 22.13+ and npm.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run lint
npm run build
```

## Play

You lead the Seleucids from Babylon with eleven states across Babylonia and Susiana, 220 coin (including opening income), and three orders. Select a state on the map. Develop friendly territory for 25 coin, build a fort for 30 coin, recruit a local commander for 40 coin, or march an army through your connected states. To invade, put your commander in a friendly state bordering the target. Every successful campaign action uses one order; rejected actions spend nothing.

The map fills the screen behind the compact campaign controls. Its atlas palette uses warm land and brighter blue seas. Faction principal seats are marked by artifact-inspired seals: the Seleucid anchor, the Ptolemaic eagle on a thunderbolt, and an Antigonid Macedonian shield. Bold outlines show dominion boundaries, medium solid lines separate provinces, and fine lines divide their states. Dominion boundaries update after conquest, including inside divided provinces. See [FACTION_SYMBOLS.md](FACTION_SYMBOLS.md) for references and chronology.

Play begins with a view fitted to Babylonia. Select a state to highlight it and open a floating details/action layer with local stats, parent-province totals, and sibling navigation. Focus province (also the Province toolbar button) fits all its states to the screen. State names, province main settlements, armies and regional terrain appear at this normal gameplay scale; the province name stays in the interface. Detail reveals local terrain, tributaries, secondary settlements and troop counts, plus garrison/building information for the selected state. Overview shows dominions, principal seats and broad terrain. Manual zoom crossfades terrain detail smoothly. Names are omitted when they would overlap and become visible with closer zoom. Close details with the × button, Escape, or a click on the map background. Drag to pan, use the mouse wheel or +/− buttons for immediate zoom, and open Commanders or Command log from the bottom toolbar.

Babylon has a compact urban hinterland including Borsippa, the strongest starting economy in Babylonia, and a prominent seat marker. Sippar, Nippur, Uruk and Ur remain separate states; Larsa is a secondary settlement within Uruk. Mountains, foothills, deserts, woodland, wetlands and fertile valleys form authored geographic corridors beneath the political map. Terrain is illustrative and does not change campaign rules.

The **2.5D** toggle compares a Babylonia prototype with the flat map. The prototype gently compresses the ground while keeping city silhouettes, palms, reeds and eastern relief upright. Scenery uses stable bottom-centre anchors and depth ordering; state geometry and gameplay stay unchanged. Adjust perspective in `mapProjection.ts`, and asset sizes/placements in `babyloniaScenery.ts`; see [MAP_GEOGRAPHY.md](MAP_GEOGRAPHY.md) for the layer architecture and tuning details.

Babylonia's visual settlement hierarchy gives each of its seven states one primary centre. Babylon is the province's sole capital and has the largest, distinctive city asset regardless of development. Other centres now derive their size and complexity from existing market development: level 0 homestead/camp, 1 village, 2 fortified town, and 3+ city. Sippar starts as a village; Nippur, Uruk, Ur, Diyala and Chaldaea start as small homesteads/camps. Existing named settlement locations are preserved. Borsippa and Larsa remain secondary references. Capital status is separate from settlement tier, and centre names appear once near the artwork. The editable thresholds and scales live in `settlementAppearance.ts`; the renderer only reads existing values and changes no campaign rules. This visual pass is confined to Babylonia.

Babylonia is the first province with individually authored district geography: selected Tigris and Euphrates reaches form shared borders, curved canal districts organize the urban states, and Chaldaea follows the dryland margin. Palm groves and reed beds form irregular patches beside richer fertile and marsh ground, with small cultivated parcels and subtle paper grain. The open plain is flanked by overlapping eastern mountain ranges and foothills, simplified to connected silhouettes in overview. Stronger faction tints and borders identify ownership, with lighter fills at province/local scale to reveal terrain. State details explain each landscape. Other provinces retain their earlier detailed terrain pending separate passes; see [MAP_GEOGRAPHY.md](MAP_GEOGRAPHY.md).

Choose your field commander before invading. Battle plans show their exact outcome, troop losses, and treasury change. Resolve or retreat before issuing more orders. End turn to collect state income and refresh your three orders. Control 25 of 48 states to win. New game resets the session.

The map has 48 actual state polygons in 10 provinces, each containing three to seven adjoining states, with Natural Earth coastlines, lakes, and rivers. Shared borders determine invasion adjacency. State and province boundaries are approximate campaign regions, not exact historical borders; see [MAP_GEOGRAPHY.md](MAP_GEOGRAPHY.md). The Seleucids open from Babylon in this simplified scenario. Rivals hold position; there is no strategic AI, upkeep, troop replenishment, or save/load yet. Simple local development/capture events exist; branching narrative scenes remain future work. Progress resets on page reload.

## Planned settlement and province mechanics

**Future design — not implemented.** The current visual tiers and capital designation do not change combat, defense, income, ownership, AI or gameplay controls. Each province is intended to have exactly one capital; these mechanics should eventually apply equally to player and AI factions.

Development is intended to determine settlement size. The provisional full development-point thresholds are configurable and subject to balancing:

| Development points | Settlement appearance |
| --- | --- |
| 0–2 | Small homestead or camp |
| 3–9 | Village |
| 10–19 | Fortified town |
| 20+ | Large city |
| Province capital, at any value | Distinctive capital asset |

The current prototype does **not** have this development-point system: its authored development is a market level (initially 0–2), stored in `buildings.market`. The visual-only adaptation uses level 0 homestead, level 1 village, level 2 fortified town and level 3+ city. It reads the current market level without adding a development counter, upgrades, projects or income rules. The existing prototype Develop and Build fort actions retain their existing behaviour.

Fortification is intended to be a **separate investment**, adding walls or towers and defensive benefits independently of settlement size. The initial fortified-town graphic is a visual convention and must never automatically grant a combat bonus; choosing a graphic does not read or change defense. Dedicated development projects and city-founding actions remain future plans, alongside the capital-support and province-income design below. No new project, city-founding, fortification or terrain-movement mechanics are activated by this pass.

- **Villages** will be easiest to capture but hardest to defend, with minimal defensive protection.
- **Fortresses** will be harder to capture and provide strong defensive positions for consolidating territory.
- **Capitals** will be hardest to capture. Their additional province-support bonus will decrease as an attacker captures other states in the province. The capital will retain its intrinsic fortifications and defending army even after surrounding territory is lost. Recapturing supporting states will restore the corresponding capital-support bonus.
- States owned by a faction that does not control the province capital will produce reduced income. A provisional value is **60% of normal income**, subject to balancing. Capturing the capital will restore full income from that faction's owned states in the province; losing it will reapply the penalty. Owning the capital will never grant income from states owned by other factions.

This creates a choice between a difficult early capital assault to gain full income and taking surrounding states first to weaken the capital while receiving reduced income. Capital-support calculations, combat modifiers, income penalties, AI changes and associated gameplay UI remain future work.

## Project layout

- `src/game/geographyContent.ts`: named districts, province membership, initial owners, settlements and geographic cues.
- `src/game/data.ts`: scenario assembly and state types.
- `src/game/mapGeometry.ts`: embedded physical map features.
- `src/game/stateGeometry.ts`: shared state mesh and interior label positions.
- `scripts/generate-map.mjs`: reproducible district/province subdivision (`npm run generate:map`).
- `src/game/geography.ts`: state outlines, adjacency and the three border scales derived from shared edges.
- `src/game/engine.ts`: pure state transitions, action legality, battle previews, income, and victory checks.
- `src/components/CampaignMap.tsx`: data-driven territorial rendering and principal-seat symbols.
- `src/game/mapView.ts`: zoom levels and label collision handling.
- `src/game/terrainContent.ts`: authored relief corridors, canals and local waterways.
- `src/game/babyloniaGeography.ts`: shared river reaches, canal/dryland cuts and state landscape descriptions.
- `src/game/babyloniaTerrain.ts`: state-specific terrain patches and schematic irrigation channels.
- `src/components/TerrainLayer.tsx`: non-interactive SVG terrain with three detail levels.
- `src/App.tsx`: campaign interface; all game changes go through the reducer.
- `tests/engine.test.ts`: campaign rule regression tests using Node's built-in runner.

Read [GAME_DESIGN.md](GAME_DESIGN.md) for direction, [RULES.md](RULES.md) for implemented mechanics, and [STATUS.md](STATUS.md) for limitations and next steps.
