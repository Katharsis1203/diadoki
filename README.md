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

`npm run benchmark:map` measures the core geometry and map-preparation operations. See [PERFORMANCE.md](PERFORMANCE.md) for the system audit, measured improvements, verification and remaining SVG painting costs. Gameplay and the existing illustration are preserved by these optimizations.

## Play

You lead the Seleucids from Babylon with eleven states across Babylonia and Susiana, 220 coin (including opening income), and three orders. Select a state on the map. Develop friendly territory for 25 coin, build a fort for 30 coin, recruit a local commander for 40 coin, or march an army through your connected states. To invade, put your commander in a friendly state bordering the target. Every successful campaign action uses one order; rejected actions spend nothing.

The map fills the screen behind the compact campaign controls. Its atlas palette uses warm land and brighter blue seas. Faction principal seats are marked by artifact-inspired seals: the Seleucid anchor, the Ptolemaic eagle on a thunderbolt, and an Antigonid Macedonian shield. Bold outlines show dominion boundaries, medium solid lines separate provinces, and fine lines divide their states. Dominion boundaries update after conquest, including inside divided provinces. See [FACTION_SYMBOLS.md](FACTION_SYMBOLS.md) for references and chronology.

Play begins with a view fitted to Babylonia. Select a state to highlight it and open a floating details/action layer with local stats, parent-province totals, and sibling navigation. Focus province (also the Province toolbar button) fits all its states to the screen. State names, province main settlements, armies and regional terrain appear at this normal gameplay scale; the province name stays in the interface. Detail reveals local terrain, tributaries, secondary settlements and troop counts, plus garrison/building information for the selected state. Overview shows dominions, principal seats and broad terrain. Manual zoom crossfades terrain detail smoothly. Names are omitted when they would overlap and become visible with closer zoom. Close details with the × button, Escape, or a click on the map background. Drag to pan, use the mouse wheel or +/− buttons for immediate zoom, and open Commanders or Command log from the bottom toolbar.

Babylon has a compact urban hinterland including Borsippa, the strongest starting economy in Babylonia, and a prominent seat marker. Sippar, Nippur, Uruk and Ur remain separate states; Larsa is a secondary settlement within Uruk. Mountains, foothills, deserts, woodland, wetlands and fertile valleys form authored geographic corridors beneath the political map. Terrain is illustrative and does not change campaign rules.

The **2.5D** toggle compares upright illustrated scenery with the flat map. It gently compresses the ground while keeping city silhouettes, palms, reeds and mountain relief upright. Scenery uses stable bottom-centre anchors and depth ordering; state geometry and gameplay stay unchanged. Adjust perspective in `mapProjection.ts`, and asset sizes/placements in `babyloniaScenery.ts`; see [MAP_GEOGRAPHY.md](MAP_GEOGRAPHY.md) for the layer architecture and tuning details.

Babylonia's visual settlement hierarchy gives each of its seven states one primary centre. Babylon is the province's sole capital and has the largest, distinctive city asset regardless of development. Other centres now derive their size and complexity from existing market development: level 0 homestead/camp, 1 village, 2 fortified town, and 3+ city. Sippar starts as a village; Nippur, Uruk, Ur, Diyala and Chaldaea start as small homesteads/camps. Existing named settlement locations are preserved. Borsippa and Larsa remain secondary references. Capital status is separate from settlement tier, and centre names appear once near the artwork. The editable thresholds and scales live in `settlementAppearance.ts`; the renderer only reads existing values and changes no campaign rules. This visual pass is confined to Babylonia.

Babylonia is the first province with individually authored district geography: selected Tigris and Euphrates reaches form shared borders, curved canal districts organize the urban states, and Chaldaea follows the dryland margin. Palm groves and reed beds form irregular patches beside richer fertile and marsh ground, with small cultivated parcels and subtle paper grain. The open plain is flanked by overlapping eastern mountain ranges and foothills, simplified to connected silhouettes in overview. Stronger faction tints and borders identify ownership, with lighter fills at province/local scale to reveal terrain. State details explain each landscape. Other provinces retain their earlier local vegetation and settlement detail; see [MAP_GEOGRAPHY.md](MAP_GEOGRAPHY.md).

