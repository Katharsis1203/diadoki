// Local rendering preferences, never part of campaign state or game rules.
export const MAP_SETTINGS_KEY='diadochi.map-display.v1'
export const DEFAULT_MAP_SETTINGS={
  mountains:true,vegetation:true,settlements:true,groundShading:true,paperGrain:true,
  waterways:true,groundDetail:true,ownershipFills:true,provinceBorders:true,stateBorders:true,
  labels:true,cachedGround:true,preparedShading:true,
} as const
export type MapSetting=keyof typeof DEFAULT_MAP_SETTINGS
export type MapSettings={[K in MapSetting]:boolean}
export const LIGHT_MAP_SETTINGS:MapSettings={...DEFAULT_MAP_SETTINGS,mountains:false,vegetation:false,paperGrain:false,groundDetail:false}
export function parseMapSettings(raw:string|null):MapSettings {
  try{
    const saved:unknown=raw?JSON.parse(raw):null
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return {...DEFAULT_MAP_SETTINGS}
    return Object.fromEntries(Object.entries(DEFAULT_MAP_SETTINGS).map(([key,value])=>[key,
      typeof (saved as Record<string,unknown>)[key]==='boolean'?(saved as Record<string,boolean>)[key]:value])) as MapSettings
  }catch{return {...DEFAULT_MAP_SETTINGS}}
}
export const mapSettingGroups:readonly {name:string;options:readonly {key:MapSetting;name:string;description:string}[]}[]=[
  {name:'Terrain',options:[
    {key:'mountains',name:'Mountains and hills',description:'Upright peaks and overview ranges.'},
    {key:'vegetation',name:'Vegetation',description:'Trees, palms and reeds.'},
    {key:'groundShading',name:'Terrain shading',description:'Rocky, fertile, marsh and earth colour washes.'},
    {key:'groundDetail',name:'Fine ground detail',description:'Fields, soil marks and small terrain engravings.'},
    {key:'paperGrain',name:'Paper texture',description:'Grain on the ground and map margins.'},
    {key:'waterways',name:'Rivers and lakes',description:'Water lines, canals and lake artwork.'},
  ]},
  {name:'Map detail',options:[
    {key:'settlements',name:'Settlement artwork',description:'City and village illustrations; simple centre markers remain.'},
    {key:'labels',name:'Map labels',description:'Place, faction and water names; details remain in the panels.'},
    {key:'ownershipFills',name:'Ownership colour fills',description:'Translucent faction tint; faction outlines remain.'},
    {key:'provinceBorders',name:'Province divisions',description:'Ordinary province lines; selected province outlines remain.'},
    {key:'stateBorders',name:'State divisions',description:'Ordinary district lines; selected state outlines remain.'},
  ]},
  {name:'Rendering comparison',options:[
    {key:'preparedShading',name:'Prepared terrain shading',description:'Reuse pre-rendered colour washes. Turn off to compare live gradients.'},
    {key:'cachedGround',name:'Cached ground',description:'Reuse terrain image tiles. Turn off to compare with SVG ground.'},
  ]},
]
