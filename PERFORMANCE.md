# System performance audit

Audit date: 2 October 2026. The pre-audit build was committed and pushed to `Katharsis1203/diadoki` as `f4e4b9f` before changes began.

## Findings and changes

| Area reviewed | Finding | Implemented change |
| --- | --- | --- |
| React map rendering | Every camera update rebuilt terrain, artwork definitions, political polygons and gameplay panels. | Memoized independent SVG layers and gameplay panels. Individual scenery sprites reuse prepared objects during pan. |
| Scene preparation | Panning recalculated settlement anchors, candidate label positions and containment checks. | `mapScene.ts` separates scene preparation from viewport visibility. Dependencies include the actual visual state, zoom and projection; treasury/log updates do not rebuild this scene. |
| Geometry queries | Each label candidate rebuilt its state's coordinate array; points outside the state still ran ray casting. | Prepare coordinates, SVG shapes and bounds once. Reject points outside the bounding rectangle before the original ray-casting calculation. |
| Borders and adjacency | Shared-edge segment strings were repeatedly reconstructed; reset rediscovered all neighbours and province borders. | Prepare edge ink and adjacency once. Reset copies mutable game arrays from static metadata. Current ownership still determines faction frontiers. |
| Input and camera | The wheel listener was removed and reattached after camera changes. Province fitting repeatedly parsed identical shapes. | A stable React effect event reads current wheel state; listener and observer cleanup remain explicit. Memoize the province camera. Immediate zoom and cursor anchoring are preserved. |
| Gameplay calculations | Sidebar route previews called path finding up to three times. Phase, income and province summaries repeated filtering. Selecting the same state/commander created another game object. | Calculate each preview once, reuse intermediate values, and return the original state for repeated selection. Combat, economy, movement and availability rules are unchanged. |
| Content size | Province/campaign outlines duplicated coordinate data already in the shared mesh. Unused starter assets and SVG definitions remained. | Serialize outlines as mesh indices while keeping the existing coordinate exports. Remove unused campaign clipping, route-wash gradients and four unreferenced starter assets. |
| Dependencies/build | Reviewed the installed dependency graph and production output. | No dependencies or rendering frameworks added. `npm audit` reported zero vulnerabilities in the installed dependency graph. |

Prepared geometry is bounded by the fixed campaign content; there is no growing global cache keyed by camera position or game history. Coordinates remain readonly. New games receive independent mutable arrays, buildings, commanders and event state.

## Measurements

Core timings are milliseconds per operation, using seven warmed samples and their median. `labelContainment` checks seven candidate positions for every state. Run `npm run benchmark:map` to repeat these informational checks; they are not hardware-dependent pass/fail tests.

| Operation | Before | After |
| --- | ---: | ---: |
| Create/reset campaign | 5.966 | 0.020 |
| Build political border paths | 0.724 | 0.101 |
| Check label containment batch | 0.434 | 0.021 |
| Fit Babylonia camera | 0.275 | 0.168 |
| Prepare scenery objects | 0.014 | 0.007 |
| Find friendly route to Ur | 0.0025 | 0.0026 |

The benchmark checksum is identical before and after. Route finding was already inexpensive at the current 48-state scale, so its algorithm was retained. Province fitting and scenery preparation also show small absolute costs; the main gain is avoiding their repeated execution.

Production browser profiling used headless Brave at 1440×900, Chrome DevTools `Performance.getMetrics`, and three samples per scenario. Each sample sends 120 inputs, one per animation frame: pan follows a fixed sinusoidal path; wheel zoom alternates ±8 pixels at a fixed cursor; selection cycles six Babylonian states. Each scenario starts from New game. These are total JavaScript times for the entire sample, not FPS measurements.

| Scenario | Before JavaScript time | After JavaScript time | Reduction |
| --- | ---: | ---: | ---: |
| Pan | 573 ms | 146 ms | 75% |
| Wheel zoom | 882 ms | 595 ms | 33% |
| State selection | 527 ms | 324 ms | 38% |

The production JavaScript bundle decreased from **431.82 kB / 148.31 kB gzip** to **410.64 kB / 143.22 kB gzip**, primarily through coordinate deduplication. Removing unimported starter artwork cleans the repository; it is not counted as a JavaScript saving.

## Earlier SVG painting limit

SVG layout, rasterization and painting remain the largest cost during zoom. In the final browser sample, total zoom task time was about 7.0 seconds versus 7.6 seconds before; another optimized sample was about 8.2 seconds. This variation does not establish a reliable overall zoom or FPS improvement despite the consistent reduction in JavaScript work.

