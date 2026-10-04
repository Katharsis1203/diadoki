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

## Fixed 2.5D scenery

The map always renders upright 2.5D scenery; the flat-view toolbar toggle has been removed. `mapProjection.ts` supplies one fixed affine ground projection, shared by the SVG ground group, province camera fitting, marker/label anchors and drag conversion. Canonical state geometry, settlement coordinates, ownership and gameplay remain unchanged. The continuous ground uses modest vertical compression; upright mountain relief now covers the campaign, while settlement and vegetation artwork remains confined to Babylonia.

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
- Surface colour/detail: shared palettes and brushes in `groundBrushes.ts` / `groundSurface.ts`; fine symbols and parcels in `TerrainLayer.tsx` / `BabyloniaSurface.tsx`. Ownership intensity and border widths live in `App.css`; faction colours live in `data.ts`.

Projection regressions cover coordinate round trips, unchanged territory resolution, exact screen drag distances, responsive province fitting, stable scenery anchors, detail visibility, depth ordering and relief outside the Babylonian plain. Browser checks verify upright artwork, scenery anchors at multiple zooms, touch selection, borders, conquest and responsive controls.

The performance pass separates camera-independent scene preparation (`mapScene.ts`) from viewport visibility and SVG layers (`MapLayers.tsx`). Static terrain/artwork and political layers are memoized, while camera-dependent anchors, labels and caps update when their inputs change. Coordinate arrays, bounds, edge strings and adjacency are prepared once; generated province/campaign outlines reference the shared mesh instead of duplicating coordinates. Coordinate exports and geometry are unchanged. See [PERFORMANCE.md](PERFORMANCE.md) for measurements and remaining painting costs.

### Prepared ground rendering

The default shaded map uses `PreparedGroundMap.tsx` and `usePreparedGround.ts`. `preparedGroundLayout.ts` divides the theatre into 512-map-unit chunks with 0.5/2 pixel-per-map-unit image resolutions and the existing dominion/province/state colour strengths. Only nearby chunks are requested. Static sand, coastal shallows/ink, rocky ground, earth and fertile river washes are painted ahead of time; pan and zoom never generate or encode Canvas tiles. Grain, sharp waterways, fields, political colours, borders, labels and upright scenery remain live.

Images are painted from unchanged source coastlines and land/lake holes using the same painter as the runtime comparison. Exact SVG physical-land masks remain available for grain, rivers and fallback; close views also retain vector coastline ink. Geographic queries, playable/draft geometry and interaction are unchanged. Ground colour is sampled from mip images rather than recalculated at each zoom; fine close views may show small resampling differences, while labels/rivers/scenery remain sharp. Shared snapped chunk clips and four-pixel sampling bleed avoid seams. Until a chunk decodes, it retains original SVG colour/terrain artwork; missing/corrupt images keep this fallback. All decoration allows pointer events through.

There are 126 generated lossless PNGs (approximately 12.00 MiB total) in `public/textures/ground`, with content-hashed names recorded in `preparedGroundManifest.ts`. The whole set is shipped but only nearby artwork is downloaded. `useGroundTileCache.ts` shares the original cache lifecycle between both image renderers: a 64 MiB decoded-pixel budget, LRU eviction, one asynchronous job, obsolete-result rejection and object-URL release. Only one renderer's cache is active at a time. The prepared planner selects the coarse mip if fine viewport demand would exceed 75% of the decoded budget; the full coarse theatre costs approximately 5.6 MiB decoded. The budget remains an RGBA estimate rather than a limit on all browser/GPU memory.

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

The additional partition contains 57 provinces / 181 states, separate from the unchanged 10-province / 48-state playable scenario. `theatreContent.ts` authors each district centre and exactly one proposed provincial seat. `theatreFootprints` limits the partition to the relevant theatre; the Alps, southern Balkan fringe, Caucasian ridge, Himalayan foothills and Bengal edge limit northern/eastern coverage. Offshore islands have their own provinces where appropriate. These groupings are a first geographic pass, not claims of surveyed or date-specific historical borders.

`npm run generate:theatre` uses the embedded physical land/lake polygons and subtracts the original campaign envelope. It generates shared catchment edges once, then guides compatible edges with the actual river network and ridge ground axes. The central section may lie on the feature itself; the ends taper to shared junctions. City hinterlands reserve clearance, and displacement is limited by nearby edges to prevent self-intersections. A complete coverage/overlap check validates the result before publication. Detached mainland pieces are transferred only to a neighbouring centre-containing polygon; coastal islands/archipelagos may have multiple components. Small source-coast rounding spurs with zero area are removed when the mesh is noded.

The generator nodes the new polygons together with virtual copies of the core states, deriving symmetric geographic adjacency across that seam without altering core campaign movement. Generated vertices are shared by adjacent polygons, provincial outlines exclude internal state edges, lakes use holes and every settlement/label anchor lies in its district. The core `stateGeometry.ts` remains byte-for-byte unchanged. `theatreGeometry.ts` ships only vertices referenced by draft or noded core rings, in a separate cacheable build chunk.

`theatreGeography.ts` prepares paths, extents and border tiers once. `TheatreDistricts.tsx` culls districts/edges to the viewport and uses the existing ground projection, upright labels and lightweight centre markers. Decorative vectors pass pointer events through; province and state drafts can be selected with mouse, touch or keyboard and focused on desktop/mobile. Selection is local UI state and cannot spend orders, change ownership, income or victory progress. Detailed settlement illustrations and economic/playable integration are later work; political ownership is now assigned in `politicalContent.ts`.

