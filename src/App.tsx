import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { createInitialState, gameReducer, selectedState, controlled, victoryTarget } from './game/engine'
import { MapSettingsPanel } from './components/MapSettingsPanel'
import { MAP_SETTINGS_KEY, parseMapSettings } from './game/mapSettings'
import { CampaignMap } from './components/CampaignMap'
import { CampaignHud, CampaignPanels } from './components/CampaignPanels'
import { TheatreInspector } from './components/TheatreDistricts'
import { theatreDistrictById, theatreRegionById, theatreStateAt } from './game/theatreGeography'
import { INITIAL_CAMERA, clampMapCamera, worldOverviewCamera, focusCamera, MAP_HEIGHT, MAP_WIDTH, MIN_ZOOM, MAX_ZOOM, mapLevel } from './game/mapView'
import { worldRegionAt } from './game/worldTerrain'
import { territoryAt } from './game/geography'
import type { Camera, MapLevel } from './game/mapView'
import { mapFactions } from './game/politicalContent'
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
  const [settingsOpen,setSettingsOpen]=useState(false)
  const [mapSettings,setMapSettings]=useState(()=>{try{return parseMapSettings(localStorage.getItem(MAP_SETTINGS_KEY))}catch{return parseMapSettings(null)}})
  useEffect(()=>{try{localStorage.setItem(MAP_SETTINGS_KEY,JSON.stringify(mapSettings))}catch{/* Private/blocked storage still allows in-memory settings. */}},[mapSettings])
  const [openPanel, setOpenPanel] = useState<'roster' | 'log' | null>(null)
  const [stateDetail, setStateDetail] = useState<MapLevel | null>(null)
  const [freeCamera, setCamera] = useState(INITIAL_CAMERA)
  const [cameraMode, setCameraMode] = useState<'province'|'overview'|'free'>('province')
  const [focusedProvinceId, setFocusedProvinceId] = useState('babylonia')
  const [selectedDraftId,setSelectedDraftId] = useState<string|null>(null)
  const perspective = true
  const [viewport,setViewport] = useState({width:window.innerWidth,height:window.innerHeight})
  const drag = useRef<{ x: number; y: number; cameraX: number; cameraY: number; scale: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const pendingPan=useRef<Camera|null>(null)
  const panFrame=useRef<number|null>(null)
  useEffect(()=>()=>{if(panFrame.current!==null)cancelAnimationFrame(panFrame.current)},[])
  useEffect(() => {
    const resize = () => setViewport({width:window.innerWidth,height:window.innerHeight})
    window.addEventListener('resize',resize)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenPanel(null)
      setSettingsOpen(false)
      setSelectedDraftId(null)
      dispatch({ type: 'selectState', id: null })
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {window.removeEventListener('keydown', closeOnEscape);window.removeEventListener('resize',resize)}
  }, [])
  const state = selectedState(game)
  const province = game.provinces.find((p) => p.id === state?.provinceId)
  const draft = selectedDraftId?theatreDistrictById.get(selectedDraftId):undefined
  const draftProvince = draft?theatreRegionById.get(draft.provinceId):undefined
  const focusedProvince = game.provinces.find(p=>p.id===focusedProvinceId)??theatreRegionById.get(focusedProvinceId)!
  const fitPanel = (!!state||!!draft) && !openPanel && !game.battle
  const fittedCamera = useMemo(() => {
    const shapes=theatreRegionById.get(focusedProvince.id)?.districts.flatMap(s=>s.polygons.map(p=>p[0].map(at=>at.join(',')).join(' ')))??game.states.filter(p=>p.provinceId===focusedProvince.id).map(p=>p.shape)
    return focusCamera(shapes,viewport,fitPanel,perspective)
  },
    [game.states,focusedProvince,viewport,fitPanel,perspective])
  const fittedOverview=useMemo(()=>worldOverviewCamera(viewport,perspective),[viewport,perspective])
  const camera = clampMapCamera(cameraMode==='province' ? fittedCamera : cameraMode==='overview'?fittedOverview:freeCamera,viewport,perspective)
  const viewedProvince=province??draftProvince??(cameraMode==='province'?focusedProvince:game.provinces.find(p=>p.id===territoryAt([camera.x,camera.y],game.states)?.provinceId)??theatreRegionById.get(theatreStateAt([camera.x,camera.y])?.provinceId??''))
  const viewedName=viewedProvince?.name??worldRegionAt(camera.x,camera.y)?.name??'Geographic context'
  const viewingDraft = !!viewedProvince&&theatreRegionById.has(viewedProvince.id)
  const terrainLevel = stateDetail ?? (cameraMode === 'province' ? 'province' : undefined)
  const level = mapLevel(camera.zoom, terrainLevel)
  const select = useCallback((id: string) => { setSelectedDraftId(null);setOpenPanel(null); dispatch({ type: 'selectState', id }) }, [])
  const selectDraft = useCallback((id:string) => {
    if(game.battle||!theatreDistrictById.has(id))return
    setOpenPanel(null);dispatch({type:'selectState',id:null});setSelectedDraftId(id)
  },[game.battle])
  const dismiss = useCallback(() => {
    setOpenPanel(null)
    setSelectedDraftId(null)
    dispatch({ type: 'selectState', id: null })
  }, [])
  const resetGame = useCallback(() => {
    dispatch({type:'reset'}); setOpenPanel(null); setStateDetail(null);setSelectedDraftId(null)
    setFocusedProvinceId('babylonia'); setCameraMode('province')
  }, [])
  const zoomMap = (factor: number, anchor?: MapPoint) => {
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.zoom * factor))
    if (zoom === camera.zoom) return
    drag.current = null
    pendingPan.current=null
    if(panFrame.current!==null){cancelAnimationFrame(panFrame.current);panFrame.current=null}
    setStateDetail(null)
    setCameraMode('free')
    setCamera(cameraAtZoom(camera, zoom, anchor))
  }
  const focusProvince = useCallback(() => {setFocusedProvinceId(province?.id??draftProvince?.id??focusedProvinceId);setCameraMode('province');setStateDetail(null)}, [province,draftProvince,focusedProvinceId])
  const overview = () => {setCameraMode('overview');setStateDetail(null);dismiss()}
  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
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
    event.currentTarget.setPointerCapture(event.pointerId)
    const [panX,panY]=cameraPan(dx,dy,start.scale,mapProjection(perspective))
    pendingPan.current={...camera,x:start.cameraX-panX,y:start.cameraY-panY}
    if(panFrame.current===null)panFrame.current=requestAnimationFrame(()=>{
      panFrame.current=null
      if(pendingPan.current){setCameraMode('free');setCamera(pendingPan.current);pendingPan.current=null}
    })
  }
  const stopDrag = () => {
    drag.current=null
    if(panFrame.current!==null){cancelAnimationFrame(panFrame.current);panFrame.current=null}
    if(pendingPan.current){setCameraMode('free');setCamera(pendingPan.current);pendingPan.current=null}
  }

  return (
    <div className="app-shell">
      <CampaignHud game={game} dispatch={dispatch} onReset={resetGame}/>
      <main className="game-layout">
        <section className="map-panel" aria-labelledby="map-title">
          <h2 id="map-title" className="sr-only">A divided empire · Campaign map</h2>
          <div className="map-location" aria-live="polite"><p className="eyebrow">{level==='dominion'?'The successor kingdoms':viewingDraft?'Province map draft':level==='state'?'Local inspection':viewedProvince?'Province campaign':'Terrain inspection'}</p><p>{level==='dominion'?(camera.zoom<.65?'Italy to the Ganges':'A divided empire'):viewedName}<small>{level!=='dominion'&&(viewedProvince?`${viewedProvince.stateIds.length} states · ${viewingDraft?'Map draft':`${game.orders} orders available`}`:'Terrain foundation · Drag to explore')}</small></p></div>
          <CampaignMap game={game} camera={camera} settings={mapSettings} level={level} terrainLevel={terrainLevel} onSelect={select} selectedDraftId={selectedDraftId} onSelectDraft={selectDraft} onBackground={dismiss} suppressClick={suppressClick}
            onZoom={zoomMap} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} />
        </section>
        <CampaignPanels game={game} dispatch={dispatch} openPanel={openPanel} setOpenPanel={setOpenPanel} select={select} dismiss={dismiss} focusProvince={focusProvince}/>
        {draft&&!openPanel&&!game.battle&&<TheatreInspector state={draft} onSelect={selectDraft} onDismiss={dismiss} onFocus={focusProvince}/>}
        <p className="sr-only" role="status">{game.log.at(-1)}</p>
      </main>
      {settingsOpen&&<MapSettingsPanel settings={mapSettings} onChange={setMapSettings} onClose={()=>setSettingsOpen(false)}/>}
      <div className="map-toolbar">
        <div className="map-legend" aria-label="Faction symbols and dominion borders">{mapFactions.filter(f=>f.kind==='successor').map((f) => <span key={f.id} title={factionSymbols[f.id].description}><svg className="faction-seal" viewBox="-14 -14 28 28" aria-label={`${f.name}: ${factionSymbols[f.id].name}`} role="img" color={f.color}><circle className="seal-ring" r="13" /><use href={`#seal-${factionSymbols[f.id].symbol}`} x="-10" y="-10" width="20" height="20" /></svg>{f.name}</span>)}<span className="border-key"><i />Dominion</span><span className="border-key provincial"><i />Province</span><span className="border-key district"><i />State</span></div>
        <div className="map-toolbar-actions">
          <div className="utility-actions"><button className="secondary" aria-expanded={settingsOpen} aria-controls="map-settings-panel" onClick={()=>setSettingsOpen(value=>!value)}>Settings</button><button className="secondary" aria-expanded={openPanel === 'roster'} aria-controls={openPanel === 'roster' ? 'roster-panel' : undefined} disabled={!!game.battle} onClick={() => setOpenPanel(openPanel === 'roster' ? null : 'roster')}>Commanders</button><button className="secondary" aria-label="Command log" aria-expanded={openPanel === 'log'} aria-controls={openPanel === 'log' ? 'log-panel' : undefined} disabled={!!game.battle} onClick={() => setOpenPanel(openPanel === 'log' ? null : 'log')}><span className="log-full">Command log</span><span className="log-short" aria-hidden="true">Log</span></button></div>
          <p className="map-hint">{controlled(game).length} / {victoryTarget(game)} states to victory · Select a state · Drag to pan</p>
          <div className="map-controls" aria-label="Map view controls"><button className="secondary province-view" onClick={focusProvince} aria-label="Focus province">Province</button><button className="secondary detail-toggle" aria-pressed={level === 'state'} onClick={() => setStateDetail(level === 'state' ? 'province' : 'state')}>Detail</button><button className="secondary" aria-label="Zoom out" disabled={camera.zoom <= MIN_ZOOM} onClick={() => zoomMap(1 / 1.25)}>−</button><button className="secondary reset-view" aria-label="Dominion overview" onClick={overview}>Overview</button><button className="secondary" aria-label="Zoom in" disabled={camera.zoom >= MAX_ZOOM} onClick={() => zoomMap(1.25)}>+</button></div>
        </div>
      </div>
      <footer className="map-attribution">Approximate campaign boundaries · <a href="https://www.naturalearthdata.com/downloads/50m-physical-vectors/" target="_blank" rel="noreferrer">Natural Earth</a></footer>
    </div>
  )
}
export default App
