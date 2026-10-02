import { useEffect, useReducer, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { battlePreview, COST, createInitialState, factions, gameReducer, income, leader, ownerName, phase, PLAYER, provinceStates, recruit, selectedState, stateIncome, stateDefense, unavailable, provinceSummary, movementPath, controlled, victoryTarget } from './game/engine'
import type { CampaignAction } from './game/engine'
import { CampaignMap } from './components/CampaignMap'
import { INITIAL_CAMERA, OVERVIEW_CAMERA, focusCamera, MAP_HEIGHT, MAP_WIDTH, mapLevel } from './game/mapView'
import type { Camera, MapLevel } from './game/mapView'
import { factionSymbols } from './game/factionSymbols'
import { cameraPan, mapProjection } from './game/mapProjection'
import type { MapPoint } from './game/mapProjection'
import './App.css'

const cameraAtZoom = (camera: Camera, zoom: number, anchor?: MapPoint): Camera => {
  const ratio = camera.zoom / zoom
  return {
    x: anchor ? anchor[0] + (camera.x - anchor[0]) * ratio : camera.x,
    y: anchor ? anchor[1] + (camera.y - anchor[1]) * ratio : camera.y,
    zoom,
  }
}

function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const [openPanel, setOpenPanel] = useState<'roster' | 'log' | null>(null)
  const [stateDetail, setStateDetail] = useState<MapLevel | null>(null)
  const [freeCamera, setCamera] = useState(INITIAL_CAMERA)
  const [cameraMode, setCameraMode] = useState<'province'|'overview'|'free'>('province')
  const [focusedProvinceId, setFocusedProvinceId] = useState('babylonia')
  const [perspective,setPerspective] = useState(true)
  const [viewport,setViewport] = useState({width:window.innerWidth,height:window.innerHeight})
  const drag = useRef<{ x: number; y: number; cameraX: number; cameraY: number; scale: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const zoomAnimation = useRef<{ camera: Camera; target: number; anchor?: MapPoint; frame: number; time: number } | null>(null)
  const stopZoom = () => {
    if (zoomAnimation.current) cancelAnimationFrame(zoomAnimation.current.frame)
    zoomAnimation.current = null
  }
  useEffect(() => () => {
    if (zoomAnimation.current) cancelAnimationFrame(zoomAnimation.current.frame)
  }, [])
  useEffect(() => {
    const resize = () => setViewport({width:window.innerWidth,height:window.innerHeight})
    window.addEventListener('resize',resize)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenPanel(null)
      dispatch({ type: 'selectState', id: null })
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {window.removeEventListener('keydown', closeOnEscape);window.removeEventListener('resize',resize)}
  }, [])
  const state = selectedState(game)
  const province = game.provinces.find((p) => p.id === state?.provinceId)
  const members = province ? provinceStates(game, province) : []
  const focusedProvince = game.provinces.find(p=>p.id===focusedProvinceId)!
  const camera = cameraMode==='province' ? focusCamera(provinceStates(game,focusedProvince).map(p=>p.shape),viewport,!!state&&!openPanel&&!game.battle,perspective) : freeCamera
  const terrainLevel = stateDetail ?? (cameraMode === 'province' ? 'province' : undefined)
  const level = mapLevel(camera.zoom, terrainLevel)
  const summary = province ? provinceSummary(game, province) : null
  const select = (id: string) => { stopZoom(); setOpenPanel(null); dispatch({ type: 'selectState', id }) }
  const campaignPhase = phase(game)
  const ended = campaignPhase === 'victory' || campaignPhase === 'defeat'
  const commander = leader(game)
  const candidate = recruit(game)
  const battleState = game.states.find((s) => s.id === game.battle?.stateId)
  const actions: { type: CampaignAction; label: string; detail: string }[] = [
    { type: 'develop', label: 'Develop', detail: `${COST.develop} coin · +4 income / turn` },
    { type: 'recruit', label: candidate ? `Recruit ${candidate.name}` : 'Recruit', detail: `${COST.recruit} coin · local commander` },
    { type: 'fortify', label: 'Build fort', detail: `${COST.fortify} coin · +3 local defense` },
    { type: 'move', label: 'Move commander here', detail: 'March through connected friendly states' },
    { type: 'invade', label: 'Invade', detail: `Led by ${commander?.name ?? 'no commander'}` },
  ]

  const dismiss = () => {
    setOpenPanel(null)
    dispatch({ type: 'selectState', id: null })
  }
  const zoomMap = (factor: number, anchor?: MapPoint, smooth = false) => {
    const running = zoomAnimation.current
    const current = running?.camera ?? camera
    const target = Math.max(.65, Math.min(7, (smooth ? running?.target ?? current.zoom : current.zoom) * factor))
    if (target === current.zoom && !running) return
    drag.current = null
    // Seed the free camera before the first animation frame leaves province focus.
    setCamera(current)
    setStateDetail(null)
    setCameraMode('free')
    if (!smooth || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stopZoom()
      setCamera(cameraAtZoom(current, target, anchor))
      return
    }
    if (running) {
      // Accumulate wheel input against the destination, including direction changes.
      running.target = target
      running.anchor = anchor
      return
    }
    const animation = { camera: current, target, anchor, frame: 0, time: performance.now() }
    zoomAnimation.current = animation
    const step = (time: number) => {
      if (zoomAnimation.current !== animation) return
      const distance = Math.log(animation.target / animation.camera.zoom)
      const done = Math.abs(distance) < .001
      // Time-based easing stays consistent on different refresh rates.
      const amount = 1 - Math.exp(-Math.max(0, time - animation.time) / 70)
      const zoom = done ? animation.target : animation.camera.zoom * Math.exp(distance * amount)
      animation.camera = cameraAtZoom(animation.camera, zoom, animation.anchor)
      animation.time = time
      setCamera(animation.camera)
      if (done) zoomAnimation.current = null
      else animation.frame = requestAnimationFrame(step)
    }
    animation.frame = requestAnimationFrame(step)
  }
  const focusProvince = () => {stopZoom();setFocusedProvinceId(province?.id??focusedProvinceId);setCameraMode('province');setStateDetail(null)}
  const overview = () => {stopZoom();setCamera(OVERVIEW_CAMERA);setCameraMode('overview');setStateDetail(null);dismiss()}
  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    stopZoom()
    suppressClick.current = false
    const rect = event.currentTarget.getBoundingClientRect()
    drag.current = {
      x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y,
      scale: Math.min(rect.width / (MAP_WIDTH / camera.zoom), rect.height / (MAP_HEIGHT / camera.zoom)), moved: false,
    }
  }
  const moveDrag = (event: PointerEvent<SVGSVGElement>) => {
    const start = drag.current
    if (!start) return
    const dx = event.clientX - start.x, dy = event.clientY - start.y
    if (!start.moved && Math.hypot(dx, dy) < 6) return
    start.moved = true
    suppressClick.current = true
    setCameraMode('free')
    event.currentTarget.setPointerCapture(event.pointerId)
    const [panX,panY]=cameraPan(dx,dy,start.scale,mapProjection(perspective))
    setCamera({ ...camera, x: start.cameraX - panX, y: start.cameraY - panY })
  }
  const stopDrag = () => { drag.current = null }

  return (
    <div className="app-shell">
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
          <button className="secondary" onClick={() => { stopZoom(); dispatch({ type: 'reset' }); setOpenPanel(null); setStateDetail(null); setFocusedProvinceId('babylonia');setCameraMode('province') }}>New game</button>
        </div>
      </header>
      {ended && <section className="outcome" role="status"><h2>{campaignPhase === 'victory' ? 'A kingdom secured' : 'Your kingdom has fallen'}</h2><p>{campaignPhase === 'victory' ? 'You hold a majority of the states. This campaign is complete.' : 'You no longer control any states.'} Start a new game to play again.</p></section>}
      <main className="game-layout">
        <section className="map-panel" aria-labelledby="map-title">
          <h2 id="map-title" className="sr-only">A divided empire · Campaign map</h2>
          <div className="map-location" aria-live="polite"><p className="eyebrow">{level==='dominion'?'The successor kingdoms':level==='state'?'Local inspection':'Province campaign'}</p><p>{level==='dominion'?'A divided empire':province?.name??focusedProvince.name}<small>{level!=='dominion'&&`${(province??focusedProvince).stateIds.length} states · ${game.orders} orders available`}</small></p></div>
          <CampaignMap game={game} camera={camera} level={level} terrainLevel={terrainLevel} perspective={perspective} onSelect={select} onBackground={dismiss} suppressClick={suppressClick}
            onZoom={zoomMap} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} />
        </section>
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
          <label htmlFor="commander">Field commander</label>
          <select id="commander" value={game.selectedCommanderId} disabled={!!game.battle || ended} onChange={(e) => dispatch({ type: 'selectCommander', id: e.target.value })}>
            {game.commanders.filter((c) => c.faction === PLAYER).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.troops} troops</option>)}
          </select>
          <p className="subtle">{commander?.name} is in {game.states.find((p) => p.id === commander?.locationStateId)?.name}. Each action costs one order.</p>
          {movementPath(game, state.id)?.length && movementPath(game, state.id)!.length > 1 ? <p className="subtle route-preview">Route: {movementPath(game, state.id)!.map((id) => game.states.find((p) => p.id === id)!.name).join(' → ')}</p> : null}
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
        <p className="sr-only" role="status">{game.log.at(-1)}</p>
      </main>
      <div className="map-toolbar">
        <div className="map-legend" aria-label="Faction symbols and dominion borders">{factions.map((f) => <span key={f.id} title={factionSymbols[f.id].description}><svg className="faction-seal" viewBox="-14 -14 28 28" aria-label={`${f.name}: ${factionSymbols[f.id].name}`} role="img" color={f.color}><circle className="seal-ring" r="13" /><use href={`#seal-${factionSymbols[f.id].symbol}`} x="-10" y="-10" width="20" height="20" /></svg>{f.name}</span>)}<span className="border-key"><i />Dominion</span><span className="border-key provincial"><i />Province</span><span className="border-key district"><i />State</span></div>
        <div className="map-toolbar-actions">
          <div className="utility-actions"><button className="secondary" aria-expanded={openPanel === 'roster'} aria-controls={openPanel === 'roster' ? 'roster-panel' : undefined} disabled={!!game.battle} onClick={() => setOpenPanel(openPanel === 'roster' ? null : 'roster')}>Commanders</button><button className="secondary" aria-label="Command log" aria-expanded={openPanel === 'log'} aria-controls={openPanel === 'log' ? 'log-panel' : undefined} disabled={!!game.battle} onClick={() => setOpenPanel(openPanel === 'log' ? null : 'log')}><span className="log-full">Command log</span><span className="log-short" aria-hidden="true">Log</span></button></div>
          <p className="map-hint">{controlled(game).length} / {victoryTarget(game)} states to victory · Select a state · Drag to pan</p>
          <div className="map-controls" aria-label="Map view controls"><button className="secondary perspective-toggle" aria-label="Babylonia 2.5D scenery" aria-pressed={perspective} onClick={()=>{stopZoom();setPerspective(value=>!value)}}>2.5D</button><button className="secondary province-view" onClick={focusProvince} aria-label="Focus province">Province</button><button className="secondary detail-toggle" aria-pressed={level === 'state'} onClick={() => setStateDetail(level === 'state' ? 'province' : 'state')}>Detail</button><button className="secondary" aria-label="Zoom out" disabled={camera.zoom <= .65} onClick={() => zoomMap(1 / 1.25)}>−</button><button className="secondary reset-view" aria-label="Dominion overview" onClick={overview}>Overview</button><button className="secondary" aria-label="Zoom in" disabled={camera.zoom >= 7} onClick={() => zoomMap(1.25)}>+</button></div>
        </div>
      </div>
      <footer className="map-attribution">Approximate campaign boundaries · <a href="https://www.naturalearthdata.com/downloads/50m-physical-vectors/" target="_blank" rel="noreferrer">Natural Earth</a></footer>
    </div>
  )
}
export default App
