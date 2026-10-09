# Status

## Implemented

- Faction/Dominion → Province → State hierarchy: 11 provinces, 47 independently selectable and conquerable polygons, five playable-scenario factions, and valid settlement reference points in every provincial seat.
- Additional first-pass geography: 57 provinces and 181 selectable draft states across the remaining Alps-to-Bengal theatre, with river/ridge-guided shared edges, proposed provincial seats, centre markers, province focus and geographic adjacency. Drafts are outside campaign ownership, orders, income and victory calculations.
- Named content in a dedicated data file, with a single coastline-clipped campaign envelope and district generation around places and travel hubs. Shared irregular edges respond to river and mountain cues.
- Pontus reaches the southern Black Sea coast; Assyria has five distinct northern Mesopotamian states. Both are genuine child unions with their own exterior borders.
- Exact state coverage and province unions, shared-edge adjacency, unique child membership, and derived dominions including divided provinces.
- Warm full-screen atlas with distinct dominion/province/state border weights. Province play is the default: fit-to-province camera, state labels, important settlements, armies and available orders. Overview shows factions; Detail reveals local information.
- Non-interactive, data-driven terrain corridors with macro/regional/local crossfades, restrained SVG relief, fertile washes, canals and tributaries; thin borders and selection remain visible over rivers.
- Babylon's coherent urban hinterland includes Borsippa; Sippar and Nippur remain separate; Ur and Chaldaea form the southern Chaldaea state, while Uruk’s site belongs to Nippur. Manual interior label overrides, collision-aware names, principal-seat coins and a main-settlement ring for every province.
- Babylonia is the first province with an authored river/canal/dryland partition: shared Tigris/Euphrates bank geometry, irregular palm/reed/dryland patches, northeastern foothills and state landscape descriptions. The eastern provincial seam follows one Tigris bank, with matching adjustments to the adjoining Susiana districts.
- Fixed Babylonia 2.5D prototype: shared fixed ground projection, upright depth-sorted SVG cities/palms/reeds/relief, ellipse shadows and stable authored placements. Borders sit beneath scenery and readable labels above it; projection-aware camera fitting and dragging preserve interaction. The flat-view toggle has been removed.
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

## Stable panning and prepared-image loading

The map retains a memory-bounded 192-pixel pan surface between gestures, avoiding grab/release scene rebuilds. Prepared images load through a three-job, visible-first queue with coarse theatre coverage and budgeted neighbour preloads. Tile publication updates the ground component alone; missing detail uses decoded coarse imagery or a cheap native land/coast base. Runtime Canvas painting remains serial.

Paired production checks show small-pan median intervals improving from 35.6 to 26.7 ms and wide-pan release work from 11.6 to 1.9 ms, with broadly similar pan task totals. Selection pacing still varies; these headless results do not establish 60 Hz movement. All 99 tests, lint and build pass. Measurements and reproduction instructions are in `PERFORMANCE.md`.

## Close-zoom quality correction

Persistent compositor promotion could enlarge an earlier SVG raster at close zoom, blurring even live mountains and rivers. Zoom, resize and display-density changes now allow a native paint before promoting the current scale again. Buffered panning stays retained. A browser pixel-comparison regression covers normal/high-DPI displays, repeated zoom cycles and rapid wheel reversals.


## Susa terrain and Susiana settlement development

Completed a light local pass on the Susa state: cultivated ground, date groves, reed margins, small fields and irrigation channels; a distinct colonnaded Susa capital; separate settlement centres for Karun, Elymais and Cossaea. Each state has one centre, which follows that state’s market progression. Susa retains its capital label and hierarchy. Three shared border cuts refine the northern foothill, eastern valley and southern wetland margins. Susa and its three adjoining states are the only districts with changed area. Core/theatre geometry and prepared terrain images are regenerated.

Validation: 102 tests, lint and production build, plus browser review of local detail, development tiers, settlement selection, settings and responsive views.


## Assyria province terrain and development — 5 October 2026

Completed the Assyria pass with one centre in each of its five states. Nineveh retains the province-capital role and gains a distinct gateway silhouette; Upper Euphrates, Nisibis, Arbela and Assur read their own state development levels. Eight restrained ground highlights, five small field parcels, sparse broadleaf groves/reeds and two schematic feeders support the river/plain landscape. Five shared border cuts follow the western plain, Tigris terraces and Greater/Lesser Zab valleys. Only the five Assyria states and adjoining Zagros change area; core/theatre geometry and prepared ground images are regenerated.

