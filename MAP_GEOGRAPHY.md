# Campaign map geography

The hierarchy is **Faction/Dominion → Province → State**. A state is selectable and conquerable land, excluding independent mountain belts. A province is the exact union of its child states' passable land. A dominion is the union of states currently controlled by a faction, including holdings in divided provinces. Mountains belong to no state or faction; armies cross them only through authored passes or travel around them through connected valleys.

## Districts

The map contains 10 provinces and 47 states:

| Province | States |
| --- | --- |
| Pontus (4) | Paphlagonia, Amasia, Comana Pontica, Trapezus |
| Cappadocia (5) | Morimene, Garsauritis, Mazaca, Tyanitis, Melitene |
| Cilicia (3) | Rough Cilicia, Tarsus, Issus |
| Phoenicia (3) | Arados, Byblos, Tyre |
| Syria (4) | Aleppo, Hamath, Damascus, Palmyra |
| Assyria (5) | Upper Euphrates, Nisibis, Nineveh, Arbela, Assur |
| Babylonia (5) | Sippar, Babylon, Chaldaea, Nippur, Diyala |
| Susiana (5) | Susa, Karun, Elymais, Mountain Entrance, Western Valley |
| Media (7) | Atropatene, Ganzak, Zagros, Nisaean Plain, Ecbatana, Rhagae, Paraitakene |
| Armenia (6) | Sophene, Acilisene, Taron, Basen, Ararat, Tushpa |

Pontus occupies the southern Black Sea mainland, including its coast, and Assyria occupies northern Mesopotamia. Both have their own child states and derived exterior borders. There are no retained coarse playable territories or independently authored province polygons.