### Italy-to-Ganges terrain foundation

**Overview** fits the full theatre from Italy and Sicily through Greece, Macedonia, Thrace, Anatolia, the Levant, Egypt/Cyrenaica, Mesopotamia, Persia, Bactria/Sogdiana, Arachosia/Gedrosia and the Indus/Punjab to **northern India through the Ganges plain**. Drag and wheel-zoom to inspect these regions. The deeper Balkans, steppes, Tibetan interior and southern India remain bare coastline context. Geographic region captions outside the playable scenario are navigation aids, not new provinces.

The physical foundation contains **88 ridge sections and 62 named river features**. Alps/Apennines, Pindus/Greek and island massifs, Taurus/Pontic/Armenian/Caucasus uplands, Zagros/Alborz, eastern desert hills, Hindu Kush/Pamir, Sulaiman/Makran and Himalaya use overlapping upright relief, foothills and shared rocky ground, with openings for valleys and passes. The Nile, Aegean rivers, Kura/Araxes, Tigris/Euphrates tributaries, Oxus/Jaxartes, Kabul/Indus tributaries and Ganges system supply geographic guides for future boundaries. Babylon's existing scenery stays in place and its plain stays open. Overview simplifies relief; closer views reveal upright peaks, with offscreen scenery, ground sections and waterways culled.

Natural Earth coastlines and selected rivers are embedded locally; missing major courses use documented illustrative vertices. There are no runtime map downloads or new rendering dependencies. `worldTerrain.ts` holds the theatre extent, region captions and extended ridge axes; `terrainBackbone.ts` combines the physical network and sampling rules. `riverCourses.ts` and `worldRiverCourses.ts` store imported watercourses. `npm run generate:world-terrain` reproduces the extended source data (Node and Python 3 required at authoring time); see [MAP_GEOGRAPHY.md](MAP_GEOGRAPHY.md) for sources and tuning.

This expands the terrain foundation, while the existing **48 playable states in ten provinces**, their geometry, adjacency, ownership and game rules remain unchanged. Local settlement/vegetation prototypes are still limited to Babylon. New province/state borders can subsequently be authored around the physical network.

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
- `src/game/mapGeometry.ts`: original territorial waterways and lakes.
- `src/game/worldMapGeometry.ts`: expanded embedded coastline context and additional lakes.
- `src/game/worldTerrain.ts`: Italy-to-Ganges extent, geographic captions and extended ridge axes.
- `src/game/stateGeometry.ts`: shared state mesh and interior label positions.
- `scripts/generate-map.mjs`: reproducible district/province subdivision (`npm run generate:map`).
- `src/game/geography.ts`: state outlines, adjacency and the three border scales derived from shared edges.
- `src/game/engine.ts`: pure state transitions, action legality, battle previews, income, and victory checks.
- `src/components/CampaignMap.tsx`: data-driven territorial rendering and principal-seat symbols.
- `src/game/mapView.ts`: zoom levels and label collision handling.
- `src/game/terrainContent.ts`: authored relief corridors, canals and local waterways.
- `src/game/terrainBackbone.ts`: whole-campaign ridge axes, valley clearances and joined river network.
- `src/game/riverCourses.ts` and `worldRiverCourses.ts`: embedded additional Natural Earth watercourses.
- `scripts/import-world-geography.mjs`: reproducible physical-data import (`npm run generate:world-terrain`).
- `src/components/CoreTerrain.tsx`: shared rocky ground and simplified overview relief.
- `src/game/babyloniaGeography.ts`: shared river reaches, canal/dryland cuts and state landscape descriptions.
- `src/game/babyloniaTerrain.ts`: state-specific terrain patches and schematic irrigation channels.
- `src/components/TerrainLayer.tsx`: non-interactive SVG terrain with three detail levels.
- `src/App.tsx`: campaign interface; all game changes go through the reducer.
- `tests/engine.test.ts`: campaign rule regression tests using Node's built-in runner.

Read [GAME_DESIGN.md](GAME_DESIGN.md) for direction, [RULES.md](RULES.md) for implemented mechanics, and [STATUS.md](STATUS.md) for limitations and next steps.
