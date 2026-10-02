# Milestones

## Milestone 0.1: core campaign and combat shell

### Goal

An interactive browser prototype that demonstrates campaign control, a simple invasion system and the turn loop in a compact Diadochi setting.

### Acceptance criteria

- The app loads with a full-screen campaign map, 10 provinces containing 48 states, and a visible player faction.
- Named districts and settlement data live outside the renderer; province exteriors are exact child unions.
- Marching and building actions target individual states, and invasions require a bordering army.
- Three detail levels show dominion overview, province play with state names, or local state/city inspection, with faction coins only at principal seats.
- The default camera fits Babylonia; Focus province fits any selected province's states on desktop and mobile.
- Geographic terrain forms restrained relief beneath political borders and markers, crossfades between detail levels and never intercepts selection.
- States share exact borders and belong to connected provinces; ownership and conquest are local to each state.
- Province, state and dominion borders remain visually distinct; divided provinces show mixed control.
- A state can be selected; its own stats and its parent province appear in a floating layer.
- The player can spend a campaign order to develop a controlled state.
- The player can recruit a commander in a controlled state when treasury allows.
- A neighboring enemy state can be selected to trigger an invasion battle.
- The battle has visible strength comparison and can be resolved with assault, guard or retreat.
- Turning the campaign advances treasury income and resets orders.
- The command log stays readable and tracks turn progression.
- The game can be reset to a fresh state.

### Non-goals for this milestone

- Full AI faction interaction beyond a simplified turn summary.
- Detailed event scenes, loyalty systems or full campaign AI.
- Save-state import and export beyond a resettable local session.

## Later milestones

- Expanded faction AI and political consequences.
- Story events and persistent character branches.
- Save and load with versioned game state.
- More refined battle systems and unit-role tuning.
