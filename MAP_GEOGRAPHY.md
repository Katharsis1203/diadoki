# Campaign map geography

The hierarchy is **Faction/Dominion → Province → State**. A state is an actual selectable and conquerable polygon. A province is the exact union of its child states. A dominion is the union of states currently controlled by a faction, including holdings in divided provinces.

## Districts

The map contains 10 provinces and 48 states:

| Province | States |
| --- | --- |
| Pontus (4) | Paphlagonia, Amasia, Comana Pontica, Trapezus |
| Cappadocia (5) | Morimene, Garsauritis, Mazaca, Tyanitis, Melitene |
| Cilicia (3) | Rough Cilicia, Tarsus, Issus |
| Phoenicia (3) | Arados, Byblos, Tyre |
| Syria (4) | Aleppo, Hamath, Damascus, Palmyra |
| Assyria (5) | Upper Euphrates, Nisibis, Nineveh, Arbela, Assur |
| Babylonia (7) | Sippar, Babylon, Chaldaea, Nippur, Uruk, Diyala, Ur |
| Susiana (4) | Susa, Karun, Elymais, Cossaea |
| Media (7) | Atropatene, Ganzak, Zagros, Nisaean Plain, Ecbatana, Rhagae, Paraitakene |
| Armenia (6) | Sophene, Acilisene, Taron, Basen, Ararat, Tushpa |

Pontus occupies the southern Black Sea mainland, including its coast, and Assyria occupies northern Mesopotamia. Both have their own child states and derived exterior borders. There are no retained coarse playable territories or independently authored province polygons.