All 106 tests, lint and the production build pass. Desktop/mobile browser checks verify all five settlement centres, state selection, unique labels, actual Assur conquest, local market growth, simple markers and the SVG comparison. The corrected Susiana one-centre-per-state layout also passes its desktop/mobile checks.


## Persis terrain and atlas settlements

Completed 5 October 2026. Persis has one centre per atlas state, a distinct Persepolis capital and smaller Pasargadae village, fields/groves/palms, thirteen ground highlights and two schematic valley channels. Following the landscape reference, a broken northern belt extends the Carmanian ridge into lower foothills, with tapered silhouettes and ground shading. Twelve shared border cuts and four repositioned junctions round Persepolis and shape the northern/eastern basin margins. Broader cultivated ground, two more field patches and two grove groups connect the royal plains and southern plateau margins. The five Persis states and four adjoining atlas states change geometry; the playable core and remaining atlas regions are preserved. Prepared imagery is regenerated with matching even-odd state clipping in Canvas and SVG.

Persis remains an atlas province. Its settlement tiers are authored visual development, with no new playable markets or actions. Settlement labels have district-contained alternatives, duplicate atlas dots are omitted, and simple markers remain available. Browser verification covers all five centres on desktop/mobile, pointer selection, separate labels, native SVG art, simple-marker/vector fallback and core-only exclusion. See `MAP_GEOGRAPHY.md` for sources and reproduction.

Verification before the landscape remodel: all 111 unit tests, lint and production build pass. Persis, Susiana and Assyria browser checks pass on desktop and mobile; buffered panning and native close-zoom sharpness pass, including DPR 1 and 2.

Persis sparse-detail follow-up: added fourteen low stone/scrub clusters, two additional field parcels and three subdued stony/dry ground washes. The province retains five settlement centres and open plateau spacing. New artwork uses small native SVG symbols with screen-size caps and the existing layer controls. Prepared images are regenerated.

Persis landscape remodel verification: all 113 unit tests, lint and production build pass. Desktop/mobile Persis checks verify centre selection, labels, native artwork, layer controls and SVG/simple-marker fallbacks. Buffered panning checks also pass. Geometry comparison confirms changes in the five Persis states and four adjoining atlas states; all other atlas polygons and the playable core remain unchanged.


Border and Persis refinement: mountain-aligned atlas edges now use geographic foothill margins, with border layers beneath upright/overview relief. Persis is trimmed below its northern belt and follows the basin side of the Carmanian ridge. Persepolis has a compact rounded district; Pasargadae and the plateau fill the remaining space. The new Mountain Entrance follows the supplied red wedge and belongs to Media (Ecbatana’s province), with its own settlement and links to Cossaea, Elymais, Ecbatana and Paraitakene. The Babylon-side border retains its geometry beneath the mountains; Persis’s upper perimeter follows the orange reference. There are now 49 playable states, with the same opening player income and 25-state victory threshold.

Verification for the corrected border pass: 116 unit tests, lint and production build pass. Production browser checks cover Persis and the new entrance on desktop/mobile, border ordering beneath relief, centre selection and fallback rendering; Susiana and Assyria development checks and buffered-panning checks also pass. Prepared terrain contains 126 validated images (12.13 MiB). Geometry comparison against the preceding build confirms that only Cossaea, Elymais and Paraitakene contribute land to the new core state; other existing core territories retain their area.


Susian approach refinement: Mountain Entrance moves to Susiana, with a rounded valley corridor extending east into the western Persis plateau. Its old northern wedge returns to the neighbouring districts. Pasargadae stretches through the northern Carmanian ridge into the eastern valley, with a small opening in the upright relief; Carmanian Uplands stays in Carmania. The campaign/atlas seam is regenerated from the same core contour. Susiana has five states, Media seven, with 49 playable and 181 atlas states overall. The twelve opening Seleucid holdings provide 102 income; opening coin plus the first-turn income gives 224 treasury.

Susian approach verification: all 117 unit tests, lint and production build pass. Desktop/mobile production checks cover all five Susiana centres, the extended Pasargadae state, settlement selection/development, simple-marker/vector fallback and borders beneath relief. Assyria checks and retained-buffer panning regressions also pass. Prepared terrain is regenerated and all 126 images validate at 12.13 MiB.

## Border cleanup — 6 October 2026

