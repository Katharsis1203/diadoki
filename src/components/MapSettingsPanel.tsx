import { useEffect, useRef } from 'react'
import { DEFAULT_MAP_SETTINGS, LIGHT_MAP_SETTINGS, mapSettingGroups } from '../game/mapSettings'
import type { MapSettings } from '../game/mapSettings'

export function MapSettingsPanel({settings,onChange,onClose}:{settings:MapSettings;onChange:(value:MapSettings)=>void;onClose:()=>void}) {
  const panel=useRef<HTMLElement>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return ()=>{if(previous?.isConnected)previous.focus()}
  },[])
  return <aside ref={panel} id="map-settings-panel" className="panel map-settings-panel" aria-labelledby="map-settings-title" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose()}}}>
    <button className="close-panel" onClick={onClose} aria-label="Close map settings">×</button>
    <p className="eyebrow">Display preferences</p><h2 id="map-settings-title">Map settings</h2>
    <p className="subtle">Switch layers off to compare performance. Preferences stay on this browser.</p>
    <div className="settings-presets"><button className="secondary" onClick={()=>onChange({...DEFAULT_MAP_SETTINGS})}>Full detail</button><button className="secondary" onClick={()=>onChange({...LIGHT_MAP_SETTINGS})}>Light detail</button></div>
    {mapSettingGroups.map(group=><fieldset key={group.name}><legend>{group.name}</legend>
      {group.options.map(option=><label key={option.key} className="setting-option">
        <input type="checkbox" checked={settings[option.key]} onChange={event=>onChange({...settings,[option.key]:event.target.checked})}/>
        <span>{option.name}<small>{option.description}</small></span>
      </label>)}
    </fieldset>)}
  </aside>
}
