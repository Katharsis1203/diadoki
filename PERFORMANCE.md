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

## Verification

- 49 tests cover campaign behaviour, geographic coverage and shared edges, point-query parity at vertices/edges/interiors, independent resets, selection no-ops and fresh scene data after development/ownership/commander changes.
- TypeScript/production build and ESLint pass.
- Exported vertices, rings, labels and coordinate outlines compare exactly with the pre-audit geometry; map regeneration remains deterministic.
- Province and overview screenshots compare pixel-for-pixel with the pushed build.
- Browser checks cover all 48 polygon selections, all ten province fits, label collisions, conquest/frontier updates, pan, flat/2.5D switching, upright anchors/depth order, seven Babylonian centres, wheel directions/limits/cursor anchoring and responsive controls.

No new combat, income, fortification, terrain movement, AI, city-founding or development-project mechanics were activated. The planned mechanics remain in the README.
