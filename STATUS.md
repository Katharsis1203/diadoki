# Status

## Implemented

- Faction/Dominion → Province → State hierarchy: 10 provinces, 48 independently selectable and conquerable polygons, three factions, and 32 settlement reference points.
- Additional first-pass geography: 57 provinces and 181 selectable draft states across the remaining Alps-to-Bengal theatre, with river/ridge-guided shared edges, proposed provincial seats, centre markers, province focus and geographic adjacency. Drafts are outside campaign ownership, orders, income and victory calculations.
- Named content in a dedicated data file, with a single coastline-clipped campaign envelope and district generation around places and travel hubs. Shared irregular edges respond to river and mountain cues.
- Pontus reaches the southern Black Sea coast; Assyria has five distinct northern Mesopotamian states. Both are genuine child unions with their own exterior borders.
- Exact state coverage and province unions, shared-edge adjacency, unique child membership, and derived dominions including divided provinces.
- Warm full-screen atlas with distinct dominion/province/state border weights. Province play is the default: fit-to-province camera, state labels, important settlements, armies and available orders. Overview shows factions; Detail reveals local information.
- Non-interactive, data-driven terrain corridors with macro/regional/local crossfades, restrained SVG relief, fertile washes, canals and tributaries; thin borders and selection remain visible over rivers.
- Babylon's coherent urban hinterland includes Borsippa; Sippar, Nippur, Uruk and Ur remain separate. Manual interior label overrides, collision-aware names, principal-seat coins and a main-settlement ring for every province.
- Babylonia is the first province with an authored river/canal/dryland partition: shared Tigris/Euphrates bank geometry, irregular palm/reed/dryland patches, northeastern foothills and state landscape descriptions. The eastern provincial seam follows one Tigris bank, with matching adjustments to the adjoining Susiana districts.
- Fixed Babylonia 2.5D prototype: shared fixed ground projection, upright depth-sorted SVG cities/palms/reeds/relief, ellipse shadows and stable authored placements. Borders and readable labels sit above scenery; projection-aware camera fitting and dragging preserve interaction. The flat-view toggle has been removed.
- Measured performance pass: prepared geometry/adjacency, deduplicated coordinate serialization, memoized map layers and gameplay panels, stable wheel handling and cached scene preparation. The audit and remaining SVG painting costs are recorded in `PERFORMANCE.md`; `npm run benchmark:map` repeats core timings.
- Development-based settlement appearance only in Babylonia: one primary centre per state, one distinctive Babylon capital, Sippar as a village and five homesteads/camps at the opening market levels. Capital status is separate from tier; labels sit near their centres. Editable visual thresholds adapt the current market levels; development points, separate fortification, capital support and province income remain documented future design.
- Conditional floating state/province details, sibling/neighbor navigation, aggregated control/income, pan/zoom, keyboard and touch selection, compact HUD and dismissible log/commander layers.
- State-local markets, forts, income, garrisons, recruitment, development/capture event hooks and actual commander locations.
- Marching through connected friendly states and invasion from the army's bordering state. Conquest moves the army and transfers only the target state.
- Pure action validation, exact battle previews, persistent losses, retreat, three-order turns, majority victory and reset.
- Regression coverage for geometry/model/rules/labels, province camera fits, terrain transitions and a full winning campaign. Browser validation covers all 48 state clicks, all ten province views, labels, conquest, pan and responsive controls.

## Limitations

- District boundaries, principal seats and the roster are approximate prototype content, not a scenario validated for a fixed opening year. Physical features use modern Natural Earth geography.
- The additional provinces are selectable map drafts outside the playable campaign; remaining unpartitioned land is physical context.
- Terrain and waterways are authored illustration without gameplay modifiers; close labels may still be omitted where space is tight, especially on small screens.
- Individually reviewed district geography currently covers Babylonia and its eastern neighbours. Additional theatre boundaries are first-pass terrain-guided catchments; historical refinement, balance and detailed settlement artwork still need authoring. The Babylon canal districts are schematic campaign geography.
- Rivals hold position. Defeat exists but rival attacks are not implemented.
- No saves/import, upkeep, troop replenishment, province-wide policies, loyalty systems or tactical formations.
- Local events support development/capture hooks; full branching narrative scenes remain future work.
- Recruitment selects the first local candidate; progress remains in memory and resets on reload.

## Next work

1. Continue terrain/border authoring one province at a time, following the Babylonia pass.
2. Confirm the historical opening and refine district/settlement content against sources.
3. Add troop replenishment and playtest movement and building costs across the larger map.
4. Add versioned, validated saves.
5. Introduce rival actions and province administration in separate milestones.

## Political atlas update

The 57 additional provinces have authored ownership across 31 map factions. Western spheres loosely follow autumn 312 BCE, with Cassander and Lysimachus added, regional western rulers, and nine independent eastern satraps each holding one or two provinces. Province defaults/state exceptions and colours are editable in `politicalContent.ts`. The original active campaign remains unchanged; new faction assignments are atlas content awaiting playable integration.

Unified core/atlas frontier edges avoid duplicate borders at their shared seam, remain responsive to conquest, and use thinner faction strokes. Overview labels and provincial inspectors identify rulers; Ptolemy’s atlas principal seat is Alexandria. The map always uses upright 2.5D scenery.

## Performance review and display controls

Added 12 persistent local display switches with Full/Light presets and an SVG/cached-ground comparison. Disabled scenery and labels skip their preparation; selections, faction frontiers, simple primary centres and gameplay remain available. Cache publication is progressive, fallback is restricted to missing tile rectangles, and cache-off disposes bitmap resources. Terrain/ownership culling, prepared overview artwork, inactive-tier omission and frame-batched pan reduce unnecessary rendering work. The audit and production benchmark protocol are in PERFORMANCE.md.

## Prepared ground follow-up

The default shaded map now displays generated ground-colour images directly rather than creating Canvas tiles during navigation. Geographic source geometry, coastline/land/lake masks and all live map/game layers remain intact. Both image renderers share the bounded cache lifecycle; navigation uses prepared files rather than repainting gradients. Settings adds a prepared/live comparison (13 local switches total); original cached and SVG renderers remain available. Generated imagery covers the full theatre with three detail profiles and two resolutions. Builds verify the source fingerprint and complete artwork coverage before compiling.

Completion checks on 4 October 2026 passed 89 tests, lint, production build, all 13 settings, campaign/atlas selection and province fits, responsive views, image-failure fallback and cache disposal/reactivation. Builds also validate image dimensions and content hashes. The retained benchmark shows lower scripting time but effectively unchanged total pan/zoom task time; measurements and raw reports are recorded in `PERFORMANCE.md` and `benchmarks/`.

## Panning follow-up

Dragging now translates a retained composited SVG scene with a bounded buffer, refreshing it before new areas reach the viewport. Release settles the exact camera and removes the buffer/compositor hint. Coordinates, wheel anchoring, pointer capture, cancellation and camera limits remain validated. Paired production medians, including release, reduce small-pan task time from 4.39 to 0.50 seconds (89%) and wide-pan time from 4.49 to 1.07 seconds (76%); median pan animation intervals improve from 52–54 to 36–37 ms. Results are machine-specific and recorded in `PERFORMANCE.md` with raw reports in `benchmarks/`. All 92 tests, lint, build and desktop/mobile browser regressions pass.
