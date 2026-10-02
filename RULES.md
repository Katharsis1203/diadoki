# Rules

## Territorial hierarchy and turn loop

- Ten provinces contain 48 independently playable states. Each state belongs to exactly one province.
- The Seleucids begin with all eleven states of Babylonia and Susiana. Ptolemies and Antigonids own the other 37.
- A dominion comprises all states controlled by a faction. A province is fully controlled only when all its children have the same owner; otherwise it is divided.
- Turn one starts with 122 coin plus 98 opening income, for 220 total, and three orders.
- Legal development, fort construction, recruitment, marching and invasion each spend one order. Failed validation changes nothing.
- End turn is available outside battle during an unfinished campaign, even when orders remain.
- Each new turn grants three orders and income from every owned state: base income + market level × 4. Holdings in divided provinces still pay.
- Provincial totals aggregate their children and are not a second income payment.
- Rivals hold position in this prototype; they do not initiate invasions.
- Battle blocks campaign actions and state/commander changes until resolved.

## Buildings, recruitment and movement

- Develop costs 25 coin and adds one local market level, increasing subsequent state income by four.
- Build fort costs 30 coin and adds one local fort level. Defense = base defense + fort level × 3.
- Recruit costs 40 coin in an owned state with an available local candidate. The first candidate joins once and becomes the selected commander.
- Nicanor and Sophanes originate in Babylon; Cleitus originates in Susa. Other states in those provinces do not provide the same recruits.
- Commanders have a current state independently of their home/recruitment origin.
- Move commander here spends one order to march along a connected route through owned states, possibly crossing multiple friendly districts. It cannot cross enemy territory or disconnected land.
- An invasion requires the selected commander to be in an owned state sharing an actual edge with the target. Owning a distant border elsewhere is insufficient.
- Neighbor and sibling links in the details layer select the corresponding state; the route preview shows a legal friendly march.

## State garrisons and battle

- States have their own persistent garrison counts. A local faction commander defends when present; otherwise the state garrison supplies the defending force.
- Strength = attack + defense + speed + leadership + floor(troops / 4). The defender adds local state defense, including forts.
- Assault adds 12 strength; guard adds 8. Greater or equal strength captures only the target state.
- Assault loses 6 troops on victory or 10 on defeat. Guard loses 2 on victory or 4 on defeat. Losses cannot exceed remaining troops.
- A win grants 20 coin, transfers the target's ownership and moves the attacker into it. The captured state's garrison becomes half its old count, floored at eight.
- A defeated named commander withdraws to an adjacent friendly state with ten troop losses, or loses their remaining force if no withdrawal exists.
- Defeat leaves ownership and army location unchanged and costs 15 coin for assault or five for guard. Treasury is floored at zero.
- Retreat changes no ownership, garrison, troops, army location or treasury; the invasion order remains spent.
- Dominion borders recalculate from state ownership. Province/state administrative boundaries stay fixed.
- Previews include exact strength, losses and coin changes. There is no random roll.

## Local events

- Event definitions name a target state and trigger on its development or capture.
- Resolution is stored in that state's event IDs and does not affect siblings.
- Susa's first development records a workshop event. Nippur's first capture records a local treasury event worth eight additional coin.
- Capture-event coin appears in the battle preview and applies once. This is a small state-local hook system; branching scenes are not implemented.

## Victory, defeat and session

- A strict majority of states wins: currently 25 of 48. The target derives from map size.
- Campaign actions stop after victory until New game.
- Zero controlled states is defeat; rivals do not currently attack, so normal play cannot reach this condition.
- The log retains up to 100 entries and displays the newest 12.
- Progress resets on reload. Upkeep, replenishment, save/import and rival campaign AI remain future work.