Names, centres, terrain, initial ownership, settlements and geography cues live in `src/game/geographyContent.ts`. Editing a name does not require changing the renderer. Names refer to approximate ancient districts or major places; the polygons are authored campaign catchments, not boundaries reconstructed for a fixed ancient year. Context includes [Iranica's Cappadocian districts and routes](https://www.iranicaonline.org/articles/cappadocia/), the [British Museum's Nineveh collection](https://www.britishmuseum.org/collection/galleries/assyria-nineveh), and the [Metropolitan Museum's Phoenician city-states](https://www.metmuseum.org/exhibitions/listings/2014/assyria-to-iberia/blog/posts/phoenicia-and-the-bible). The scenario's ownership and principal seats remain fictionalized.

Babylon contains Borsippa and the former western Nippur peninsula. Sippar extends into former northwestern Diyala up to the displayed tributary; Diyala stays on the other bank. Nippur fills the remaining Euphrates–Tigris interfluve. Uruk, Ur and Chaldaea merge into the lower-country Chaldaea state, strictly south of the Euphrates; the fixed Uruk/Larsa settlement references now belong to Nippur, while Ur belongs to Chaldaea. Babylon provides 21 income per turn, and merged Chaldaea retains the former three districts’ combined base income of 11. The campaign has 47 states, ten opening Seleucid holdings, income 106 and treasury 228. Susa retains a base income of 20 plus its level-one market.

## Physical source and campaign extent

Coastlines, lakes, and major rivers use public-domain [Natural Earth 1:50m physical vectors](https://www.naturalearthdata.com/downloads/50m-physical-vectors/):

- [Land](https://naturalearth.s3.amazonaws.com/50m_physical/ne_50m_land.zip).
- [Lakes](https://naturalearth.s3.amazonaws.com/50m_physical/ne_50m_lakes.zip): Van, Urmia, Tuz and Sevan.
- [Rivers](https://naturalearth.s3.amazonaws.com/50m_physical/ne_50m_rivers_lake_centerlines.zip): Tigris and Euphrates.

`scripts/campaign-outline.json` is a single coastline-clipped mainland envelope from Anatolia and the Levant to lower Mesopotamia and western Iran. The Black Sea coast is included, while the western Arabian desert is outside the playable envelope. Every position within this campaign mainland belongs to exactly one state or independent mountain terrain. Lighter surrounding land is geographic context; offshore islands and the wider background are outside this scenario. Coastal settlement reference points are placed on the mainland at this map's scale.

`src/game/mapGeometry.ts` preserves the original territorial waterways/lakes; `worldMapGeometry.ts` supplies the extended coastline and lake context. The app needs no mapping API or runtime network request. The source reflects modern physical geography rather than a reconstructed ancient shoreline.

### Italy-to-Ganges terrain foundation

The geographic theatre extends from **7°E to 92.5°E, 21.5°N to 47°N**, including northern India through the Ganges plain. Italy/Sicily, Greece/Macedonia/Thrace, Aegean islands/Crete/Cyprus, Anatolia, the Levant, Egypt/Cyrenaica, Mesopotamia/Armenia, Persia, Bactria/Sogdiana, Arachosia/Gedrosia and Indus/Punjab receive core relief and waterways. The deeper Balkans, steppes, Tibetan interior and southern India are bare context. This is a terrain expansion, not a playable-state expansion: the 48 states and ten provinces above retain their exact geometry, membership, ownership, adjacency and settlements.

`worldTerrain.ts` stores the extent, geographic region captions and 65 extended ridge sections. `terrainBackbone.ts` combines these with 20 regional sections and the three unchanged Babylon-adjacent sections: **88 total**. Alps/Apennines, Pindus/Greek and island massifs, Caucasus, Pontic/Taurus/Armenian uplands, Lebanon, Zagros/Alborz/Kopet Dag, eastern desert/Sinai hills, Paropamisus/Hindu Kush/Pamir, Sulaiman/Kirthar/Makran and Himalaya/Aravalli/Vindhya margins form broad geographic divisions. The axes are authored illustrations informed by [Natural Earth's physical-region data](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/), not surveyed ridge crests or historical administrative borders. Section gaps and water clearance retain valleys and passes; no mountains are added to fill the Babylonian, Nile, Punjab or Ganges plains.

The combined network has **62 named river features**, including both unchanged territorial Tigris/Euphrates paths. `riverCourses.ts` retains the regional imports (10m v5.0.0, simplified at 0.018°, plus 50m upper Euphrates). `worldRiverCourses.ts` adds 44 selected [Natural Earth 10m rivers and Europe supplement](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/) v5.0.0, simplified at 0.025°. This includes Italian/Aegean/western Anatolian drainages, Nile/delta, Jordan/Kura, eastern Iranian rivers, Oxus/Jaxartes, Indus/Punjab tributaries and Ganges/Yamuna tributaries, Narmada and Bengal reaches of the Brahmaputra. Dataset aliases Treska and Enipefs supply the generalized Axios/Vardar and Peneios/Enipeus corridors; these are illustrative campaign-scale waterways.

Seyhan, Orontes, Greater Zab, Lesser Zab, Diyala, Karun and Kabul use editable approximate courses. Tributary mouths snap to the displayed parent channel; a distant mouth fails validation rather than drawing an invented connecting reach. [FAO's Iraqi basin description](https://www.fao.org/4/W4356E/w4356e0e.HTM), [Iranica's Karun geography](https://www.iranicaonline.org/articles/karun-river/karun-river-i-geography-and-hydrology/) and [FAO's Afghanistan basin description](https://www.fao.org/4/w4356e/w4356e07.HTM) provide broad hydrological context. These remain modern/approximate physical guides, not reconstructed ancient hydrography.

`worldMapGeometry.ts` embeds Natural Earth 50m land v4.1.0 and additional lakes v5.0.0 (Dead Sea, Sea of Galilee and Skadar). Theatre coastlines keep their source vertices; land outside the Alps-to-Bengal crop is omitted. Land fills and actual shorelines are clipped separately, so rectangle cuts never become false coastlines. Inland holes and sea clearance keep new peak anchors on land. Multipart lakes share one stable rendered feature. The app has no mapping API, runtime data requests or new dependency.

Reproduce extended coastlines and imported rivers with `npm run generate:world-terrain` (Node 22.13+ and Python 3 for ZIP extraction). The importer caches downloaded sources in the OS temporary directory; use `node --experimental-strip-types scripts/import-world-geography.mjs /path/to/cache` to retain a specific source cache. Rerunning against the same cache produces byte-identical output. This command does not regenerate state geometry.

Rocky ground, upright peaks and overview silhouettes share the same geographic axes. `CoreTerrain.tsx` uses reusable radial washes and lightweight shadows; new river fertility corridors use translucent strokes. `campaignScenery` adds relief to unchanged Babylonian scenery with one stable depth order. Scenery, ground sections and river artwork are culled to actual viewport bounds; river border masks cover only the visible window and channels near playable states. Screen-sized paper grain uses a map-anchored pattern clipped to land and the viewport. Decorative artwork allows pointer events through.

Overview fits the cropped theatre responsively; the minimum zoom is 0.2. Province focus and immediate cursor-anchored wheel zoom retain the shared canonical projection. Camera movement stops at the crop with a 32-screen-pixel edge margin; an axis already fitting on screen stays centred. Cursor anchoring remains exact in the interior and yields to those limits at an edge. Region captions identify terrain outside the playable mesh without creating fictitious owners or state controls. Labels remain upright, prefer open ground and have ink halos above dense relief.

Tune extended ridge axes/widths/scales, region captions and theatre bounds in `worldTerrain.ts`; regional axes and approximate courses in `terrainBackbone.ts`; peak spacing/water clearance in `backbonePeaks`; imported selections in `scripts/import-world-geography.mjs`; and shared artwork size in `SCENERY_SCALE`. The existing boundary generator still uses its established geographic cues, leaving state geometry byte-identical. A later territorial pass can adopt these richer physical guides and validate new partitions province by province.

## Generation and exact territorial hierarchy

```sh
npm run generate:map
npm run generate:theatre
npm run generate:barriers
npm run generate:ground
npm test
```

`scripts/generate-map.mjs` starts from the single campaign envelope and district centres in the content file. Nearest-centre catchments establish irregular districts around cities and travel hubs. Shared internal edges bend towards nearby rivers and the same mountain corridors used by the relief renderer, with bounded deviations. River attraction is suppressed near settlements so urban hinterlands can span both banks. The generator validates the partition and reduces curvature if a narrow city district would intersect another state. It does not repeatedly slice provinces with horizontal or vertical lines.

Each shared edge is authored once and reused in reverse by its neighbor. The generator nodes every junction, clips the coast, validates settlement placement and checks that the combined states exactly cover the mainland. Provincial reference outlines and label anchors are calculated from each child union. Generated data is stored in `src/game/stateGeometry.ts`; polygon clipping runs only at authoring time.

These shared meshes are administrative catchments used for authoring and camera fitting. `generate:barriers` subtracts 89 mountain belts from both the campaign and atlas, generating actual state/province multipolygons in `mountainGeometry.ts`. Ownership fills, pointer targets, point queries, selection outlines and cultivated terrain clips use this passable geometry. Border strokes stop a little before the belts. Low foothills remain traversable. Seven named pass corridors remain open, and an authored clearing preserves the existing cultivated Persepolis basin between the ridges.

The generator also builds a graph of connected land components. Army movement follows friendly components; a split state cannot teleport troops across a ridge. Invasions and retreat routes require adjacent reachable components. Administrative neighbours can therefore share a mountain frontier without offering a direct army route. Terrain ownership and pass markers persist when mountain artwork is hidden. `mountainTerrain.test.ts` verifies unowned mountains, blocked moves/invasions, pass connectivity and complete campaign reachability; `check:browser-mountains` verifies actual SVG hit areas, border clipping and settings on desktop and mobile.

### Babylonia: first authored province pass

Babylonia now receives an explicit district partition after the initial catchments are generated. `babyloniaGeography.ts` defines shared Euphrates, Tigris and Diyala reaches, a curved Babylon/Nippur division, and the merged lower-country envelope. River boundaries reuse the actual displayed Tigris/Euphrates vertices. Babylonia's eastern provincial seam follows the eastern bank of the lower Tigris with a small land margin, leaving the river consistently inside the province. Curved approaches join the Diyala foothills and southern marsh margin. The adjoining Susiana districts receive the same shared seam, while their existing interiors and other provinces remain in place. The generator clips the internal districts to the revised province envelope, assigns the remaining connected interfluve to Nippur, and nodes every new junction; adjacency derives from the shared mesh.

| State | Landscape and boundary logic |
| --- | --- |
| Sippar | Upper river country, ending at the Euphrates in the south and Diyala tributary in the east. |
| Babylon | Enlarged Babylon/Borsippa hinterland and western dryland bulge; river-led north and shared curved division with Nippur. |
| Chaldaea | Merged southern country, strictly south of the Euphrates, spanning dryland, lower floodplain and Gulf marshes. |
| Nippur | Remaining Euphrates–Tigris interfluve, including the Uruk/Larsa town references; no western dryland tongue. |
| Diyala | East of the Diyala tributary and Tigris, with irrigated lowlands and northeastern foothills. |

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

## Fixed 2.5D scenery

The map always renders upright 2.5D scenery; the flat-view toolbar toggle has been removed. `mapProjection.ts` supplies one fixed affine ground projection, shared by the SVG ground group, province camera fitting, marker/label anchors and drag conversion. Canonical state geometry, settlement coordinates, ownership and gameplay remain unchanged. The continuous ground uses modest vertical compression; upright mountain relief now covers the campaign, while settlement and vegetation artwork covers Babylonia, Susiana and Assyria.

Ground washes, rivers, canals and clickable polygons share the projected ground group. Scenery sits in a separate upright layer; borders are drawn above it, followed by markers and collision-aware labels. Each transparent SVG symbol has a bottom-centre origin, lit upper-left faces and darker right faces. Small ellipse shadows replace per-object filters. Objects draw in ground-Y order. Primary centres and mountain groups reserve label space; overlapping vegetation hides without moving its authored anchors. Fine scenery disappears in dominion overview, where connected ridge silhouettes remain; every primary centre stays visible at province/detail scales, while secondary vegetation groups are revealed in local detail.

Faction colours use stronger ochre, blue and red tones throughout the map and seat markers. Translucent ownership polygons multiply the terrain colour underneath: opacity is `0.30` in overview, `0.10` at province scale and `0.065` in local view. Outer faction bands are strongest in overview; a thin faction edge remains visible along rivers. Hover uses a pale ground highlight, while selection adds a dark dashed state outline and a solid province outline.

`babyloniaRanges.ts` stores the eastern Zagros/Cossaea/Elymais ridge sections, with valley gaps, uneven peak heights and overlapping shoulders/foothills. The same anchors generate rocky ground washes and simplified overview outlines. Upright peaks grow with zoom, retaining their relative sizes under a generous close-view cap. Relief remains outside the Babylonian plain. `BabyloniaSurface.tsx` adds softly blended earth/marsh patches, small cultivated canal parcels and a few grouped soil marks. Richer fertile and wetland washes continue below political overlays; palms and reeds form fixed clusters beside suitable waterways.

The original local `public/textures/parchment-grain.png` is a small transparent grain texture. Its pattern compensates for SVG scale and ground compression so grain stays approximately one screen pixel, while its origin stays in map space. Earth patches, fields and terrain keep fixed map anchors and scale with the ground. The texture has no runtime generation or external asset dependency, and no per-object filters are added.

The settlement hierarchy is confined to Babylonia: Babylon uses the largest distinctive city asset regardless of development. Other centres read existing `buildings.market` levels through `settlementAppearance.ts`: 0 homestead/camp, 1 village, 2 fortified town and 3+ large city. These explicitly adapt the future 0–2/3–9/10–19/20+ development-point thresholds to the current small market-level scale. Each state has one primary centre with a nearby single name. Named centres keep their original locations, and rural centres use sensible positions within their states. `isCapital` is independent of `tier`, ownership and the existing faction-seat marker. Fortification is not inferred from visual tier. Borsippa, Uruk, Larsa and Ur remain secondary references rather than extra primary artwork. Susiana has one illustrated centre per state: Susa is the sole capital, with separate development-driven centres in Karun, Elymais and Mountain Entrance. These visual fields do not feed campaign rules; the proposed mechanics are recorded as future design in the README.

`terrainBoundaries.ts` now authors coarse ridge, foothill and valley cuts around Diyala, Zagros, Nisaea, Cossaea, Susa and Elymais. The generator moves shared junctions once and replaces each common boundary in both rings, then rebuilds the shared mesh, labels, adjacency and exact province unions. Nisaea stays on the eastern side of the northern Zagros crest; Cossaea’s administrative catchment spans the terrain between the plain margins. Its actual territory now excludes mountain belts, and travel uses the connected valley land. Babylon's existing river/canal districts and eastern Tigris-bank frontier persist. These cuts use geographic backbones rather than individual artwork positions; mountain symbols and placements are unchanged. State IDs, owners and province memberships remain intact. This earlier catchment pass did not add terrain-based movement rules; the independent-mountain pass described above now supplies them.

- Perspective strength: `PERSPECTIVE_Y_SCALE` in `src/game/mapProjection.ts` (currently `0.84`; `1` is flat).
- Overall asset size: `SCENERY_SCALE` in `src/game/babyloniaScenery.ts`; individual `scale` values and screen-size caps allow finer adjustments.
- Placements: the `babyloniaScenery` array stores asset, canonical map position, scale, variant and optional settlement/detail references. Geographic anchors are converted once with the existing `project()` function. No random positions or saved-game mutations are involved.
- Artwork: reusable variants in `src/components/BabyloniaScenery.tsx`. All share the `-24 -40 48 40` viewBox and base at `(0,0)`.
- Footprint: `SCENERY_ZONE` controls where the prototype replaces engraved symbols. Ground washes remain to keep the plain subtly fertile and open.
- Ridge placement/density: `babyloniaRanges.ts` and the derived mountain/foothill groups in `babyloniaScenery.ts`.
- Geographic boundaries: `terrainBoundaries.ts`, applied by `npm run generate:map`. Settlement appearance thresholds and tier scales: `settlementAppearance.ts`.
- Surface colour/detail: shared palettes and brushes in `groundBrushes.ts` / `groundSurface.ts`; fine symbols and parcels in `TerrainLayer.tsx` / `BabyloniaSurface.tsx`. Ownership intensity and border widths live in `App.css`; faction colours live in `data.ts`.

Projection regressions cover coordinate round trips, unchanged territory resolution, exact screen drag distances, responsive province fitting, stable scenery anchors, detail visibility, depth ordering and relief outside the Babylonian plain. Browser checks verify upright artwork, scenery anchors at multiple zooms, touch selection, borders, conquest and responsive controls.

The performance pass separates camera-independent scene preparation (`mapScene.ts`) from viewport visibility and SVG layers (`MapLayers.tsx`). Static terrain/artwork and political layers are memoized, while camera-dependent anchors, labels and caps update when their inputs change. Coordinate arrays, bounds, edge strings and adjacency are prepared once; generated province/campaign outlines reference the shared mesh instead of duplicating coordinates. Coordinate exports and geometry are unchanged. See [PERFORMANCE.md](PERFORMANCE.md) for measurements and remaining painting costs.

### Prepared ground rendering

The default shaded map uses `PreparedGroundMap.tsx` and `usePreparedGround.ts`. `preparedGroundLayout.ts` divides the theatre into 512-map-unit chunks with 0.5/2 pixel-per-map-unit image resolutions and the existing dominion/province/state colour strengths. Visible chunks are prioritised, with coarse theatre coverage and budgeted neighbours preloaded. Static sand, coastal shallows/ink, rocky ground, earth and fertile river washes are painted ahead of time; pan and zoom never generate or encode Canvas tiles. Grain, sharp waterways, fields, political colours, borders, labels and upright scenery remain live.

Images are painted from unchanged source coastlines and land/lake holes using the same painter as the runtime comparison. Exact SVG physical-land masks remain available for grain, rivers and fallback; close views also retain vector coastline ink. Geographic queries, playable/draft geometry and interaction are unchanged. Ground colour is sampled from mip images rather than recalculated at each zoom; fine close views may show small resampling differences, while labels/rivers/scenery remain sharp. Shared snapped chunk clips and four-pixel sampling bleed avoid seams. Until a fine chunk decodes, it uses its loaded coarse image. Before either image is ready, a cheap native land/coast base remains selectable. Missing/corrupt fine images retain coarse coverage without reconstructing detailed vector shading. All decoration allows pointer events through.

There are 126 generated lossless PNGs (approximately 12.13 MiB total) in `public/textures/ground`, with content-hashed names recorded in `preparedGroundManifest.ts`. The whole set is shipped; `preparedGroundPlan.ts` requests visible coarse coverage, visible detail, the retained buffer, the remaining coarse theatre and budgeted neighbouring detail, in that order. `useGroundTileCache.ts` shares a 64 MiB decoded-pixel budget, LRU eviction, obsolete-result rejection and object-URL release. Prepared files use three concurrent fetch/decode jobs; runtime painting remains serial. In-flight pixel reservations share the decoded budget. Obsolete file requests are aborted, and late results/rejections cannot replace or poison a newer request for the same key. Only one renderer's cache is active at a time. The prepared planner selects the coarse mip if fine viewport demand would exceed 75% of the decoded budget; the full coarse theatre costs approximately 5.6 MiB decoded. Prepared demand, including preloads, stays below 87.5% of the budget. Image publication subscribes inside the memoized `PreparedGroundMap` component, leaving label/scenery preparation alone. The budget remains an RGBA estimate rather than a limit on all browser/GPU memory.

Generate artwork after editing terrain colours, source geography or painter inputs:

```sh
DIADOCHI_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs DIADOCHI_BROWSER=/path/to/chromium npm run generate:ground
```

Playwright and Chromium are optional authoring tools, not app dependencies. The generator starts and closes an isolated local Vite server, uses the same `groundPaint.ts` colour/brush painter as runtime fallback, then losslessly recompresses the PNG stream. Generated files ship with the project, so ordinary installs/builds need no browser or authoring tools. `npm run check:ground` verifies the source dependency fingerprint, complete image coverage, PNG dimensions and content hashes; `npm run build` runs it before compiling and rejects stale, missing or corrupt artwork. Chunk size/resolutions live in `preparedGroundLayout.ts`; after changing them, regenerate. Adjust colours/brushes in their existing source files and regenerate rather than editing PNGs. Current authoring scripts use Node 22.15+ for native PNG CRC/recompression support.

Turn off **Prepared terrain shading** in Settings or use `/?shading=live` for the prior runtime gradient renderer. Turn off **Cached ground** or use `/?ground=vector` for the original SVG authoring renderer. Terrain shading off retains the plain native ground renderer. Preferences stay browser-local and affect no campaign state.

### Cached ground rendering

`groundGeometry.ts` clips the retained physical land rings to the requested geographic tile window. It clips actual shoreline segments separately, so rectangle cuts never create false coastlines. The land rings are parsed once in `physicalLand.ts`, shared with existing scenery containment. The vector fallback and physical-land clip use this local geometry rather than the complete world coast. `/?ground=vector` uses the same cropped background as live vectors for comparison.

The comparison renderer in `groundPainter.ts` uses native Canvas 2D to paint only static land, coastal shallows, rocky/earth/fertility washes and broad river fertility shading. `groundPaint.ts` shares brush positions and palettes with the SVG fallback in `groundBrushes.ts` and `groundSurface.ts`. PNG tiles are decoded before publication, then shown as SVG images in the existing projected ground group. Each tile crops its sampling bleed with a shared device-pixel-aligned rectangle so translucent coastal shading cannot overlap or leave antialiased hairlines at tile edges. This comparison uses no external downloads, camera transforms or state geometry changes. Paper grain, sharp river strokes, lakes, fields, ownership, selection, borders, labels, armies and upright scenery remain live SVG. Static washes sit beneath the live political overlays.

`mapExtent.ts` stores the padded crop (5.5°–93.5° E, 20.5°–48° N). Adjust it and run `npm run generate:world-terrain` to regenerate the embedded background; `worldTerrain.ts` converts it with the existing canonical projection. The `map-theatre` SVG clip also trims rivers, upright scenery and labels to this frame without changing their anchors. Blank parchment surrounds the frame at Overview. Tile requests intersect the crop, so those blank margins allocate no ground tiles.

`groundTiles.ts` owns tile planning and the per-map cache. Adjust `GROUND_TILE_PIXELS` (256), `GROUND_TILE_BLEED` (4) and `GROUND_CACHE_BYTES` (64 MiB) here. Resolution follows zoom in power-of-two steps, caps DPR at 1.5 and reduces resolution when a viewport would exceed 75% of the decoded-pixel budget. Broad wash strength uses the three existing map tiers (.9 / 1 / 7⁄6); fine detail keeps the existing zoom crossfade. Tiles use canonical map coordinates beneath the fixed 2.5D projection. The budget estimates decoded RGBA pixels, rather than all browser/GPU memory.

`useCachedGround.ts` requests only the geographic window and keeps requests stable inside a tile grid. Decoded tiles publish progressively, with notifications batched to a display frame. `GroundFallback.tsx` draws vector ground only in missing tile rectangles; ready tiles remain visible while neighbours load. Both paths share `groundTileClip` device-pixel boundaries, keeping coastal transparency and tile seams aligned. Bitmap failure leaves those rectangles as vector ground. One raster job runs at a time; obsolete queued jobs are removed, obsolete in-flight results are released, and old regions/resolutions are evicted by least recent use. Object URLs are revoked on eviction/unmount; cached ground does not depend on ownership or selection.

## Validation

### Additional theatre provinces

The additional partition contains 57 provinces / 181 states, separate from the 11-province / 47-state playable scenario. `theatreContent.ts` authors each district centre and exactly one proposed provincial seat. `theatreFootprints` limits the partition to the relevant theatre; the Alps, southern Balkan fringe, Caucasian ridge, Himalayan foothills and Bengal edge limit northern/eastern coverage. Offshore islands have their own provinces where appropriate. These groupings are a first geographic pass, not claims of surveyed or date-specific historical borders.

`npm run generate:theatre` uses the embedded physical land/lake polygons and subtracts the original campaign envelope. It generates shared catchment edges once, then guides compatible edges with the actual river network and ridge ground axes. The central section may lie on the feature itself; the ends taper to shared junctions. City hinterlands reserve clearance, and displacement is limited by nearby edges to prevent self-intersections. A complete coverage/overlap check validates the result before publication. Detached mainland pieces are transferred only to a neighbouring centre-containing polygon; coastal islands/archipelagos may have multiple components. Small source-coast rounding spurs with zero area are removed when the mesh is noded.

The generator nodes the new polygons together with virtual copies of the core states, deriving symmetric geographic adjacency across that seam without altering core campaign movement. Generated vertices are shared by adjacent polygons, provincial outlines exclude internal state edges, lakes use holes and every settlement/label anchor lies in its district. The core `stateGeometry.ts` remains byte-for-byte unchanged. `theatreGeometry.ts` ships only vertices referenced by draft or noded core rings, in a separate cacheable build chunk.

`theatreGeography.ts` prepares paths, extents and border tiers once. `TheatreDistricts.tsx` culls districts/edges to the viewport and uses the existing ground projection, upright labels and lightweight centre markers. Decorative vectors pass pointer events through; province and state drafts can be selected with mouse, touch or keyboard and focused on desktop/mobile. Selection is local UI state and cannot spend orders, change ownership, income or victory progress. Detailed settlement illustrations and economic/playable integration are later work; political ownership is now assigned in `politicalContent.ts`.

Overview relief reads `overviewRelief.ts`: both backbone and authored Babylon ridges now have peak anchors, so Babylon no longer enters a synthetic ribbon fallback. Water/pass sections with no peaks stay open.

The additional regression suite validates exact footprint coverage, no interior overlaps, original-campaign exclusion, shared-edge orientation, reciprocal adjacency, capital uniqueness, settlement/label containment, actual river/ridge alignment and both ground projections.

Regression coverage includes polygon intersections, gaps, exact campaign coverage, exact province unions, shared-edge orientation, connected provinces, unique membership, settlements inside states, Babylon/Borsippa content, Pontus/Assyria point resolution, independent ownership, local movement/buildings/events, frontier changes and a complete winning campaign. Camera tests fit every province on desktop, portrait and landscape screens, and terrain tests check continuous detail weights and explicit overrides. Browser checks click all 48 actual state polygons, verify all ten province views and their state labels, and cover label collisions, three detail scales, conquest, panning and responsive controls.

Babylonia-specific regressions verify shared river segments, opposite-bank ownership, Babylon’s expanded western hinterland, Nippur’s lack of a western tongue, and Chaldaea’s strict south-Euphrates boundary. They also check retired-state removal, reassigned settlement references, connected army movement and unchanged starting income. `check:browser-babylonia` covers desktop/mobile pointer selection, market tiers, simple markers and live SVG fallback. Lower-Tigris samples verify the provincial frontier still stays on one bank.

## Full-theatre political ownership

`politicalContent.ts` defines 31 map factions and the 57 added province assignments, with state exceptions for divided western districts. Nine independent satraps each hold one or two eastern provinces. Western spheres loosely follow autumn 312 BCE; the original 48-state campaign ownership and roster remain intact, so this is not a strictly dated reconstruction. Historical sources and the province allocation table are in the README. The new ownership is political atlas content, separate from active campaign economics/combat.

The generator also exports `theatreCoreRings`: existing core edges subdivided at atlas seam junctions, with no change to area or original gameplay geometry. The additional mesh contains 5,242 referenced vertices. `politicalGeography.ts` prepares one immutable edge registry for all 229 districts; `politicalBorderPaths` classifies it using current core owners and authored atlas owners. Equal owners produce no frontier across the old/new seam. Paths and bounds are cached by owner-state changes, and rendering culls ownership paths and faction edges to the viewport. No runtime polygon boolean operations are added.

Colour fills use the existing ownership tier opacity; faction bands are now 4 screen pixels at province/detail scale and 5 at overview, clipped to the owning side, with a 1.2 pixel colour edge and .55 pixel ink centreline. Adjust these rules in `App.css`. The shared ground projection is always enabled in the app. Pure flat coordinate helpers remain available for mathematical regression tests, with no user-facing flat mode.

## Display preferences and rendering review

`mapSettings.ts` defines validated local display preferences and Full/Light presets. `MapSettingsPanel.tsx` supplies independent controls; App persists only known boolean values under `diadochi.map-display.v1`, with corrupt or blocked storage falling back safely. These preferences never enter campaign state. Decorative switches gate drawing and scene preparation; selected state/province outlines and faction frontiers remain readable even when ordinary divisions or fills are disabled. Disabling settlement artwork uses simple primary-centre dots and retains capital seals and centre labels. The fixed ground projection stays enabled.

The runtime comparison ground profile includes terrain shading in its key (`:plain` when disabled); switching profiles cannot display stale shaded tiles. Disabling cached ground disposes textures and pending work. The decoded budget remains 64 MiB and DPR remains capped at 1.5. Broad wash bounds include their complete radii, so tile/viewport culling does not cut off foothill edges.

Terrain engravings, routes and washes are culled by geographic bounds; zero-opacity detail groups keep their empty tier containers for stable controls but no longer mount all their invisible sprites. Upright scenery remains depth-sorted. Overview paths are prepared once under the fixed projection and culled by full relief bounds. Core ownership fills use precomputed state bounds. Artwork is cached independently of selection/commander changes, preserving sprite object references. Only the visible label tier runs collision layout. Drag events retain the latest target and publish it once per animation frame, flush the final target on release, and cancel pending pan on zoom/unmount. Wheel updates are not interpolated.

### Panning composition

`CampaignMap` retains a memoized SVG scene while App updates the canonical camera. The scene always includes up to 192 screen pixels of artwork on each edge, capped at half the smaller viewport dimension and by a 32 MiB estimate for additional RGBA surface pixels at the actual browser DPR. `mapPan.ts` converts the difference between retained and current cameras into a CSS `translate3d` on a composited parent layer. SVG geometry, labels, masks and device-pixel tile clips stay fixed during these translation frames, allowing the browser to reuse their rendered pixels.

When either translation exceeds 75% of the buffer, the scene refreshes at the current camera in the same render. Large jumps therefore preserve viewport coverage. Grabbing and releasing retain the surface dimensions, SVG camera and compositor hint while coverage remains sufficient. On zoom, resize or display-density changes, the parent temporarily uses an ordinary 2D translation without `will-change`; after a native paint it promotes the current resolution again. This prevents Chromium from enlarging an earlier SVG raster. A scale change resets promotion even when rapid zoom reversals revisit a previous scale. The canonical camera is exact; its difference from the retained camera remains a CSS translation at rest. Zoom redraws at native scale and reads the translated SVG screen matrix for cursor anchoring. Pointer capture stays on the same SVG element. Escape, reset and view changes cancel pending drag work. The buffered surface also remains at rest and during zoom. Its estimated extra pixel storage is separate from the ground cache's 64 MiB decoded estimate; neither estimate limits all browser/GPU allocations. `PAN_OVERSCAN` and `PAN_BUFFER_BYTES` in `mapPan.ts` control the surface limit.

`PAN_OVERSCAN` controls the buffer. A larger buffer reduces refresh frequency but increases surface size and scenery preparation. `npm run check:browser-pan` checks retained-scene dragging, coverage after jumps, camera coordinates, release, wheel anchors, cancellation, limits and resizing on desktop/mobile; it uses the same optional Playwright/browser environment variables as the browser benchmark.


## Susa terrain and Susiana state settlements

The Susa state now has five restrained ground highlights for cultivated land, date groves, reedbeds and dry terraces, three small field parcels, two schematic feeder channels and six sparse grove/reed groups. `susaTerrain.ts`, `susaGeography.ts` and `susaScenery.ts` hold these authored positions. Ground highlights are clipped to Susa in both prepared images and the live SVG comparison; existing Babylonia province clipping is retained. Upright symbols share the campaign depth order and culling. The prepared imagery is regenerated from the updated terrain and mesh.

The northern edge follows the Cossaean foothill margin, the eastern edge follows the Elymaean valley approach, and the southern edge follows the transition from cultivated plain into wetlands. Each shared cut is applied to both adjoining rings. Only Susa, Cossaea, Elymais and Karun change area; the Babylonian district partition and western Tigris-bank frontier retain their coordinates. The theatre is regenerated to share the revised core edges.

Susa keeps its original capital anchor and gains a reusable native SVG silhouette with a raised terrace and colonnaded hall, informed by its Achaemenid palace architecture. That palace remained standing beyond Alexander’s death, although the icon does not assert continued royal administration in the scenario. [Iranica: Susa in the Achaemenid period](https://www.iranicaonline.org/articles/susa-iii-the-achaemenid-period/), [Susa in the Hellenistic and Parthian periods](https://www.iranicaonline.org/articles/susa-iv-hellenistic-parthian-periods/).

Susiana has exactly one settlement centre in each of its four states. Western Valley retains its own centre after moving into Media. Susa keeps its capital and absorbs Cossaea’s territory; Mountain Entrance, Karun and Elymais each have their own centre, positioned on land away from the major water lines. These district names describe campaign centres rather than asserting specific ancient town identifications. Channels are schematic irrigation, and the imported Karkheh and existing Karun remain the major hydrographic guides.

Each centre reads its own state’s market level: homestead at 0, village at 1, fortress at 2 and city at 3+. Karun and Mountain Entrance start as homesteads; Elymais starts as a village. Developing one state grows only that centre. Susa retains its larger city appearance as the province capital. These tiers illustrate existing state development, without adding building economies or fort bonuses. Each settlement supplies one state label; disabling artwork retains simple markers.

Regression coverage checks all settlement anchors within their own states, Susa channels within Susa, unique state labels, real develop/fortify actions, shared cuts, exact campaign coverage and province unions.

Run `npm run check:browser-susa` against the production preview with the same optional Playwright/browser environment variables as the other map checks. It covers desktop/mobile market growth, capital identity, pointer selection in each state, close-view labels and SVG/simple-marker comparisons.


## Assyria province pass

Assyria now has exactly one illustrated settlement centre in each of its five states: Upper Euphrates, Nisibis, Nineveh, Arbela and Assur. Existing named city anchors are retained; Upper Euphrates gains a descriptive campaign centre. Nineveh keeps the existing scenario’s province-capital designation and has a distinct neutral-coloured gateway silhouette, while the other centres follow their own state’s market development. Developing or capturing Assur leaves the other settlements’ tiers and capital designation intact. The artwork is a scenario convention, not a claim that the imperial city destroyed in 612 BCE had been reconstructed in this form. [British Museum: Nineveh](https://www.britishmuseum.org/collection/galleries/assyria-nineveh).

`assyriaGeography.ts` supplies five shared political cuts: the western Jazira interfluve, western Tigris terraces, northern Assur terraces, Greater Zab valley, and Tigris east-bank/Lesser Zab valley. The Zab cuts reuse actual displayed river-axis vertices. The Assur bank margin leaves its centre on the western side. Two shared junctions join the new valleys cleanly. Generated polygons change area only in the five Assyria states and adjoining Zagros; Babylonia and Susiana retain their authored boundaries. The core/theatre meshes and exact province outlines are regenerated together. These remain approximate campaign catchments.

`assyriaTerrain.ts` adds eight light ground highlights for river terraces, farming plains and dry hinterland, with state clipping shared by the prepared painter and SVG renderer. Five small field parcels, three broadleaf grove clusters and a local reed group supply sparse detail, along with two schematic farming channels. These channels do not assert the survival of Neo-Assyrian imperial aqueducts in the scenario. Arbela’s landscape is framed by the two Zab rivers. [Iranica: Arbela](https://www.iranicaonline.org/articles/arbela-assyrian-arbailu-old/).

`assyriaScenery.ts` joins the common depth order, viewport culling and development appearance rules. New artwork uses native SVG symbols, without per-object filters. Prepared ground images are regenerated. Regression tests cover one centre per state, unique labels, all anchors/patches/channels within their states, displayed Zab vertices, real conquest/development actions and stable unrelated centres. Run `npm run check:browser-assyria` with the same optional Playwright/browser environment variables as the other map checks to verify desktop/mobile selection, conquest, development, simple-marker and SVG fallback paths.


## Persis atlas province pass

Persis has one centre in each of its five atlas states: Persepolis, Pasargadae, Western Persis, Persian Coast and Western Foothills. All use the existing generated settlement anchors. Persepolis is the sole provincial capital and uses a native SVG terrace with roofless stone columns beside a smaller town; Pasargadae has a compact stepped monument and village silhouette. The capital's columns acknowledge the destruction of the royal palaces in 330 BCE without presenting an intact palace. Cultivated plains and garden plots are a schematic landscape treatment. [Iranica: Persepolis](https://www.iranicaonline.org/articles/persepolis/), [Iranica: Pasargadae](https://www.iranicaonline.org/articles/pasargadae/), [Iranica: Fars geography](https://www.iranicaonline.org/articles/fars-ii/).

`persisGeography.ts` records a rounded province envelope on the basin side of the northern foothills and the Carmanian ridge. Explicit bounded masks give Persepolis a larger hinterland centered on its city and keep Pasargadae inland. Open shared cuts allocate Western Persis and the coast without letting remote closing corners distort their boundaries. The northern authoring remainder uses the replacement Western Foothills ID; independent terrain cuts remove the Northern Highlands from its actual land. Its settlement moves into the entry valley at [51.65, 31.55], while the old plateau seed remains only during initial catchment construction to preserve surrounding provinces; small enclosed shoulders beside the capital join an adjacent district instead of becoming detached plateau fragments. Transferred northern/eastern strips go to adjoining atlas catchments. The generator preserves the land footprint and validates overlap and settlement containment; shared seams use one mesh. These remain illustrative campaign catchments.

Mountain-aligned generated boundaries use two geographic foothill guides offset from each ridge axis, tapering with lower relief. Retained authored cuts are reused; the Median partition supplies new river-aligned divisions. Both border layers render before upright scenery and overview relief, so border strokes and selection outlines disappear naturally beneath mountain silhouettes while labels remain above them.

`mountainEntranceGeography.ts` supplies two distinct approaches. Western Valley is a separate Median state with one homestead, retaining the western river valley and absorbing the former northern Cossaean shoulder. Mountain Entrance belongs to Susiana and follows closely spaced contours between the northern and Fars ridges. Its oversized eastern tail is removed. Each has one settlement; Ecbatana and Susa remain their provincial capitals. The core and atlas generators share the same campaign boundary, with no gaps or overlaps.

`pasargadaePassOutline` extends Pasargadae through the northern Carmanian ridge to an eastern valley. This corridor joins Persis with its explicit inland district mask, so the plateau/coast cannot pinch off its crossing or produce a southern tail. A small fixed opening in the upright relief makes the pass visible. Carmanian Uplands retains its province, centre and separate district; no Eastern Uplands state is added.

The campaign contains 47 states and ten provinces: Babylonia has five districts, Susiana four, Media eight, and Persis retains five atlas states. Western Valley in Media and Mountain Entrance in Susiana both retain Seleucid starting ownership. Player holdings are ten, with income 106 and treasury 228 (122 opening coin plus first-turn income). The majority victory threshold is 24 states.

Three outer relief sections frame the Northern Highlands. A fourth, longer southern ridge connects them above the Pasargadae corridor. Mountain silhouettes become smaller toward the northern end, followed by two separated groups of low foothills. The shared relief axes drive upright scenery, overview silhouettes and tapered ground shading. The border follows the basin margin and eastern ridge instead of a straight divider. Existing ridge ordering is retained so other regions keep their authored shoulders.

`persisTerrain.ts` supplies twelve state-clipped highlights and a separate region-clipped stony highland wash and two schematic valley channels. The basin around Persepolis and Pasargadae has broader cultivated washes, extending into the southern plateau margins with eight field parcels and six sparse grove/palm groups. This concentrates greenery in the intermontane plains: Marvdasht is a relatively fertile basin, while southeastern Fars and the surrounding uplands remain drier. [Iranica: Fars physical geography](https://www.iranicaonline.org/articles/fars-i/), [Iranica: Persepolis and the Marvdasht plain](https://www.iranicaonline.org/articles/fars-v/).

Fourteen tiny rock/scrub groups break up the dry plateau and coastal hinterland; their native SVG silhouettes are capped at 32/24 screen pixels and follow the mountains/vegetation settings. Fixed valley openings omit generic relief anchors within the farming plots. Both fertile and authored stony ground use the same even-odd state clips in Canvas and SVG. Regenerated prepared imagery covers all 126 chunks/profiles. Upright scenery shares the existing depth order and viewport culling, without per-object filters or raster settlement art.

Persis is part of the political atlas, not the playable campaign. Its authored centre appearances are city at Persepolis, villages at Pasargadae and Persian Coast, and homesteads in Western Persis and Central Plateau. They do not add campaign markets, buildings or development actions. Atlas centre labels follow their artwork with district-contained alternatives; default atlas dots are suppressed, and disabling settlement artwork leaves one simple marker per state. The core-only map omits Persis scenery. Inspector entries describe each landscape and retain the atlas integration notice.

`persisDevelopment.test.ts` covers centre uniqueness, capital identity, tiers, terrain containment, balanced district areas, centered capital geometry, inland Pasargadae extent and shared perimeter vertices, labels, fallback markers and unchanged campaign data. `npm run check:browser-persis` uses the same optional Playwright/browser variables as the other map checks and verifies desktop/mobile pointer selection, labels, artwork, simplified markers, SVG terrain and core-only rendering. Regenerate this region with `npm run generate:map`, `npm run generate:theatre`, `npm run generate:barriers`, then `npm run generate:ground`. Core and atlas coverage tests validate the extended approach and the connected cross-ridge Pasargadae corridor.

The latest valley cleanup removes Paraitakene's southern tongue into Western Valley and Mountain Entrance, with a straighter shared valley division. Western Persis ends below the northern Fars ridge. Pasargadae and its gardens sit farther northeast at [53.85, 30.90], giving Persepolis a rounded city-centred district without a heart-shaped indentation. Carmanian Uplands remains in Carmania; only Pasargadae crosses through its pass.


### Susiana river partition — 6 October 2026

Cossaea is retired as a state and its centre removed. The current partition has five states: Susa, Western Valley, Mountain Entrance, the smaller middle Karun floodplain and the combined southern Elymais hinterland. `susaGeography.ts` partitions the province once, using the displayed Karkheh and Karun centreline vertices for shared river cuts. Neither river-bank state receives the entire channel. Karun ends at the lower confluence and does not reach the coastal plain; Elymais includes the old southern Karun territory. Their centres are relocated to [48.15, 31.15] and [49.50, 31.02]. Initial authoring seeds remain fixed so the provincial exterior and unrelated districts retain their geography.

Elymais’s northern edge follows the western section of the upper Karun bend, then turns partway along the river segment toward the existing pass and southern ridge. The upper river reach and main valley stay in Mountain Entrance. `susianRiverMountainMargin` extends the independent mountain shoulder down to that river, excluding the strip above it from state ownership, selection and movement. The Western Valley passage and shared Elymais/Mountain Entrance pass remain open; the Susa middle crossing and northern approach remain closed. All 47 campaign centres remain reachable with seven named pass markers. Passable areas are approximately Susa 4,032, Karun 1,106, Elymais 4,731, Mountain Entrance 2,472 and Western Valley 2,392 map units squared. The administrative Susiana perimeter and all other provinces are unchanged.


### Passage footprint and Persis seam correction — 6 October 2026

The western end of the Northern Fars barrier now starts at the first visible mountain after river/pass clearance, matching the existing relief artwork. Its former axis stump occupied empty valley ground, leaving an unowned notch between Mountain Entrance and Elymais. That ground now belongs to the two valley states, divided by their existing shared cut. Visible peaks remain unowned barriers, and the previously closed crossings remain closed.

`mountainEntrancePersisSeam` supplies one smoothly sampled eastern contour to both the campaign and atlas generators. Tests check reversed shared edges, bounded turns, restored valley ownership/selection and the first visible peak remaining independent terrain. The correction retains four Susiana states, their settlement anchors, economy and seven passes.


## River-led five-state Babylonia — 6 October 2026

Babylon gains the old western Nippur peninsula and shares its northern edge with the upper Euphrates and middle Tigris. Sippar extends into northwestern Diyala, with its eastern boundary on the displayed Diyala tributary and its southern boundary on the Euphrates, joined by a short bank/canal connection below Sippar. Diyala remains east of the tributary and Tigris. Nippur’s western vertex joins Babylon and Chaldaea exactly at the Euphrates; it has no western dryland sliver.

Chaldaea combines the former Chaldaea/Uruk/Ur districts and reaches the Gulf. Its northern edge follows the physical Euphrates exactly, without detouring for settlements. Uruk and Larsa remain fixed secondary town references in Nippur; Ur remains in Chaldaea. There is one primary centre per surviving state. Former Ur/Uruk seeds remain only in the generator’s initial catchment construction to preserve neighbouring provincial exteriors, then their runtime rings are removed. The campaign now has 47 states, nine friendly starting holdings and a 24-state majority target. Income 102 and treasury 224 are preserved.

`riverGeometry.ts` provides the same snapped river courses to both physical artwork and district authoring without a campaign-initialization dependency. Adjacent Euphrates source reaches are joined when selecting the full lower-bank sequence. Shared cuts are partitioned once, then map, theatre, independent mountain land and prepared ground are regenerated in order.


## Western Valley joins Susiana — 6 October 2026

Western Valley remains a separate state and moves from Media to Susiana, with Seleucid starting ownership. Susiana now contains Susa, Karun, Elymais, Mountain Entrance and Western Valley; Media has seven states. Its northern provincial edge follows the displayed upper Karkheh vertices, offset 1.4 map units south to keep the ink beside the channel. Both provinces share that same edge, with no overlaps or gaps. Existing settlement anchors and mountain barriers remain; the western pass supplies a friendly approach from Susa.

Opening player holdings increase to ten, income to 106 and treasury to 228. The campaign still has 47 states and a 24-state majority target. The separately carved valley is excluded from the earlier Susiana repartitioning masks, preserving the main Susa plain and eastern approach. This prototype ownership change follows the selected Seleucid option; a future pre-Nicanor-defeat opening would place Susiana in his eastern sphere instead.


## Persis Northern Highlands and entry corridor — 7 October 2026

Central Plateau is replaced by Western Foothills, a smaller inhabited entry valley bordering Mountain Entrance. Persis retains five atlas states and one primary settlement each. The Northern Highlands form a broad independent impassable block, clipped to the existing administrative Persis envelope. Its southern ridge extends above Pasargadae, making a longer eastward corridor while preserving the Carmanian pass and separate Carmanian Uplands. Persepolis uses an irregular, city-centred outline with foothill turns and a broader southern edge; Western Persis and the coastal country retain coherent hinterlands.

`mountainRegions` describes the named highland area. The barrier generator combines it with the ridge footprints, subtracts authored passes, and removes it from state and provincial land and hit areas. Most selection highlights follow the passable land; Persepolis has a separate visual highlight of its administrative outline beneath the mountain artwork. Border clearance extends beyond the region edge so political ink stops before the block. A sparse stipple and a Northern Highlands / Impassable caption identify it without creating a selectable state or extra settlement. Stony washes use `terrainRegionId` to clip both prepared canvas artwork and vector fallback to that independent region. Old plateau farms and the plateau settlement are removed.

The same offline boundary calculation now supplies `atlasPassableNeighbors`: atlas inspector links represent shared traversable land rather than administrative neighbours hidden across mountains. Campaign component travel still includes only playable core states. Tests verify the block is unowned, closed northern neighbours are removed, the Western Foothills/Mountain Entrance border is connected, and Pasargadae retains a connected corridor through the eastern pass. Regenerate with `generate:map`, `generate:theatre`, `generate:barriers`, then `generate:ground`.

## Persis entry boundary and capital highlight refinement — 7 October 2026

Western Foothills gains approximately 717 map units squared from western Pasargadae, increasing its passable area from 986 to 1,704 while preserving its Mountain Entrance connection. The shared edge curves down from the northern ridge into the existing capital junction. Pasargadae retains approximately 5,613 units and its connected eastern pass; all other atlas and core state areas are unchanged. Its primary settlement moves from [53.85, 30.90] to [54.35, 31.10], with its local garden grove, fields and schematic channel following it. Original catchment seeds remain fixed until the explicit Persis partition is applied, so the city move does not reshape nearby provinces.

Persepolis’s selected fill and outline use the administrative polygon without mountain cutouts. This display-only overlay renders beneath relief, ignores pointer events and replaces the passable polygon’s selected/hover fill. Actual ownership, hit testing, terrain clipping and movement still exclude the independent mountains. Administrative paths are prepared once alongside district geometry; camera frames perform no extra polygon operations.

## Southern Media and Western Valley — 7 October 2026

The Ecbatana province remains named Media in the current content pack and now has eight states: Atropatene, Ganzak, Zagros, Nisaean Plain, Ecbatana, Rhagae, Paraitakene and Western Valley. Susiana has four. Western Valley moves administratively into Media while retaining its existing Seleucid ownership, settlement and southern mountain-side boundary. Its northern division uses the exact upper Karkheh vertices, shared with Nisaean Plain and Ecbatana. Keeping the southern boundary prevents Paraitakene from jutting into the approach and reopening Mountain Entrance’s closed northern crossing.

`mediaGeography.ts` supplies the new shared contours. Zagros extends into the northeastern Diyala approach and includes both the Northern Zagros and Diyala saddles. The western lower edge follows the Diyala centreline; land west of that upper river joins Sippar instead of leaving a Babylonian district on both banks. Zagros and Nisaean Plain share successive parts of the northern Qezel Owzan frontage, with Ganzak on the other bank. The original Zagros northern frontage is reused exactly up to its extended eastern junction. Ecbatana’s western margin and its rounded eastern division frame the capital, while Paraitakene has a coherent eastern plateau border with Rhagae. River endpoints are preserved exactly when smoothing adjoining curves to prevent rounding slivers.

The generator partitions the affected Median and upper Babylonian catchments once, then nodes every seam. Northern Ecbatana, Ganzak and Rhagae land above the new river’s endpoint retains its original footprint; Atropatene’s entire state footprint is unchanged. No separate Atropatene province is created in this change. Susiana’s other four state areas, the Babylon/Nippur/Chaldaea districts, all atlas districts and Persis’s finished geography are unchanged. Mountain exclusions, existing passes and opening holdings remain in force.


## Media, Zagros and the separate Atropatene province — 8 October 2026

This correction supersedes the preceding southern Media grouping. Western Valley remains in Susiana, preserving its upper Karkheh frontage, settlement and Seleucid ownership. Media contains only Nisaean Plain, Ecbatana, Rhagae and Paraitakene. Ganzak and Atropatene form a separate Antigonid province, with a new settlement reference and provincial seat at Ganzak. Its southern frontier receives the former northern Ecbatana spur and country above the northern Median ridge contour.

Zagros belongs administratively to Babylonia while Nicanor holds it and all four Media states. The campaign and political atlas palettes share Nicanor’s faction, Ecbatana seat and illustrative Macedonian shield. He commands the capital’s defending army; he is removed from Seleucid recruitment. Babylonia therefore starts with mixed ownership, and Susiana is the only complete player-held province. Opening player holdings, income, treasury and victory target remain ten, 106, 228 and 24.

The orange river segment is the local upper Diyala immediately north of Zagros. `zagrosNorthernRiver` reuses its exact displayed vertices; Ganzak holds the opposite bank. Zagros does not extend to the distant Qezel Owzan. Nisaean Plain keeps its own northern river edge. The generator also transfers the former northern Zagros arm out of Sippar, preventing leftover Babylonian territory above the local channel. Both Zagros entry passes remain included, and the seven existing passages and independent mountains are preserved.

The campaign has eleven provinces and 47 states: Babylonia six, Susiana five, Media four and Atropatene two. Authoring catchment memberships stay fixed until the explicit regional repartition, so provincial moves do not disturb neighbouring finished geography. Polygon differences confirm changes only to Sippar, Zagros, Ganzak, Ecbatana and Rhagae. Susa’s finished districts, Western Valley, Nisaean Plain, Paraitakene, Babylon/Nippur/Chaldaea, Atropatene’s state footprint and all 181 atlas districts remain geometrically unchanged. Passable areas are approximately Zagros 2,350, Ganzak 9,631, Ecbatana 3,857, Rhagae 4,494 and Sippar 3,254 map units squared.

Validation: 139 tests, lint and production build pass. Desktop/mobile production checks cover Nicanor’s ownership, corrected memberships, northern river banks, both Zagros entrances, independent mountain ownership and border clipping, vector fallback and settlement development. All 126 prepared terrain images validate at 12.17 MiB; screenshots reviewed.


## Independent Atropatene and northern river/ridge seams — 8 October 2026

Atropatene is now a separate core faction, holding only the Ganzak and Atropatene states of its own province. Its palette and Ganzak seat are registered in the campaign and political map. Nicanor retains Media and Zagros; Zagros remains administratively Babylonian, and Western Valley remains Susian with Susa’s ownership. This supersedes the Antigonid assignment in the preceding correction.

`nisaeanRiverOutline` follows the full northern river reach, including the formerly skipped western segment. A shared western curve joins it to the existing mountain-side edge. The final generator partitions only Nisaean Plain and Ganzak, keeping the river channel shared by both banks. `rhagaeWesternRidgeEdge` replaces the stepped Ecbatana/Rhagae corner with one smooth contour beneath the ridge, starting at an exact sampled northern provincial junction. The second bounded repartition touches only those two states and preserves the outer Media footprint. Polygon comparisons confirm all other core and atlas districts unchanged. Nisaean Plain gains 146 passable map units squared; Rhagae gains 413.

Validation: all 140 tests, lint and production build pass. Desktop/mobile production checks confirm separate Atropatene ownership, Babylonian Zagros under Nicanor, Susian Western Valley with Susa’s owner, full northern river-bank selection, both Zagros entrances, independent mountain clipping and seven pass markers. All 126 prepared images validate at 12.18 MiB. Fresh-game screenshots reviewed.


## Zagros western join and Sippar northern border — 8 October 2026

The upper western Zagros kink is replaced by a straight chord from [45.57, 34.70] to [45.45, 34.31], removing its pointed river-bend notch. The authored Diyala course now follows that same straight reach, removing the blue zigzag beside the border. Its endpoints, the lower river bank and confluence stay intact. Comparing the map before and after rerouting the river confirms all state footprints remain unchanged. The Diyala remains the shared division with Sippar. Sippar’s northern projection is trimmed to a shallow shared contour from its existing Tigris junction to the same Zagros endpoint. Its removed northern shoulder joins the adjoining Assur and Ganzak sides, extending their existing divider to the new contour. No province memberships, starting state owners, settlements, income or victory rules change.

Polygon comparisons confirm changes only to Zagros (+48 passable map units squared), Sippar (−519), Assur (+118) and Ganzak (+354). All other core and atlas polygons remain unchanged. Independent mountains, both Zagros entrances and all seven existing passes remain intact.

Validation: all 140 tests, lint and production build pass. Desktop/mobile production checks cover Nicanor’s ownership, corrected memberships, northern river banks, both Zagros entrances, independent mountain ownership and border clipping, vector fallback and Babylonian settlement development. All 126 prepared terrain images validate at 12.17 MiB; screenshots confirm the straight river follows the new western Zagros border.

## Five-state Atropatene partition — 8 October 2026

Atropatene is redrawn as five playable states under its independent ruler: Atropatene (the lake district), Ganzak, Northern Uplands, River Basin and Caspian Coast. The northern state runs above the lake district’s ridge; the basin and coast share the physical Qezel Owzan arms. The provincial coast is clipped to the physical Caspian shore. The western edge follows the eastern foothills of the two northern Zagros sections, removing the former Ganzak tail toward Assyria. Mountain land remains independent and movement still requires the seven existing passes.

The removed outer shoulders join their contiguous Assyrian, Armenian and Rhagae neighbours. Only Atropatene, Ganzak, Arbela, Assur, Ararat, Rhagae and the two adjoining atlas coastal districts change. Polygon comparisons verify that Zagros’s straight Diyala frontage, Sippar, the completed Babylonian states, Susiana, Western Valley, Nisaean Plain, Ecbatana, Paraitakene and every Persis district retain their existing shapes. Each of the lake, capital, northern and coastal states has one passable component; the river basin retains a small mountain-separated shoulder. The terrain graph has 67 core land components.

The campaign now has 50 states in eleven provinces. Majority victory requires 26 states; the full conquest test reaches that target through marching and adjacent invasions. The Seleucid opening remains ten holdings, 106 income and 228 treasury. Atropatene’s new districts have modest incomes of five, six and six; Ganzak remains its provincial seat.

Validation: all 141 tests, lint and production build pass. Production desktop/mobile checks cover all five Atropatene states, their ruler and province membership, river-bank selection, both Zagros entrances, the Assyrian centres and development, mountain exclusions, seven pass markers and vector fallback. All 126 regenerated terrain images validate at 12.17 MiB. Map screenshots reviewed.

## Tighter Atropatene foothill frontier — 8 October 2026

Atropatene’s western outline now uses the eastern base guides of Northern Zagros, the Zab ridge and the first northern Zagros peaks. This fills the unnecessary eastern valley margin up to the mountain barrier, especially beside Ganzak, while keeping the opposite Assyrian foothills outside the province. The River Basin’s eastern corner is rounded along the western foot of the Alborz range. Northern Uplands has a smaller outer margin above its ridge. The five states, rivers, settlement positions, ownership, economy and 26-state victory target are retained.

Polygon comparisons show changes only to the lake district, Ganzak, Northern Uplands and River Basin, their adjacent Arbela/Ararat/Rhagae shoulders, and the Caspian West Coast atlas district. Caspian Coast, Assur, Babylon, Zagros’s straight river join, Sippar, Nisaean Plain, Ecbatana, Susiana and Persis retain their shapes. Independent mountain footprints and all seven passes are unchanged. The terrain graph has 70 core land components after the adjoining foothill shoulders are repartitioned; army movement uses these components rather than bypassing a barrier within one administrative state.

Validation: all 141 tests, lint and production build pass. Desktop/mobile production checks pass for all five Atropatene districts, river banks, province memberships, Assyrian centres and development, independent mountains and seven pass markers. Regression probes confirm the newly included eastern foothill ground belongs to Ganzak while the western side stays outside Atropatene. All 126 prepared terrain images validate at 12.17 MiB; production screenshots reviewed.

## River Basin open pockets and visible ridge endpoints — 8 October 2026

The two interior cuts inside River Basin came from oversized independent mountain exclusions, not its authored state border. The northern Atropatene barrier formerly continued to an unsampled endpoint beside the Qezel Owzan; the Eastern Median barrier included two initial peak positions omitted by water clearance. The barrier generator now ends the northern section at its last illustrated mountain and starts the eastern section at its first illustrated mountain. Real peak positions remain independent, unowned and impassable.

River Basin now fills both marked open pockets and has one contiguous passable land component. Approximately 332 passable map units squared are restored to it. The adjacent northern uplands and foothill states also receive their own banks of the newly open reaches; no raw state/province mesh, river course, settlement, ownership, economy or victory rule changes. Both generated administrative meshes are byte-for-byte unchanged. All seven passes and the 70-component movement graph remain; movement cannot cross the remaining mountain terrain.

Validation: all 142 tests, lint and production build pass. Desktop/mobile production checks verify both restored river pockets, mountain ownership and movement barriers, all five Atropatene districts and both Zagros entrances. All 126 prepared terrain images validate at 12.17 MiB; the selected River Basin outline was reviewed in the production browser.

## Ganzak and Susiana shared river frontiers — 8 October 2026

Ganzak’s small western notch now follows the displayed upper Lesser Zab into its source valley. The Atropatene outer frontier meets the river at the northern foothills, and the lake-state/Ganzak division joins it at the source. The retired western pocket belongs to adjoining Arbela; the actual mountain belts remain independent and impassable. River Basin, Northern Uplands and Caspian Coast keep their existing shapes.

Susiana and Babylonia now meet on the displayed lower Tigris and Shatt al-Arab centreline. The former four-unit Tigris offset and two-unit lower-river offset onto the Susian bank are removed. The lower confluence uses the snapped physical river vertices, so the outline does not introduce a small off-channel triangle. Susa, Karun and Elymais receive their own eastern banks; Nippur and Chaldaea retain the opposite banks, with a small adjustment at the Diyala/Susa junction. River courses, seats, province memberships, ownership, campaign economy and victory target are unchanged. Independent terrain still has seven passes and 70 core land components.

Validation: all 144 tests, lint and production build pass. Desktop/mobile production checks pass for the Ganzak river banks, Susiana and Babylonian river-bank selection, settlement development, independent mountain ownership and seven pass markers. All 126 prepared terrain images validate at 12.17 MiB; both river-frontier screenshots were reviewed in the production browser.

## Atropatene western pass and Median mountain shoulder — 8 October 2026

Atropatene’s lake state now extends into the marked western valley between the northern Zagros and Zab ridges. Its provincial edge follows the valley floor around the opening, while its shared upper Lesser Zab division with Ganzak stays on the river. The valley extension is open ground with links to the adjoining Assyrian land components; mountain-separated components still cannot be bypassed through a state’s capital.

A new Nisaean northern shoulder adds relief and independent impassable terrain to the gap between Ganzak and Nisaean Plain. The old Assyrian administrative pocket is transferred from both Arbela and Assur to Ganzak north of the Median frontier and Nisaea south of it. A tiny terminal Assyrian tip is included in that transfer rather than left disconnected behind the ridge. Mountains own no state land. There are now 91 ridge belts, seven existing passes and 70 core land components.

Karun retains its main eastern floodplain, western river pocket and original settlement. Only the small northern cap of the pocket joins Susa: the short shared border now joins a native Tigris bend to the next lower Karkheh vertex. The rest of Karun remains intact. The Susiana province outline, Babylon, Zagros, Western Valley, Persis and the other Atropatene districts retain their administrative polygons. State and province counts, ownership, opening economy and victory target are unchanged.

Validation of the completed mountain/pass changes and restored Karun: all 145 tests, lint and production build pass. Desktop/mobile checks pass for Media, Susiana, Assyria and independent mountains. Regression probes verify the red valley extension belongs to the Atropatene state and the orange mountain pocket is unowned terrain over Ganzak/Nisaea rather than Assyrian polygons. All 126 prepared terrain images validate at 12.17 MiB; production screenshots reviewed.

## Karun entirely inside its main river enclosure — 8 October 2026

The entire western Tigris–Karkheh pocket now belongs to Susa. The shared Susa/Karun border follows the lower Karkheh all the way to its mouth beside the Tigris confluence, removing the former straight stub across the pocket. Karun keeps its main eastern floodplain and original settlement, but cannot extend west of that river into the pocket. The Susiana/Babylonia province frontier stays on the river centreline; ownership, economy, mountains and other state outlines are unchanged.

Validation: all 145 tests, lint and production build pass. Desktop/mobile Susiana checks select Susa in the former pocket and Karun in its main enclosure; the selected Karun outline was visually reviewed. All prepared terrain images were regenerated and validated.

## Regional terrain palettes — 9 October 2026

Mesopotamian floodplains now use stronger irrigated greens along the Tigris, Euphrates and lower confluence. Susiana uses softer, less saturated fertile tones. The Zagros has dry foothill washes; the Median interior has beige/ochre steppe and pale saltland patches. Persis has a drier base with narrower cultivated basins and focused green pockets around Persepolis and Pasargadae.

Thirteen feathered geographic washes blend across regional ground rather than drawing political colour blocks. Shared wash and river styles keep the canvas artwork and SVG fallback consistent. Borders, river courses, settlement positions and movement rules retain their existing geometry.

Validation: all 145 tests, lint and production build pass. Desktop/mobile browser checks pass for Babylonia, Susiana and Persis, including SVG fallback. Cached and vector screenshots were reviewed. All 126 prepared terrain images were regenerated and validated at 12.39 MiB.