Western Valley is a separate state in Media, with one homestead and Ecbatana as its provincial seat. The shared ridge boundary removes the Cossaean spur into that valley. Susiana’s Mountain Entrance has a restrained eastern contour between the two mountain belts, replacing the rounded protrusion. Persepolis has a larger hinterland centered on its city. Explicit Pasargadae geometry retains the cross-ridge pass while eliminating its accidental Gulf tail; Carmanian Uplands stays in Carmania. Western Persis, Central Plateau and the coast use shared cuts, with no detached mainland districts. The campaign now has 50 states and a 26-state majority target; opening player holdings, income and treasury remain 12 / 102 / 224.

Validation: all 119 unit tests, lint and the production build pass. Desktop/mobile browser checks pass for Persis, both approaches, Susiana and Assyria, including settlement selection, province membership, development, unique centres, simple markers and SVG terrain fallback. Buffered panning, zoom during drag, cancellation, camera limits and resize also pass. Prepared terrain is regenerated and all 126 images validate at 12.13 MiB.

## Independent mountain terrain — 6 October 2026

Mountain belts now belong to no state, province or faction. Generated passable polygons exclude 89 belts from all 50 core and 181 atlas states. State fills, hit areas, point queries, selection and cultivated ground clips use these polygons; division ink stops before the belts. Low foothills remain traversable. Nine named crossings leave narrow routes through the mountains, while the existing Persepolis royal plain remains an open inhabited basin. Independent ground and pass markers remain when relief artwork is hidden.

Army movement follows connected land components through friendly holdings. Split districts cannot transfer troops across their mountain gaps. Direct invasions and commander escape routes require reachable adjacent components; blocked actions explain the need for a pass or valley approach. All 50 campaign centres remain reachable, and the twelve opening holdings retain connected friendly routes.

Paraitakene's valley tongue is divided between Western Valley in Media and Mountain Entrance in Susiana, with a straighter valley boundary. Western Persis ends below its northern ridge. Pasargadae and its gardens move farther northeast, allowing a rounded Persepolis district centred on the city. Its eastern pass remains bounded inland; Carmanian Uplands stays in Carmania. State counts and opening economy remain 50 / 12 holdings / 102 income / 224 treasury, with a 26-state victory target.

Validation: all 123 unit tests, lint and production build pass. Desktop/mobile browser checks pass for independent mountain ownership and pointer selection, border clipping, settings, Persis and both approaches, Susiana and Assyria development/conquest, and retained-buffer panning. Production screenshots confirm the local district layout. All 126 regenerated terrain images validate at 12.12 MiB. Reproduce with `generate:map`, `generate:theatre`, `generate:barriers`, then `generate:ground`.

## Four-state Susiana and shared mountain approach — 6 October 2026

Cossaea is merged into Susa and its separate centre removed. Susiana now has four states, with one centre each: the larger Susa, Karun, Elymais and Mountain Entrance. The lower provincial frontier hugs the Shatt al-Arab's eastern bank, and Susa's southern division follows the lower Karkheh. The Karun/Elymais division leaves both settlements a coherent hinterland. Susa retains the merged base income of 20; opening income and treasury remain 102 / 224. The campaign has 49 states, eleven opening holdings and a 25-state majority target.

Mountain Entrance ends on the valley side of the central ridge, without leaking into Susa's main river plain. Its eastern envelope widens to include the valley floor. The divider with Elymais crosses the existing middle pass, then follows the southern ridge; both states have one substantial connected land component. The middle crossing from Susa and northern passage toward Paraitakene are closed while their mountains remain. The Western Valley connection and the shared Elymais approach stay open. Seven named pass markers remain; all 49 campaign centres are reachable.

Passable areas are approximately Susa 4,127, Karun 2,716, Elymais 3,062 and Mountain Entrance 2,375 map units squared. Tests verify these proportions, river-bank proximity, former Cossaean selection as Susa, excluded plain/extended valley fixtures, closed northern crossings, open Western Valley movement and campaign connectivity.

Validation: all 124 unit tests, lint and production build pass. Production browser checks pass on desktop/mobile for Susiana settlement selection and development, independent mountain ownership/hit areas, Persis, Assyria conquest/development and buffered panning. Production screenshots reviewed. All 126 regenerated prepared terrain images validate at 12.12 MiB.

## Open passage footprint and Persis seam — 6 October 2026