Names, centres, terrain, initial ownership, settlements and geography cues live in `src/game/geographyContent.ts`. Editing a name does not require changing the renderer. Names refer to approximate ancient districts or major places; the polygons are authored campaign catchments, not boundaries reconstructed for a fixed ancient year. Context includes [Iranica's Cappadocian districts and routes](https://www.iranicaonline.org/articles/cappadocia/), the [British Museum's Nineveh collection](https://www.britishmuseum.org/collection/galleries/assyria-nineveh), and the [Metropolitan Museum's Phoenician city-states](https://www.metmuseum.org/exhibitions/listings/2014/assyria-to-iberia/blog/posts/phoenicia-and-the-bible). The scenario's ownership and principal seats remain fictionalized.

Babylon now contains Borsippa as a secondary settlement, giving the capital a coherent urban hinterland. Larsa belongs to Uruk. Chaldaea and Diyala replace the crowded separate Borsippa/Larsa districts while preserving 48 states and eleven opening Seleucid holdings. Babylon's base income is 13 with a level-two market, for 21 income per turn; the opening faction income remains 98.

## Physical source and campaign extent

Coastlines, lakes, and major rivers use public-domain [Natural Earth 1:50m physical vectors](https://www.naturalearthdata.com/downloads/50m-physical-vectors/):

- [Land](https://naturalearth.s3.amazonaws.com/50m_physical/ne_50m_land.zip).
- [Lakes](https://naturalearth.s3.amazonaws.com/50m_physical/ne_50m_lakes.zip): Van, Urmia, Tuz and Sevan.
- [Rivers](https://naturalearth.s3.amazonaws.com/50m_physical/ne_50m_rivers_lake_centerlines.zip): Tigris and Euphrates.

`scripts/campaign-outline.json` is a single coastline-clipped mainland envelope from Anatolia and the Levant to lower Mesopotamia and western Iran. The Black Sea coast is included, while the western Arabian desert is outside the playable envelope. Every position within this campaign mainland belongs to exactly one state. Lighter surrounding land is geographic context; offshore islands and the wider background are outside this scenario. Coastal settlement reference points are placed on the mainland at this map's scale.

`src/game/mapGeometry.ts` embeds physical scenery. The app needs no mapping API or runtime network request. The source reflects modern physical geography rather than a reconstructed ancient shoreline.

## Generation and exact territorial hierarchy

```sh
npm run generate:map
npm test
```

`scripts/generate-map.mjs` starts from the single campaign envelope and district centres in the content file. Nearest-centre catchments establish irregular districts around cities and travel hubs. Shared internal edges bend towards nearby rivers and the same mountain corridors used by the relief renderer, with bounded deviations. River attraction is suppressed near settlements so urban hinterlands can span both banks. The generator validates the partition and reduces curvature if a narrow city district would intersect another state. It does not repeatedly slice provinces with horizontal or vertical lines.

Each shared edge is authored once and reused in reverse by its neighbor. The generator nodes every junction, clips the coast, validates settlement placement and checks that the combined states exactly cover the mainland. Provincial reference outlines and label anchors are calculated from each child union. Generated data is stored in `src/game/stateGeometry.ts`; polygon clipping runs only at authoring time.

### Babylonia: first authored province pass

Babylonia now receives an explicit district partition after the initial catchments are generated. `babyloniaGeography.ts` defines shared water reaches, gently curved canal districts and a western dryland margin. River boundaries reuse the actual displayed Tigris/Euphrates vertices. Babylonia's eastern provincial seam follows the eastern bank of the lower Tigris with a small land margin, leaving the river consistently inside the province. Curved approaches join the Diyala foothills and southern marsh margin. The adjoining Susiana districts receive the same shared seam, while their existing interiors and other provinces remain in place. The generator clips the internal districts to the revised province envelope, assigns the remaining connected interfluve to Nippur, and nodes every new junction; adjacency derives from the shared mesh.

| State | Landscape and boundary logic |
| --- | --- |
| Sippar | Upper Euphrates farms; eastern Tigris bank and southern canal district. |
| Babylon | Babylon/Borsippa urban hinterland spanning the Euphrates, with canal districts to the north and south and a Tigris bank to the east. |
| Chaldaea | Western dryland; winding eastern margin follows the transition into irrigation country. |
| Nippur | Canal-fed interfluve, lower Tigris bank and downstream reed beds. |
| Uruk | Shared Uruk/Larsa cultivated plain, with a northern canal district and southern Euphrates bends. |
| Diyala | East of the Tigris, with irrigated lowlands and small northeastern foothill groups. |
| Ur | Lower floodplain south of the Euphrates bends; marshes taper toward the southern dryland. |

`babyloniaTerrain.ts` supplies deliberately placed palm groves, reed beds, foothills and dryland patches with unequal spacing and varied silhouettes. State clips keep these symbols in their intended landscape, and clearances leave room around names and settlements. Generic corridor symbols are excluded inside this province; surrounding provinces still await individual review. Each state has a landscape description in its details layer.

The physical interpretation draws on [the Met's account of the irrigated southern alluvial plain](https://www.metmuseum.org/exhibitions/listings/2003/art-of-the-first-cities) and [USGS's description of the lower river/marsh landscape](https://eros.usgs.gov/earthshots/about-the-marshes). These inform broad landscape patterns. Canal lines, catchments and dryland margins are authored campaign geography; they do not assert ancient administrative boundaries or precise ancient waterways. Major rivers still use modern Natural Earth data.

`src/game/geography.ts` derives selection polygons, shared-edge adjacency, administrative outlines and ownership frontiers from this mesh. A province's runtime `borderPath` includes its exterior edges, excluding all edges shared by its own children. Neither province nor dominion owns an independently selectable polygon. Touching at a corner does not permit movement or invasion.

Coordinates use a regional equirectangular projection:

```text
x = 60 + (longitude - 29) × 33
y = 35 + (43 - latitude) × 40
```

To add a district, add its data and centre in `geographyContent.ts`, regenerate and run validation. Rendering code does not need a new state-specific branch.

## Borders, labels and principal seats

- Dominion: thick ink with faction-coloured bands, recalculated after each state conquest.
- Province: medium solid boundary between different administrative groups.
- State: thin, subtle internal district boundary.
- Below 1.35 manual zoom: dominion names, principal seats and broad physical features.
- Normal province view: state names, province main settlements, armies and regional terrain; province names appear in the interface.
- From 3.8 manual zoom: local terrain, secondary settlements, troop counts and selected-state garrison/building information. Detail can explicitly choose this view at any zoom.
- Focus province fits the selected province's child polygons to the viewport, reserving space for the desktop details layer, and explicitly chooses regional detail. The initial view focuses Babylonia.
- Selected state: stronger local outline and light parent-province highlight.

Faction names fade away before competing with state labels. Label sizes remain readable in screen pixels; nearby names are omitted when they would overlap and become visible with closer zoom. Alternate state-label positions remain inside their polygons, and difficult districts can supply a manual `labelPosition` in longitude/latitude. The generator validates these overrides. Selection remains available for every state at every scale.

The three faction coins appear at data-defined principal seats: Babylon, Damascus and Mazaca. They do not appear on every province or state. A faction loses its seat marker when it loses that state. Each province also defines a main settlement, shown by a small ring at province/detail scales. A faction seal takes precedence where the same city serves both roles. Other settlement dots appear in local detail or the selected state. These provincial designations persist after conquest. The faction legend explains the symbols; see [FACTION_SYMBOLS.md](FACTION_SYMBOLS.md).

## Illustrated terrain

`src/game/terrainContent.ts` defines connected geographic corridors for mountains, foothills, deserts, steppe, forests, marshes, fertile valleys and coastal plains, plus canals and minor waterways. `TerrainLayer.tsx` renders reusable SVG symbols with light from the upper left, faint relief washes and restrained shadows. The layer is clipped to physical land, stays beneath borders and markers, and never intercepts pointer events. Features reserve an optional modifier reference for later rules; terrain currently has no gameplay effects.

Colour washes use overlapping radial gradients with tapered widths and gently varied edges, fading into transparent parchment rather than forming rounded bands. These washes are shared across detail levels to avoid doubling their colour during transitions. River fertility shading receives a small blur separately from the sharp water lines and symbols.

Macro detail uses broad washes without individual symbols. Regional detail shows simplified chains and major landscape groupings. Local detail uses finer clusters and reveals tributaries and secondary features. Manual zoom crossfades macro to regional between 1.1–1.85 and regional to local between 3.2–4.3; macro and local never appear together. Explicit Province and Detail controls select a single terrain level. Symbol size is capped in screen pixels, and reduced-motion preferences disable opacity transitions.

Major rivers have a faint bank highlight and fertility wash. Province, state and selection outlines remain visible over river water. Only broad faction colour bands are masked over the water; the thin frontier ink remains continuous. The selected province uses a stronger outline. Coastlines receive a shallow-water edge. Roads and pass routes are not drawn. The authored relief and canals are approximate campaign illustration, not surveyed historical geography.

## Switchable Babylonia 2.5D prototype

The **2.5D** toolbar toggle enables the prototype by default and restores the existing flat illustration when disabled. `mapProjection.ts` supplies one fixed affine ground projection, shared by the SVG ground group, province camera fitting, marker/label anchors and drag conversion. Canonical state geometry, settlement coordinates, ownership and gameplay remain unchanged. The continuous ground uses modest vertical compression; upright replacement scenery is confined to Babylonia and the immediately adjoining eastern terrain.

Ground washes, rivers, canals and clickable polygons share the projected ground group. Scenery sits in a separate upright layer; borders are drawn above it, followed by markers and collision-aware labels. Each transparent SVG symbol has a bottom-centre origin, lit upper-left faces and darker right faces. Small ellipse shadows replace per-object filters. Objects draw in ground-Y order. Primary centres and mountain groups reserve label space; overlapping vegetation hides without moving its authored anchors. Fine scenery disappears in dominion overview, where connected ridge silhouettes remain; every primary centre stays visible at province/detail scales, while secondary vegetation groups are revealed in local detail.

Faction colours use stronger ochre, blue and red tones throughout the map and seat markers. Translucent ownership polygons multiply the terrain colour underneath: opacity is `0.30` in overview, `0.10` at province scale and `0.065` in local view. Outer faction bands are strongest in overview; a thin faction edge remains visible along rivers. Hover uses a pale ground highlight, while selection adds a dark dashed state outline and a solid province outline.

`babyloniaRanges.ts` stores the eastern Zagros/Cossaea/Elymais ridge sections, with valley gaps, uneven peak heights and overlapping shoulders/foothills. The same anchors generate rocky ground washes and simplified overview outlines. Upright peaks grow with zoom, retaining their relative sizes under a generous close-view cap. Relief remains outside the Babylonian plain. `BabyloniaSurface.tsx` adds softly blended earth/marsh patches, small cultivated canal parcels and a few grouped soil marks. Richer fertile and wetland washes continue below political overlays; palms and reeds form fixed clusters beside suitable waterways.

The original local `public/textures/parchment-grain.png` is a small transparent grain texture. Its pattern compensates for SVG scale and ground compression so grain stays approximately one screen pixel, while its origin stays in map space. Earth patches, fields and terrain keep fixed map anchors and scale with the ground. The texture has no runtime generation or external asset dependency, and no per-object filters are added.

The settlement hierarchy is confined to Babylonia: Babylon uses the largest distinctive city asset regardless of development. Other centres read existing `buildings.market` levels through `settlementAppearance.ts`: 0 homestead/camp, 1 village, 2 fortified town and 3+ large city. These explicitly adapt the future 0–2/3–9/10–19/20+ development-point thresholds to the current small market-level scale. Each state has one primary centre with a nearby single name. Named centres keep their original locations, and rural centres use sensible positions within their states. `isCapital` is independent of `tier`, ownership and the existing faction-seat marker. Fortification is not inferred from visual tier. Borsippa and Larsa remain secondary references rather than extra primary artwork. Susa uses its original map marker. These visual fields do not feed campaign rules; the proposed mechanics are recorded as future design in the README.

`terrainBoundaries.ts` now authors coarse ridge, foothill and valley cuts around Diyala, Zagros, Nisaea, Cossaea, Susa and Elymais. The generator moves shared junctions once and replaces each common boundary in both rings, then rebuilds the shared mesh, labels, adjacency and exact province unions. Nisaea stays on the eastern side of the northern Zagros crest; Cossaea retains a substantial connected mountain district between the plain margins, with an explicit connecting saddle toward Elymais. Babylon's existing river/canal districts and eastern Tigris-bank frontier persist. These cuts use geographic backbones rather than individual artwork positions; mountain symbols and placements are unchanged. State IDs, owners and province memberships remain intact. No terrain-based movement rules are added.

- Perspective strength: `PERSPECTIVE_Y_SCALE` in `src/game/mapProjection.ts` (currently `0.84`; `1` is flat).
- Overall asset size: `SCENERY_SCALE` in `src/game/babyloniaScenery.ts`; individual `scale` values and screen-size caps allow finer adjustments.
- Placements: the `babyloniaScenery` array stores asset, canonical map position, scale, variant and optional settlement/detail references. Geographic anchors are converted once with the existing `project()` function. No random positions or saved-game mutations are involved.
- Artwork: reusable variants in `src/components/BabyloniaScenery.tsx`. All share the `-24 -40 48 40` viewBox and base at `(0,0)`.
- Footprint: `SCENERY_ZONE` controls where the prototype replaces engraved symbols. Ground washes remain to keep the plain subtly fertile and open.
- Ridge placement/density: `babyloniaRanges.ts` and the derived mountain/foothill groups in `babyloniaScenery.ts`.
- Geographic boundaries: `terrainBoundaries.ts`, applied by `npm run generate:map`. Settlement appearance thresholds and tier scales: `settlementAppearance.ts`.
- Surface colour/detail: wash colours/opacity in `TerrainLayer.tsx` and fixed patches/parcels in `BabyloniaSurface.tsx`. Ownership intensity and border widths live in `App.css`; faction colours live in `data.ts`.

Projection regressions cover coordinate round trips, unchanged territory resolution, exact screen drag distances, responsive province fitting, stable scenery anchors, detail visibility, depth ordering and relief outside the Babylonian plain. Browser checks also compare flat/prototype views and verify upright artwork, scenery anchors at multiple zooms, touch selection, borders, conquest and responsive controls.

## Validation

Regression coverage includes polygon intersections, gaps, exact campaign coverage, exact province unions, shared-edge orientation, connected provinces, unique membership, settlements inside states, Babylon/Borsippa content, Pontus/Assyria point resolution, independent ownership, local movement/buildings/events, frontier changes and a complete winning campaign. Camera tests fit every province on desktop, portrait and landscape screens, and terrain tests check continuous detail weights and explicit overrides. Browser checks click all 48 actual state polygons, verify all ten province views and their state labels, and cover label collisions, three detail scales, conquest, panning and responsive controls.

Babylonia-specific regressions verify substantial shared river segments along both rivers, Babylon's territory on both banks, landscape metadata, and the desert/marsh state classifications. The province-pass browser checks also cover local detail text and touch selection. Regressions also sample the lower Tigris to confirm it stays in Babylonia without crossings of the provincial frontier, and validate every province's main settlement reference.