An isolated trial disabling river-wash blur suggested painting savings, but also changed the illustration. The existing wash, grain, mountain density, lighting and ownership blending were retained. A future measured pass could evaluate caching broad ground washes as transparent textures, with memory budgets, zoom-quality checks and a visual comparison. Keep interactive polygons, boundaries, labels and upright scenery separate. That proposal was subsequently implemented in the cached-ground follow-up below.

### Regional terrain follow-up (earlier build)

The initial regional terrain pass added 23 ridge sections (including the three existing Babylon-adjacent sections) and 17 named river features. Placement generation and terrain brush marks run once; scene preparation remains cached during pan, and caption/asset visibility uses the viewport. Rocky valley gaps use precomputed brush placement instead of another large SVG mask. Existing local washes are not duplicated beneath the new relief, and no per-object filters or dependencies are added.

The expanded production bundle is **427.97 kB / 150.20 kB gzip**. The same three-sample browser check measured median JavaScript totals of **155 ms pan, 447 ms zoom and 408 ms selection** for 120 inputs. Total task times were **4.79 s, 6.08 s and 1.67 s**, respectively. These are observational measurements rather than FPS guarantees; broader terrain coverage increases SVG painting work, especially during pan. The earlier audit tables describe the smaller pre-expansion scene. Geometry regeneration remains byte-identical, and the expanded test suite has 53 passing tests.

### Italy-to-Ganges expansion