The Northern Fars barrier now starts at its first visible mountain after water/pass clearance. The old source-axis stump incorrectly excluded empty ground between Mountain Entrance and Elymais; both states now cover their parts of that valley up to the actual southern ridge. Visible mountains and the closed Susa/northern crossings retain their barriers. The eastern Mountain Entrance/Persis seam uses a single smooth sampled contour, shared with opposite orientation by both provinces.

Susiana remains four states with unchanged settlement anchors and opening economy. Passable areas are approximately Susa 4,127, Karun 2,716, Elymais 3,228 and Mountain Entrance 2,532 map units squared. All 49 campaign centres remain reachable.

Validation: all 126 tests, lint and production build pass. Desktop/mobile production checks cover restored valley pointer selection, independent mountain terrain, Susiana development, Persis and panning. Prepared ground is regenerated; all 126 images validate at 12.12 MiB. Production screenshots reviewed.

## River-led Babylonia cleanup — 6 October 2026

Babylonia now has five states. Babylon absorbs the former western Nippur peninsula and expands to its river-led northern edge. Sippar takes northwestern Diyala up to the displayed Diyala tributary, while Diyala remains on the opposite bank. Nippur fills the remaining interfluve. Its western vertex meets Babylon and Chaldaea exactly at the Euphrates, removing the narrow dryland tongue.

Uruk and Ur are retired as separate states and their southern catchments join Chaldaea. Chaldaea’s northern edge follows the physical Euphrates exactly, with no north-bank detour around towns. Uruk and Larsa remain secondary places in Nippur; Ur remains in Chaldaea. There are five primary Babylonian centres. Initial catchment seeds preserve adjacent provincial exteriors, then the retired runtime rings are deleted. The campaign has 47 states, nine starting friendly holdings and a 24-state victory target; merged income preserves opening income 102 and treasury 224.

The physical river construction is shared through `riverGeometry.ts`, allowing authored tributary boundaries to reuse the displayed snapped mouth. Map, atlas, independent mountain geometry and prepared ground are regenerated. All 130 unit tests, lint and the production build pass. Production desktop/mobile checks pass for Babylonian river-bank pointer selection, retired-state removal, secondary settlement ownership, development tiers, simple markers and vector fallback, and for independent mountains and pass markers. Buffered panning, release, zoom during drag, touch cancellation, camera limits and resize also pass. All 126 prepared terrain images validate at 12.12 MiB. Production border screenshots reviewed.

## Western Valley transfer and Karkheh frontage — 6 October 2026

Western Valley moves into Susiana as a separate state and starts under Seleucid ownership, following the selected ownership option. Susiana has five states and Media seven. Its northern frontier follows the actual upper Karkheh bends with a 1.4-map-unit southern bank margin, shared in reverse by Media. Only Western Valley, Nisaean Plain, Ecbatana and a small adjoining Paraitakene shoulder change geometry; the main Susa plain, Babylonian river districts and eastern mountain approach keep their areas.

The western pass remains open, giving friendly access from Susa. A friendly Western Valley also supplies an indirect route around the closed northern Mountain Entrance crossing. Existing mountains remain independent terrain. Opening holdings are ten, income 106 and treasury 228; the campaign remains 47 states with a 24-state majority target. A future opening before Nicanor’s defeat could instead represent Susiana within his Antigonid eastern sphere; that faction setup remains a separate scenario decision.

Validation: all 131 unit tests, lint and the production build pass. Production desktop/mobile checks pass for all five Susiana centres, river-bank pointer selection, new province membership, transferred-state development, simple markers and vector terrain, plus Persis approaches and independent mountain hit areas/pass markers. Prepared ground is regenerated and all 126 images validate at 12.13 MiB. Production border screenshot reviewed.


## Susiana river districts and reserved approach valley — 6 October 2026

Susiana retains five states. The former southern Karun and Elymais hinterlands combine into Elymais, while Karun becomes the smaller middle floodplain between Susa and the combined south. Shared boundaries use the displayed Karkheh and lower Karun centreline vertices, keeping the river channels on the division rather than assigning the whole river to one bank. Karun stops at the lower confluence and has no coastal tail. Its centre moves to [48.15, 31.15]; Elymais moves to [49.50, 31.02]. Fixed authoring seeds preserve the provincial exterior and unrelated state catchments.

