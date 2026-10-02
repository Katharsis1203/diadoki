# Game Design

## Scope and direction

This document records the approved starting direction for the Diadochi game prototype. It is a working record rather than a final historical survey.

## Approved foundation

- Game: browser-first, single-player, turn-based conquest strategy.
- Setting: Wars of Alexander's successors, with a light historical-fiction tone.
- Reference: Sengoku Rance in structure and system clarity, not in copied assets or content.
- Stack: React, TypeScript and Vite.
- Visual direction: bright blue seas, warm parchment land, principal-seat faction seals, and clear dominion outlines in an atlas presentation.
- Primary view: one complete province, its states and nearby territory. Focus province fits that area; the full map serves as an overview and navigation layer.
- Relief: restrained illustrated terrain beneath borders and labels, with broad, regional and local detail. Terrain and shared boundaries respond to the same geographic corridors; terrain modifiers remain future work.
- Refine terrain and political geography one province at a time. Babylonia is the first pass, with irrigated urban hinterlands, selected river-bank borders, canal districts, western dryland and southern marshes. Use deliberately placed terrain groups instead of regular symbol rows in reviewed provinces.
- Keep selected province borders continuous over rivers; draw a main-settlement marker per province and omit road routes. Babylonia's eastern edge follows one Tigris bank, with adjoining territory adjusted to match.
- Faction icons: simple Seleucid anchor, Ptolemaic eagle on thunderbolt, and Antigonid Macedonian shield.
- Milestone target: playable 0.1 slice featuring 10 provinces containing 48 states, three factions, a minimal campaign loop, battle resolution and command log.

## Prototype gameplay rules

- Each player turn grants three Command Orders.
- Orders cover conquest, development, recruitment, and basic campaign actions.
- An invasion battle is resolved as a compact formation-style encounter with a visible strength comparison.
- Victory transfers one target state to the player; defeat leaves it under enemy control.
- Campaign turns award treasury income from controlled states.
- States hold markets, forts, garrisons, settlements and local event resolution.
- Commanders occupy states and march through connected friendly territory.
- Overview shows dominion names; province play shows state names, important settlements and armies. Detail adds local information. Province names stay in the interface; coins appear only at principal seats.
- The player can recruit one available commander in their controlled home state.
- Provinces contain multiple states and can be divided between factions. Individual states are the unit of development, income and conquest.
- The campaign is intentionally limited in scale and does not yet include full political simulation.

## Design tensions to preserve

- Resource scarcity should force meaningful decisions.
- Commanders should feel distinct in how they are recruited and used.
- Battles should be easier to read than a full real-time tactical system.
- The story should remain grounded in the Diadochi era while leaving room for original drama.

## Remaining questions

- Which protagonist and dated opening should the Babylon-based Seleucid campaign use?
- Should the tone be more grounded historical fiction or a more stylized presentation?
- How similar to Sengoku Rance should the battle and campaign rules feel?
- Are romance or adult narrative content allowed in the story layer?

## Record-keeping rule

Later decisions override earlier defaults in this brief. This file must remain the authoritative summary of the approved direction.

## Current implementation defaults

The repaired 0.1 slice uses the Seleucids opening from Babylon as the player faction and the Ptolemies and Antigonids as the two rival factions. Ten provinces group 48 contiguous states with Natural Earth physical features; their borders remain approximate campaign boundaries. Cilicia, Pontus, Phoenicia and Assyria split oversized earlier regions, and Babylonia has a smaller desert footprint. Province ownership derives from state control, and victory requires a strict majority of states (25 at this map size). State borders derive from irregular catchments anchored on cities and districts, with river and mountain cues. Province geometry is the exact union of its children. Marching follows friendly state routes, and invasion requires an army at an adjoining state. These defaults do not settle the remaining questions above. Battles use a selectable commander, deterministic previews, and persistent casualties; tactical formations and rival attacks remain later work.