The full theatre now has **88 ridge sections, 62 named river features and 1,176 stable scenery placements** (including Babylon's existing centres/vegetation). Expanding the map does not expand the playable state model. Core preparation benchmark medians remain approximately 0.10 ms for border paths, 0.17 ms for province fit and 0.09 ms for preparing all scenery; pan reuses the prepared scene. The seven regional browser checks draw **41–131 scenery objects**, rather than all placements.

Actual viewport bounds account for SVG meet scaling and vertical compression. Upright scenery, river artwork and ground sections are culled; river bounds and brush artwork are prepared once. Border masks consider only rivers near playable states and cover the viewport. Paper grain is also bounded to the viewport and clipped to land. Coastlines outside the theatre are simplified. The production build separates application code (**371.67 kB / 123.08 kB gzip**) from embedded physical data (**260.39 kB / 113.48 kB gzip**), keeping each chunk below the build warning threshold. Physical data has its own cacheable build chunk; it is embedded application data, with no external runtime mapping service or new dependency.

An isolated three-sample production check using the same 120-input protocol measured median JavaScript totals of **241 ms pan, 605 ms zoom and 413 ms selection**, with total task times **8.82 s, 10.22 s and 2.69 s**. This larger scene increases SVG painting work; these numbers do not establish an FPS improvement. The earlier audit/regional tables describe smaller scenes. Further coastline/wash rasterization or spatial partitioning would need separate visual and memory-budget validation.

The Italy-to-Ganges expansion had **55 passing tests**. Browser verification includes the entire Overview, seven distant regional views, both projections, cursor anchoring and mobile theatre fit, as well as the existing 48-state selection, ownership/conquest and ten-province checks. Both physical-data regeneration and playable mesh regeneration are byte-identical against the same source cache.

### Cached ground follow-up

The complete coastline/background was the dominant painting cost in layer-isolation checks. Hiding upright scenery produced a much smaller saving. The map now clips background geometry to nearby geographic chunks and paints static land/coastal/terrain/fertility shading once into reusable local PNG tiles using native Canvas 2D. Interactive state polygons, ownership, selection, borders, sharp rivers, labels, armies and upright scenery remain SVG. Source geometry, map projection and immediate cursor-anchored zoom are unchanged.

The per-map cache has a **64 MiB decoded-pixel budget**, adaptive power-of-two tile resolution and a DPR cap of 1.5. One asynchronous encoding/decoding job runs at a time; changing the camera removes obsolete queued jobs. In-flight obsolete results are released, old regions/resolutions are evicted by least recent use and object URLs are revoked on unmount. The current region is displayed as local vector ground until all requested images have decoded. Bitmap failure retains that fallback. The memory budget is an estimate for RGBA textures, not a bound on all browser/GPU memory.

Production profiling compared cached ground against the original vector authoring view at `/?ground=vector`, using the existing three-sample, 120-input protocol at 1440×900. Each cached scenario waits for its initial window to decode before measurement; additional tile loading during movement is included. Results below are median **total browser task time**, not JavaScript time or FPS.

| Scenario | Original vector ground | Cached ground | Reduction |
| --- | ---: | ---: | ---: |
| Pan | 9.12 s | 3.30 s | 64% |
| Zoom | 10.56 s | 3.32 s | 69% |
| Selection | 2.88 s | 1.23 s | 57% |

Median JavaScript totals were 300 / 671 / 489 ms with vector ground and 271 / 691 / 457 ms with cached ground (pan / zoom / selection). The improvement is primarily in rendering; cache planning introduces a small additional zoom scripting cost. First visits to new regions or resolution tiers still generate tiles, and upright scenery still incurs SVG painting cost. These timings are machine-specific observations, not FPS guarantees.

The application chunk is **380.65 kB / 126.49 kB gzip**, with the unchanged physical-data chunk **260.39 kB / 113.48 kB gzip**. Shared coastline references prevent production constant inlining from duplicating the large path in JSX. No dependencies are added.

Eight new regressions cover clipped land/holes/concavities, negative-coordinate and high-DPI tile coverage, decoded-memory limits, reuse/eviction, obsolete queues/results, disposal/reactivation and bitmap failure. The full suite has **63 passing tests**. Browser checks cover cached viewport coverage, ownership-independent reuse, both projections, pan/zoom, mobile and unsupported-Canvas fallback, alongside existing playable-state/ownership/scenery/wheel regressions. See [MAP_GEOGRAPHY.md](MAP_GEOGRAPHY.md#cached-ground-rendering) for tuning constants and authoring comparison.

### Alps-to-Bengal crop

The background source now omits land beyond the illustrated theatre, with a small margin for the Alpine rim, Egypt and the Bengal delta. The physical-data chunk fell from **260.39 kB / 113.48 kB gzip** to **157.67 kB / 68.09 kB gzip** (about 40% smaller). The generated geography source fell from 211,924 to 109,193 bytes and keeps 88 land rings. Coastlines are separate from polygon crop cuts.

Rendering, source generation, camera limits and tile requests share `mapExtent.ts`. Cached requests intersect the theatre instead of allocating textures for the blank margins visible at Overview. Camera clamping includes aspect ratio and ground compression; ordinary interior pan and wheel anchoring are preserved, while the crop limits win at an edge. Wide views keep any fully visible axis centred. A parchment margin replaces distant geography.

The existing rivers and playable mesh regenerate byte-identically. A pre-crop reference verifies 3,740 retained land/sea queries. Six new regressions cover source extent, unchanged state centres, real coast strokes, disconnected reaches, camera margins/Overview fit and bounded tile demand. The full suite has **69 passing tests**. Browser checks cover 48 selections, ten province fits, conquest/ownership, upright anchors, wheel zoom and limits, seven regional views, four camera edges in both projections and responsive Overview. This crop reduces transfer size and unnecessary background work; no additional FPS claim is made.

## Verification

### First-pass province overlays

The new 57-province / 181-state draft partition is generated offline. Shared paths, extents, border tiers and adjacency are prepared once, and rendering culls districts/edges to the viewport. Inactive draft hit areas are fully transparent; hover and selection remain live. No new scenery families, per-object filters, dependencies or active gameplay calculations were added. The additional geometry is a separate **143.51 kB / 58.29 kB gzip** cacheable chunk; the application chunk is **398.00 kB / 132.43 kB gzip**. The existing physical data and 64 MiB ground cache remain intact.

`/?provinces=core` hides the new overlays for comparison. A matched single-sample production check at 1440×900, with 120 inputs per scenario, measured core-only / drafts total task times of **8.20 / 7.13 s pan**, **6.96 / 8.14 s zoom**, and **2.37 / 2.20 s selection**. This sample does not establish a consistent speed change or an FPS claim; the background painting remains the principal cost and added live geography can add work during zoom. Earlier cached-ground measurements above describe their original build/session and should not be treated as a controlled baseline for this expansion.

All 75 regressions pass, including exact additional footprint coverage, absence of overlaps, original-campaign exclusion, shared edges/adjacency, centre and label containment, terrain-aligned boundaries and projection round trips. Browser checks cover all 181 additional centre clicks and 57 province fits, all 48 existing state clicks and ten campaign province fits, label collisions, conquest, wheel anchoring, both projections and responsive controls. Core geometry is byte-identical and additional generation is deterministic.

- The original audit had 49 tests covering campaign behaviour, geographic coverage and shared edges, point-query parity at vertices/edges/interiors, independent resets, selection no-ops and fresh scene data after development/ownership/commander changes.
- TypeScript/production build and ESLint pass.
- Exported vertices, rings, labels and coordinate outlines compare exactly with the pre-audit geometry; map regeneration remains deterministic.
- The original audit province/overview screenshots compared pixel-for-pixel with the pushed build. The terrain expansions intentionally change relief and coastline context; playable geometry remains identical.
- Browser checks cover all 48 polygon selections, all ten province fits, label collisions, conquest/frontier updates, pan, flat/2.5D switching, upright anchors/depth order, seven Babylonian centres, wheel directions/limits/cursor anchoring and responsive controls.

No new combat, income, fortification, terrain movement, AI, city-founding or development-project mechanics were activated. The planned mechanics remain in the README.

## Political atlas follow-up

The political update reuses cached ground and viewport culling. Shared political edges for the core and new provinces are noded offline, prepared once, and reclassified only when campaign state ownership changes. Border and ownership artwork outside the viewport is omitted; no runtime geometry booleans or per-asset filters were added. Including noded core rings raises the additional geography chunk from 143.51 kB / 58.29 kB gzip to approximately 174.09 kB / 72.18 kB gzip. This is an explicit data cost for correct shared frontiers, not a claimed performance improvement. The flat-view UI has been removed; older flat-mode measurements remain historical audit results.

## Deep review — 3 October 2026

The current political-atlas build was profiled in production before these changes, using a separate retained build directory. The review covered React reconciliation and label preparation, SVG painting/compositing, terrain/ownership bounds, ground-tile demand and lifecycle, mouse input, campaign algorithms, embedded geometry, and build/runtime dependencies. Gameplay and geographic meshes remain intact.

| Finding | Change or assessment |
| --- | --- |
| A new missing ground tile replaced the entire cached viewport with SVG ground. A 90-frame pan showed 64 fallback frames. | Publish ready tiles progressively and draw vector fallback only in missing rectangles. Identical snapped clips preserve coastal transparency; tile notifications are limited to one per display frame. |
| Invisible terrain tiers and distant engravings remained mounted and reconciled. | Cull symbols/routes/washes to the viewport and omit children of zero-opacity tiers. Primary scenery placements and lighting are preserved. |
| Overview relief was regenerated as camera-independent JSX, and nearby Overview views retained all ranges. | Prepare fixed-projection peak paths once and cull using full relief bounds, including peak height. |
| Core ownership fills included offscreen states; border/mask preparation reparsed immutable polygon strings after state changes. | Reuse precomputed `stateBounds`; cull ownership paths before drawing. |
| Both hidden and visible core label tiers ran layout every render. | Prepare and lay out the visible tier; disabled labels skip placement work. |
| Selection and commander changes rebuilt unchanged scenery objects and invalidated sprite memoization. | Cache artwork separately using visual settings, state content and zoom; reuse its object references when only selection changes. |
| Pointer bursts could schedule repeated camera state changes. | Retain the latest pan target, commit at most once per display frame and flush on release. Cancel obsolete targets on zoom/unmount. Immediate wheel behaviour is retained. |
| Terrain types had no independent on/off controls. | Add 12 local display switches, Full/Light presets and safe persistence; disabled objects are omitted rather than CSS-hidden. |
| Static wash painting iterated distant brush collections for every tile. | Reject nonintersecting collections before creating gradients, using bounds that include complete wash radii. |
| Cache resources and profile changes needed to remain bounded during testing. | Keep the 64 MiB decoded budget and LRU eviction; separate shaded/plain keys; dispose bitmap resources when cached ground is disabled. |
| Campaign route search, income and battle validation operate on only 48 states. | Existing algorithms are small and covered by gameplay tests. Retain their behaviour; map painting is the larger navigation cost. |
| Physical/theatre geometry is embedded and cacheable; asset symbols are reused SVG. | Retain existing data chunks and no runtime downloads. No new app dependencies or rendering framework. |

The default full-detail map retains all artwork and colours. A 1440×900 baseline/optimized comparison of the map area (914,400 pixels, excluding toolbar changes) found zero overview pixels differing by more than 10 channel levels and 27 province pixels above that threshold. Initial province SVG nodes fell from 2,342 to 2,167; terrain engraving uses fell from 70 to 13, while the 166 visible scenery objects stayed identical. This node count is an observation of that view, not an FPS estimate.

### Production comparison

Each build ran sequentially in headless Chromium-compatible Brave at 1440×900, with three samples of 120 inputs per scenario. These are medians of **total browser task time** across the whole input sequence, including loading new ground tiles. The baseline is the political-atlas build retained before this review; all three runs use the same campaign, camera and input protocol.

| Scenario | Before review | Optimized Full detail | Full-detail reduction | Light detail | Light reduction versus optimized Full |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pan | 6.47 s | 4.37 s | 32% | 1.16 s | 74% |
| Zoom | 6.73 s | 5.61 s | 17% | 1.65 s | 71% |
| Selection | 1.51 s | 1.46 s | 3% | 1.04 s | 29% |

Median script totals (pan / zoom / selection) were **443 / 905 / 542 ms** before the review, **582 / 888 / 494 ms** with optimized Full detail and **481 / 687 / 427 ms** with Light detail. Progressive clipping introduces additional pan scripting work, while reduced painting/compositing lowers total task time. The small selection improvement is within normal measurement variability; the reliable observed gains are in map navigation. These are machine-specific measurements, not FPS guarantees or predictions for another device.

In the three baseline pan samples, the whole viewport switched to vector fallback for 90, 84 and 46 of 120 frames. Optimized Full detail had 89, 83 and 83 **partial-cache** frames: decoded tiles remained present and only missing rectangles used vector ground. Loading new regions remains work rather than being excluded from the profile. Light detail is an explicit visual tradeoff and does not claim to retain every decorative asset.

The final application chunk is **413.64 kB / 137.54 kB gzip**, CSS **14.40 kB / 4.25 kB gzip**; physical and theatre data remain **157.67 kB / 68.09 kB gzip** and **174.09 kB / 72.18 kB gzip** respectively. No dependencies were added.

### Reproduce measurements

`npm run benchmark:map` measures reset, core/full-theatre borders, province/overview scene preparation, containment, province fit, scenery and friendly route search. These warmed CPU timings have no hardware-dependent pass/fail threshold.

`npm run benchmark:browser -- http://127.0.0.1:5175 report.json` runs three production browser samples of 120 pan, alternating wheel and selection inputs at 1440×900. It records total browser task time, script/layout/style time, renderer status and SVG nodes. Run builds sequentially with no competing browser benchmarks. Total task time is not FPS or end-to-end input latency. Start a production preview before running it.

The optional browser benchmark needs a separately installed Playwright module and Chromium-compatible browser; neither becomes a game dependency. Set `DIADOCHI_PLAYWRIGHT_MODULE` to its absolute `index.mjs` path and optionally `DIADOCHI_BROWSER` to the browser executable. `DIADOCHI_BENCHMARK_SAMPLES` and `DIADOCHI_BENCHMARK_EVENTS` control sample/input counts. `DIADOCHI_BENCHMARK_PRESET=light` chooses the new lighter preset. The normal run uses a fresh browser context and Full detail.

### Review verification

All **85 automated tests**, ESLint and the TypeScript/production build pass. New regressions cover corrupt/outdated saved preferences, visual-layer omission without campaign mutation, primary-centre replacements, shaded/plain tile identity, progressive cache publication, shared device-pixel seams and artwork reuse across selection changes.

Production browser checks passed all 12 controls, both presets, reload persistence, responsive settings panels (390×844, 320×568 and 844×390), simple centre markers, selected outlines with ordinary divisions hidden, ownership identification without fills, cursor-anchored wheel zoom, pan bursts and zoom limits. Progressive loading retained overlapping decoded tiles, stayed inside the decoded-cache budget and removed fallback pieces when ready. A browser with Canvas 2D disabled retained selectable vector ground without errors.

The full map regression checked **48 core polygon clicks / ten province fits**, conquest/frontier updates, terrain detail tiers and label collisions, plus **181 draft centre clicks / 57 province fits**, upright projected markers, zoom and responsive views. Campaign resources remained unchanged during display tests. The core `stateGeometry.ts` SHA-256 remains `6cbb3e9c217eeb17fd9dd207a5effbc193f154c3d790356561aa9372516549cd`.

### Remaining costs

Upright peaks/vegetation still incur SVG painting, ownership uses multiply compositing, grain clips to physical land, and live faction edges/river masks remain necessary. The new switches isolate these costs on the user’s hardware. Further rasterizing upright scenery or political overlays would require separate depth/anchor/ownership validation. Terrain geometry is generated offline, and active game logic does not grow with the draft atlas. Development StrictMode intentionally repeats some lifecycle work; measurements above use production builds.
