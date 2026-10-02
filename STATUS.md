# Status

## Implemented

- Faction/Dominion → Province → State hierarchy: 10 provinces, 48 independently selectable and conquerable polygons, three factions, and 32 settlement reference points.
- Named content in a dedicated data file, with a single coastline-clipped campaign envelope and district generation around places and travel hubs. Shared irregular edges respond to river and mountain cues.
- Pontus reaches the southern Black Sea coast; Assyria has five distinct northern Mesopotamian states. Both are genuine child unions with their own exterior borders.
- Exact state coverage and province unions, shared-edge adjacency, unique child membership, and derived dominions including divided provinces.
- Warm full-screen atlas with distinct dominion/province/state border weights. Province play is the default: fit-to-province camera, state labels, important settlements, armies and available orders. Overview shows factions; Detail reveals local information.
- Non-interactive, data-driven terrain corridors with macro/regional/local crossfades, restrained SVG relief, fertile washes, canals and tributaries; thin borders and selection remain visible over rivers.
- Babylon's coherent urban hinterland includes Borsippa; Sippar, Nippur, Uruk and Ur remain separate. Manual interior label overrides, collision-aware names, principal-seat coins and a main-settlement ring for every province.
- Babylonia is the first province with an authored river/canal/dryland partition: shared Tigris/Euphrates bank geometry, irregular palm/reed/dryland patches, northeastern foothills and state landscape descriptions. The eastern provincial seam follows one Tigris bank, with matching adjustments to the adjoining Susiana districts.
- Switchable Babylonia 2.5D prototype: shared fixed ground projection, upright depth-sorted SVG cities/palms/reeds/relief, ellipse shadows and stable authored placements. Borders and readable labels sit above scenery; projection-aware camera fitting and dragging preserve interaction. The 2.5D toggle restores flat view.
- Visual settlement hierarchy only in Babylonia: one primary centre per state, one distinctive Babylon capital, four medium fortified towns and two small villages. Capital status is separate from tier; labels sit near their centres. Proposed defensive support and income mechanics are documented as future work in the README.
- Conditional floating state/province details, sibling/neighbor navigation, aggregated control/income, pan/zoom, keyboard and touch selection, compact HUD and dismissible log/commander layers.
- State-local markets, forts, income, garrisons, recruitment, development/capture event hooks and actual commander locations.
- Marching through connected friendly states and invasion from the army's bordering state. Conquest moves the army and transfers only the target state.
- Pure action validation, exact battle previews, persistent losses, retreat, three-order turns, majority victory and reset.
- Regression coverage for geometry/model/rules/labels, province camera fits, terrain transitions and a full winning campaign. Browser validation covers all 48 state clicks, all ten province views, labels, conquest, pan and responsive controls.

## Limitations

- District boundaries, principal seats and the roster are approximate prototype content, not a scenario validated for a fixed opening year. Physical features use modern Natural Earth geography.
- Surrounding background land and offshore islands are context outside the campaign envelope.
- Terrain and waterways are authored illustration without gameplay modifiers; close labels may still be omitted where space is tight, especially on small screens.
- Province-by-province authoring currently covers Babylonia. Other provinces retain the earlier catchments and regular corridor symbols. The new canal districts are schematic campaign geography.
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