Elymais follows the western upper Karun bend, then turns partway along the river segment toward the existing southern-ridge pass, matching the final red sketch. The mountain shoulder above the western river section becomes independent impassable terrain. The upper river reach and main approach valley remain in Mountain Entrance; its western and shared southern passes stay open. Passable areas are approximately Susa 4,032, Karun 1,106, Elymais 4,731, Mountain Entrance 2,472 and Western Valley 2,392 map units squared. State count, ownership and opening economy remain 47 / ten friendly holdings / 106 income / 228 treasury, with a 24-state victory target.

Validation: all 133 unit tests, lint and production build pass. Desktop/mobile production checks pass for all five Susiana labels and settlement centres, river-bank pointer selection, development, simple markers and vector fallback; independent terrain ownership and selection, reserved approach ground, border clipping and seven pass markers; and the Persis approaches and settlements. All 126 regenerated ground images validate at 12.13 MiB. Border screenshots reviewed.


## Persis Northern Highlands and directed valley layout — 7 October 2026

Persis retains five atlas states. Western Foothills replaces Central Plateau, with its primary centre relocated to the entry valley at [51.65, 31.55]. The roughly 6,830-map-unit Northern Highlands area is independent impassable terrain, with no district ownership, hit target, settlement or farms. A longer southern ridge frames Pasargadae’s corridor and its retained eastern Carmanian pass. Persepolis has an irregular city-centred valley outline, with separate Western Persis and coastal hinterlands. Carmanian Uplands remains in Carmania.

Passable areas are approximately Western Foothills 986, Pasargadae 6,331, Persepolis 3,419, Western Persis 3,324 and Persian Coast 8,897 map units squared. The five Persis district outlines change; adjacent atlas district areas remain unchanged. The short western ridge end removes approximately 6.3 units of Mountain Entrance land while preserving its main valley, eastern floor and open pass. Campaign count, ownership and opening economy remain 47 / ten friendly holdings / 106 income / 228 treasury, with a 24-state victory threshold.

Named area barriers share the existing mountain exclusion pipeline and gain a narrow clearance for border ink. Stipple, stony shading and a Northern Highlands / Impassable caption identify the block. Ground washes clip to its independent region in both prepared canvas artwork and the vector fallback. Generated atlas neighbours now reflect shared traversable land, removing inspector border links across the blocked north; playable component travel remains confined to core states.

Validation: all 134 unit tests, lint and production build pass. Desktop/mobile production checks pass for Persis’s five centres and labels, corridor pointer selection, retired plateau removal, independent region ownership/hit testing, hidden-relief behavior, simple markers and vector fallback; Susiana development and river-bank selection; independent mountain boundaries and passes; and buffered panning, release, zoom during drag, cancellation, limits and resize. All 126 regenerated terrain images validate at 12.17 MiB. Production screenshots reviewed.

## Persis entry enlargement and continuous capital highlight — 7 October 2026

Western Foothills gains approximately 717 map units squared from western Pasargadae, taking its passable area to 1,704; Pasargadae retains 5,613. Other atlas and core district areas are unchanged. The entry still connects to Mountain Entrance and Pasargadae’s eastern corridor remains connected. Pasargadae’s settlement moves northeast to [54.35, 31.10], together with its nearby gardens, fields and channel. Original Voronoi seeds stay fixed until authored partitioning, preventing unrelated border shifts.

Persepolis’s selected fill and perimeter now follow the full administrative outline beneath mountain artwork, removing the mountain-shaped highlight holes. The overlay ignores pointer events and leaves actual mountain ownership, state hit areas and pass restrictions intact. The usual passable target adds no second fill while this overlay is selected.

Validation: all 134 tests, lint and production build pass. Desktop/mobile production checks pass for Persis’s revised pointer selection, five centres, labels, vector fallback and continuous capital highlight; mountain ownership and pass markers; and buffered panning, camera limits and resize. All 126 regenerated ground images validate at 12.17 MiB. Production screenshots reviewed.

## Ecbatana / southern Media river partition — 7 October 2026

Western Valley moves back into Media with its existing Seleucid ownership and settlement. Media has eight states and Susiana four; Atropatene remains in the current Media province pending its separate reorganisation. The original northern Atropatene footprint and Ecbatana/Ganzak/Rhagae land above the river endpoint are retained. Zagros covers the Northern Zagros and Diyala entry passes, follows the western Diyala channel, and shares the northern Qezel Owzan frontage with Nisaean Plain. The capital, Rhagae and Paraitakene have new shared curved catchments. Western Valley’s upper boundary uses the Karkheh centreline; its southern mountain-side boundary preserves the closed northern Mountain Entrance crossing.

