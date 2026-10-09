import { canTravelDirectly } from '../game/mountainTerrain'
import { memo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { battlePreview, COST, factions, income, leader, movementPath, ownerName, phase, PLAYER, provinceStates, provinceSummary, recruit, selectedProvince, selectedState, stateDefense, stateIncome, unavailable } from '../game/engine'
import type { Action, CampaignAction } from '../game/engine'
import type { GameState } from '../game/data'

type CampaignProps = { game: GameState; dispatch: Dispatch<Action> }
export const CampaignHud = memo(function CampaignHud({game,dispatch,onReset}:CampaignProps & {onReset:()=>void}) {
  const campaignPhase = phase(game)
  const ended = campaignPhase === 'victory' || campaignPhase === 'defeat'
  return <>
      <header className="campaign-hud" aria-label="Campaign controls">
        <h1 className="sr-only">Diadochi</h1>
        <div className="resources" aria-label="Campaign resources">
          <div><span>Turn</span><strong>{game.turn}</strong></div>
          <div><span>Treasury</span><strong>{game.treasury} <small>coin</small></strong></div>
          <div><span>Orders</span><strong>{game.orders} <small>/ 3</small></strong></div>
          <div><span>Income</span><strong>+{income(game)} <small>/ turn</small></strong></div>
        </div>
        <div className="turn-actions">
          <button onClick={() => dispatch({ type: 'endTurn' })} disabled={!!game.battle || ended}>End turn</button>
          <button className="secondary" onClick={onReset}>New game</button>
        </div>
      </header>
      {ended && <section className="outcome" role="status"><h2>{campaignPhase === 'victory' ? 'A kingdom secured' : 'Your kingdom has fallen'}</h2><p>{campaignPhase === 'victory' ? 'You hold a majority of the states. This campaign is complete.' : 'You no longer control any states.'} Start a new game to play again.</p></section>}
  </>
})

type PanelProps = CampaignProps & {
  openPanel: 'roster' | 'log' | null
  setOpenPanel: Dispatch<SetStateAction<PanelProps['openPanel']>>
  select: (id:string) => void
  dismiss: () => void
  focusProvince: () => void
}
// Camera changes do not affect these gameplay panels or their route previews.
export const CampaignPanels = memo(function CampaignPanels({game,dispatch,openPanel,setOpenPanel,select,dismiss,focusProvince}:PanelProps) {
  const state = selectedState(game), province = selectedProvince(game)
  const members = province ? provinceStates(game, province) : []
  const summary = province ? provinceSummary(game, province) : null
  const commander = leader(game), candidate = recruit(game)
  const battleState = game.states.find(s => s.id === game.battle?.stateId)
  const campaignPhase = phase(game)
  const ended = campaignPhase === 'victory' || campaignPhase === 'defeat'
  const route = state && !game.battle && !openPanel ? movementPath(game, state.id) : null
  const actions: { type: CampaignAction; label: string; detail: string }[] = [
    { type: 'develop', label: 'Develop', detail: `${COST.develop} coin · +4 income / turn` },
    { type: 'recruit', label: candidate ? `Recruit ${candidate.name}` : 'Recruit', detail: `${COST.recruit} coin · local commander` },
    { type: 'fortify', label: 'Build fort', detail: `${COST.fortify} coin · +3 local defense` },
    { type: 'move', label: 'Move commander here', detail: 'March through connected friendly states' },
    { type: 'invade', label: 'Invade', detail: `Led by ${commander?.name ?? 'no commander'}` },
  ]
  return <>
        {state && province && !game.battle && !openPanel && <aside key={state.id} className="panel command-panel" data-side="right" aria-labelledby="command-title">
          <button className="close-panel" aria-label="Close state details" onClick={dismiss}>×</button>
          <p className="eyebrow">{province.name} · State command</p><h2 id="command-title">{state.name}</h2>
          <p className="subtle">Controlled by {ownerName(state.owner)}</p>
          <dl className="province-stats"><div><dt>Income / turn</dt><dd>{stateIncome(state)}</dd></div><div><dt>Market level</dt><dd>{state.buildings.market}</dd></div><div><dt>Defense</dt><dd>{stateDefense(state)}</dd></div></dl>
          <div className="province-summary">
            <h3>{province.name} <small>province</small></h3>
            <button className="focus-province secondary" onClick={focusProvince}>Focus province</button>
            <p className="subtle">{summary!.stateCount} states · {summary!.playerStates} held by you · {summary!.playerIncome} income to you</p>
            <div className="province-members" aria-label={`States in ${province.name}`}>{members.map((member) => <button key={member.id} className="secondary" aria-label={`${member.name}, ${ownerName(member.owner)}`} aria-pressed={state.id === member.id} onClick={() => select(member.id)}><i style={{ background: factions.find((f) => f.id === member.owner)?.color }} aria-hidden="true" />{member.name}</button>)}</div>
          </div>
          <p className="subtle local-summary">{state.terrain} · {state.garrison} garrison · Fort level {state.buildings.fort}{state.settlementIds.length > 0 && <> · {game.settlements.filter((p) => p.stateId === state.id).map((p) => p.name).join(', ')}</>}</p>
          {state.landscape && <p className="subtle terrain-summary">{state.landscape}</p>}
          <p className="subtle">Borders {state.neighbors.map((id, i) => <span key={id}>{i > 0 && ', '}<button className="state-link" onClick={() => select(id)}>{game.states.find((p) => p.id === id)?.name}</button></span>)}.</p>
          {state.neighbors.some(id=>!canTravelDirectly(state.id,id))&&<p className="subtle mountain-route-note">Mountain barriers toward {state.neighbors.filter(id=>!canTravelDirectly(state.id,id)).map(id=>game.states.find(s=>s.id===id)!.name).join(', ')}. Use an open pass or valley approach.</p>}
          <label htmlFor="commander">Field commander</label>
          <select id="commander" value={game.selectedCommanderId} disabled={!!game.battle || ended} onChange={(e) => dispatch({ type: 'selectCommander', id: e.target.value })}>
            {game.commanders.filter((c) => c.faction === PLAYER).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.troops} troops</option>)}
          </select>
          <p className="subtle">{commander?.name} is in {game.states.find((p) => p.id === commander?.locationStateId)?.name}. Each action costs one order.</p>
          {route && route.length > 1 ? <p className="subtle route-preview">Route: {route.map((id) => game.states.find((p) => p.id === id)!.name).join(' → ')}</p> : null}
          <div className="action-list">{actions.filter((action) => state.owner === PLAYER ? action.type !== 'invade' && (action.type !== 'recruit' || candidate) : action.type === 'invade').map((action) => {
            const reason = unavailable(game, action.type)
            return <div key={action.type}><button disabled={!!reason} aria-describedby={`${action.type}-help`} onClick={() => dispatch({ type: action.type })}>{action.label}</button><p id={`${action.type}-help`}>{reason ?? action.detail}</p></div>
          })}</div>
        </aside>}
        {game.battle && <section className="panel battle-panel" aria-labelledby="battle-title" aria-live="polite">
          <div><p className="eyebrow">Battle in progress</p><h2 id="battle-title">The battle for {battleState?.name}</h2><p>{game.battle.playerCommander.name} against {game.battle.enemyCommander.name}</p><p className="subtle">Strength = attack + defense + speed + leadership + ⌊troops / 4⌋. Defenders add state defense. Ties favor the attacker.</p></div>
          <div className="battle-plans">{(['assault', 'guard'] as const).map((plan) => {
            const result = battlePreview(game, plan)!
            return <div key={plan}><h3>{plan === 'assault' ? 'Assault · +12 strength' : 'Guard · +8 strength'}</h3><p className="battle-score">{result.player} <span>vs</span> {result.enemy}</p><p>{result.won ? 'Capture state' : 'Defenders hold'} · Lose {result.casualties} troops · {result.coin > 0 ? '+' : ''}{result.coin} coin</p><button onClick={() => dispatch({ type: 'resolve', plan })}>{plan === 'assault' ? 'Assault' : 'Guard'}</button></div>
          })}<div><h3>Retreat</h3><p>Withdraw without casualties. The invasion order stays spent.</p><button className="secondary" onClick={() => dispatch({ type: 'resolve', plan: 'retreat' })}>Retreat</button></div></div>
        </section>}
        {openPanel === 'roster' && <section id="roster-panel" className="panel utility-panel roster-panel" aria-labelledby="roster-title"><button className="close-panel" aria-label="Close commanders" onClick={() => setOpenPanel(null)}>×</button><p className="eyebrow">Your household</p><h2 id="roster-title">Commanders</h2><div className="roster">{game.commanders.filter((c) => c.faction === PLAYER).map((c) => <article key={c.id}><h3>{c.name}{c.id === game.selectedCommanderId && <small> · Leading</small>}</h3><p>{c.specialty}</p><p className="subtle">Attack {c.attack} · Defense {c.defense} · Speed {c.speed} · Leadership {c.leadership}</p><strong>{c.troops} troops · {game.states.find((p) => p.id === c.locationStateId)?.name}</strong></article>)}</div></section>}
        {openPanel === 'log' && <section id="log-panel" className="panel utility-panel log-panel" aria-labelledby="log-title"><button className="close-panel" aria-label="Close command log" onClick={() => setOpenPanel(null)}>×</button><p className="eyebrow">Campaign record</p><h2 id="log-title">Command log</h2><ol>{game.log.slice(-12).map((entry, i) => <li key={`${game.log.length - 12 + i}-${entry}`}>{entry}</li>)}</ol><p className="session-note">Rivals hold position in 0.1. Progress resets on reload.</p></section>}
  </>
})