Overview relief reads `overviewRelief.ts`: both backbone and authored Babylon ridges now have peak anchors, so Babylon no longer enters a synthetic ribbon fallback. Water/pass sections with no peaks stay open.

The additional regression suite validates exact footprint coverage, no interior overlaps, original-campaign exclusion, shared-edge orientation, reciprocal adjacency, capital uniqueness, settlement/label containment, actual river/ridge alignment and both ground projections.

Regression coverage includes polygon intersections, gaps, exact campaign coverage, exact province unions, shared-edge orientation, connected provinces, unique membership, settlements inside states, Babylon/Borsippa content, Pontus/Assyria point resolution, independent ownership, local movement/buildings/events, frontier changes and a complete winning campaign. Camera tests fit every province on desktop, portrait and landscape screens, and terrain tests check continuous detail weights and explicit overrides. Browser checks click all 48 actual state polygons, verify all ten province views and their state labels, and cover label collisions, three detail scales, conquest, panning and responsive controls.

Babylonia-specific regressions verify substantial shared river segments along both rivers, Babylon's territory on both banks, landscape metadata, and the desert/marsh state classifications. The province-pass browser checks also cover local detail text and touch selection. Regressions also sample the lower Tigris to confirm it stays in Babylonia without crossings of the provincial frontier, and validate every province's main settlement reference.

## Full-theatre political ownership

`politicalContent.ts` defines 31 map factions and the 57 added province assignments, with state exceptions for divided western districts. Nine independent satraps each hold one or two eastern provinces. Western spheres loosely follow autumn 312 BCE; the original 48-state campaign ownership and roster remain intact, so this is not a strictly dated reconstruction. Historical sources and the province allocation table are in the README. The new ownership is political atlas content, separate from active campaign economics/combat.

The generator also exports `theatreCoreRings`: existing core edges subdivided at atlas seam junctions, with no change to area or original gameplay geometry. The additional mesh contains 5,242 referenced vertices. `politicalGeography.ts` prepares one immutable edge registry for all 229 districts; `politicalBorderPaths` classifies it using current core owners and authored atlas owners. Equal owners produce no frontier across the old/new seam. Paths and bounds are cached by owner-state changes, and rendering culls ownership paths and faction edges to the viewport. No runtime polygon boolean operations are added.

Colour fills use the existing ownership tier opacity; faction bands are now 4 screen pixels at province/detail scale and 5 at overview, clipped to the owning side, with a 1.2 pixel colour edge and .55 pixel ink centreline. Adjust these rules in `App.css`. The shared ground projection is always enabled in the app. Pure flat coordinate helpers remain available for mathematical regression tests, with no user-facing flat mode.

## Display preferences and rendering review

`mapSettings.ts` defines validated local display preferences and Full/Light presets. `MapSettingsPanel.tsx` supplies independent controls; App persists only known boolean values under `diadochi.map-display.v1`, with corrupt or blocked storage falling back safely. These preferences never enter campaign state. Decorative switches gate drawing and scene preparation; selected state/province outlines and faction frontiers remain readable even when ordinary divisions or fills are disabled. Disabling settlement artwork uses simple primary-centre dots and retains capital seals and centre labels. The fixed ground projection stays enabled.

The runtime comparison ground profile includes terrain shading in its key (`:plain` when disabled); switching profiles cannot display stale shaded tiles. Disabling cached ground disposes textures and pending work. The decoded budget remains 64 MiB and DPR remains capped at 1.5. Broad wash bounds include their complete radii, so tile/viewport culling does not cut off foothill edges.

Terrain engravings, routes and washes are culled by geographic bounds; zero-opacity detail groups keep their empty tier containers for stable controls but no longer mount all their invisible sprites. Upright scenery remains depth-sorted. Overview paths are prepared once under the fixed projection and culled by full relief bounds. Core ownership fills use precomputed state bounds. Artwork is cached independently of selection/commander changes, preserving sprite object references. Only the visible label tier runs collision layout. Drag events retain the latest target and publish it once per animation frame, flush the final target on release, and cancel pending pan on zoom/unmount. Wheel updates are not interpolated.

### Panning composition

`CampaignMap` retains a memoized SVG scene while App updates the canonical camera. During dragging, the scene includes up to 128 screen pixels of artwork on each edge (capped at one quarter of the smaller viewport dimension). `mapPan.ts` converts the difference between retained and current cameras into a CSS `translate3d` on a composited parent layer. SVG geometry, labels, masks and device-pixel tile clips stay fixed during these translation frames, allowing the browser to reuse their rendered pixels.

When either translation exceeds 75% of the buffer, the scene refreshes at the current camera in the same render. Large jumps therefore preserve viewport coverage. Release removes the buffer, transform and compositor hint and redraws at the exact final camera; zoom redraws at native scale and reads the translated SVG screen matrix for cursor anchoring. Pointer capture stays on the same SVG element. Escape, reset and view changes cancel pending drag work. At rest and during zoom, the scene uses the normal viewport dimensions. The extra compositor surface during dragging is separate from the ground cache's 64 MiB decoded estimate.

`PAN_OVERSCAN` controls the buffer. A larger buffer reduces refresh frequency but increases surface size and scenery preparation. `npm run check:browser-pan` checks retained-scene dragging, coverage after jumps, camera coordinates, release, wheel anchors, cancellation, limits and resizing on desktop/mobile; it uses the same optional Playwright/browser environment variables as the browser benchmark.