Passable areas are approximately Zagros 3,456, Nisaean Plain 2,298, Ecbatana 4,593, Rhagae 5,874, Paraitakene 2,827 and Western Valley 2,492 map units squared. Zagros’s river cut removes upper northeastern Diyala land and assigns its former western bank to Sippar; remaining Diyala is 2,586 and Sippar 3,744. Only these affected core catchments and Ganzak’s river shoulders change. Polygon differences verify unchanged Susa/Karun/Elymais/Mountain Entrance, Babylon/Nippur/Chaldaea, Atropatene, all atlas districts and finished Persis. The complete campaign remains one shared mesh without cracks, holes or overlaps.

Opening balance remains 47 states, ten friendly holdings, 106 income, 228 treasury and a 24-state victory target. Terrain remains independent and impassable outside the seven existing passes. The generated component graph has 63 core land components. Settlement centres, army routes and all opening friendly holdings remain valid and reachable.

Validation: all 138 tests, lint and production build pass. Production desktop/mobile checks pass for Media membership, both Zagros entrances, northern river-bank pointer selection, invisible-relief ownership and vector fallback; Susiana and Persis development; Babylonian river districts; independent mountain boundaries and passes; and buffered panning, drag release, zoom, cancellation, camera limits and resize. All 126 regenerated terrain images validate at 12.16 MiB. Production map screenshots reviewed.


## Media / Babylonia / Atropatene correction — 8 October 2026

Western Valley remains in Susiana, with Seleucid ownership and its exact upper Karkheh boundary. Zagros moves administratively to Babylonia while Nicanor holds it and Media’s four states: Nisaean Plain, Ecbatana, Rhagae and Paraitakene. Nicanor is now an active rival ruler and commander at Ecbatana, rather than a Seleucid recruit. Ganzak and Atropatene become a separate Antigonid province, with Ganzak as its provincial seat.

Zagros’s northern edge uses the marked local upper Diyala, keeping both mountain entrances while stopping short of the distant northern river. The former northern Ecbatana/Rhagae spurs and Zagros’s upper arm join Ganzak. A leftover Sippar shoulder above the local channel is transferred as well, with a curved foothill join to the existing western frontier. The finished Susiana and Persis districts, all atlas district polygons, Nisaean Plain, Paraitakene, Babylon/Nippur/Chaldaea and Atropatene’s state footprint remain geometrically unchanged. Passable areas are approximately Zagros 2,350, Ganzak 9,631, Ecbatana 3,857, Rhagae 4,494 and Sippar 3,254 map units squared.

There are eleven core provinces and 47 states: Babylonia six, Susiana five, Media four and Atropatene two. Opening balance remains ten player holdings, 106 income, 228 treasury and a 24-state victory target. Babylonia is now divided politically; Susiana remains a complete player-held province. Independent mountains and all seven passes are preserved; the generated travel graph has 62 core land components.

Validation: all 139 tests, lint and production build pass. Production desktop/mobile checks pass for the corrected province memberships and Nicanor ownership, capital and state selection, river banks, both Zagros entrances, independent mountain clipping and vector fallback. Susiana and Persis development checks pass. All 126 regenerated terrain images validate at 12.17 MiB. Map screenshots reviewed.


## Independent Atropatene and northern border refinement — 8 October 2026

Ganzak and Atropatene are owned by the independent Atropatene faction, with a separate green palette and a seat at Ganzak. This supersedes their previous Antigonid ownership. Zagros remains in Babylonia under Nicanor; Western Valley remains in Susiana with the same owner as Susa. Province membership and ownership are independent. The scenario retains eleven provinces, 47 states and the same ten player holdings, income and victory target.

Nisaean Plain now follows the complete western Qezel Owzan bend, removing the diagonal shortcut to its downstream junction and gaining approximately 146 map units squared from Ganzak. Rhagae gains approximately 413 from Ecbatana’s northern shoulder; their shared smooth contour follows the northern ridge’s western base and reuses an exact provincial junction. Only these two state pairs change geometrically. All atlas polygons, Zagros, Western Valley and the finished Susa, Babylon and Persis districts remain unchanged. Mountains and the seven passes retain their independent terrain and movement rules.

The development preview can retain an existing campaign across React hot reloads. Reloading the page or choosing New game loads corrected starting ownership and province memberships.

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
