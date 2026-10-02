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

## Remaining limit

SVG layout, rasterization and painting remain the largest cost during zoom. In the final browser sample, total zoom task time was about 7.0 seconds versus 7.6 seconds before; another optimized sample was about 8.2 seconds. This variation does not establish a reliable overall zoom or FPS improvement despite the consistent reduction in JavaScript work.

An isolated trial disabling river-wash blur suggested painting savings, but also changed the illustration. The existing wash, grain, mountain density, lighting and ownership blending were retained. A future measured pass could evaluate caching broad ground washes as transparent textures, with memory budgets, zoom-quality checks and a visual comparison. Keep interactive polygons, boundaries, labels and upright scenery separate. This is a proposal, not a new dependency or renderer in this pass.

### Regional terrain follow-up (earlier build)

The initial regional terrain pass added 23 ridge sections (including the three existing Babylon-adjacent sections) and 17 named river features. Placement generation and terrain brush marks run once; scene preparation remains cached during pan, and caption/asset visibility uses the viewport. Rocky valley gaps use precomputed brush placement instead of another large SVG mask. Existing local washes are not duplicated beneath the new relief, and no per-object filters or dependencies are added.

The expanded production bundle is **427.97 kB / 150.20 kB gzip**. The same three-sample browser check measured median JavaScript totals of **155 ms pan, 447 ms zoom and 408 ms selection** for 120 inputs. Total task times were **4.79 s, 6.08 s and 1.67 s**, respectively. These are observational measurements rather than FPS guarantees; broader terrain coverage increases SVG painting work, especially during pan. The earlier audit tables describe the smaller pre-expansion scene. Geometry regeneration remains byte-identical, and the expanded test suite has 53 passing tests.

### Italy-to-Ganges expansion

The full theatre now has **88 ridge sections, 62 named river features and 1,176 stable scenery placements** (including Babylon's existing centres/vegetation). Expanding the map does not expand the playable state model. Core preparation benchmark medians remain approximately 0.10 ms for border paths, 0.17 ms for province fit and 0.09 ms for preparing all scenery; pan reuses the prepared scene. The seven regional browser checks draw **41–131 scenery objects**, rather than all placements.

Actual viewport bounds account for SVG meet scaling and vertical compression. Upright scenery, river artwork and ground sections are culled; river bounds and brush artwork are prepared once. Border masks consider only rivers near playable states and cover the viewport. Paper grain is also bounded to the viewport and clipped to land. Coastlines outside the theatre are simplified. The production build separates application code (**371.67 kB / 123.08 kB gzip**) from embedded physical data (**260.39 kB / 113.48 kB gzip**), keeping each chunk below the build warning threshold. Physical data has its own cacheable build chunk; it is embedded application data, with no external runtime mapping service or new dependency.

An isolated three-sample production check using the same 120-input protocol measured median JavaScript totals of **241 ms pan, 605 ms zoom and 413 ms selection**, with total task times **8.82 s, 10.22 s and 2.69 s**. This larger scene increases SVG painting work; these numbers do not establish an FPS improvement. The earlier audit/regional tables describe smaller scenes. Further coastline/wash rasterization or spatial partitioning would need separate visual and memory-budget validation.

The current suite has **55 passing tests**. Browser verification includes the entire Overview, seven distant regional views, both projections, cursor anchoring and mobile theatre fit, as well as the existing 48-state selection, ownership/conquest and ten-province checks. Both physical-data regeneration and playable mesh regeneration are byte-identical against the same source cache.

## Verification

- The original audit had 49 tests covering campaign behaviour, geographic coverage and shared edges, point-query parity at vertices/edges/interiors, independent resets, selection no-ops and fresh scene data after development/ownership/commander changes.
- TypeScript/production build and ESLint pass.
- Exported vertices, rings, labels and coordinate outlines compare exactly with the pre-audit geometry; map regeneration remains deterministic.
- The original audit province/overview screenshots compared pixel-for-pixel with the pushed build. The terrain expansions intentionally change relief and coastline context; playable geometry remains identical.
- Browser checks cover all 48 polygon selections, all ten province fits, label collisions, conquest/frontier updates, pan, flat/2.5D switching, upright anchors/depth order, seven Babylonian centres, wheel directions/limits/cursor anchoring and responsive controls.

No new combat, income, fortification, terrain movement, AI, city-founding or development-project mechanics were activated. The planned mechanics remain in the README.
