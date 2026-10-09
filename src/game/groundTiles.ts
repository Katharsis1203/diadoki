import type { LabelBox, MapLevel } from './mapView.ts'

export const GROUND_TILE_PIXELS=256
export const GROUND_TILE_BLEED=4
export const GROUND_CACHE_BYTES=64*1024*1024
const TILE_BYTES=(GROUND_TILE_PIXELS+2*GROUND_TILE_BLEED)**2*4
export type GroundTile={key:string;x:number;y:number;size:number;resolution:number;level:MapLevel;shading?:boolean}
export function groundTileFromKey(key:string):GroundTile {
  const [level,r,x,y]=key.split(':'),resolution=Number(r),size=GROUND_TILE_PIXELS/resolution
  return {key,level:level as MapLevel,resolution,size,x:Number(x)*size,y:Number(y)*size,...(key.endsWith(':plain')?{shading:false}:{})}
}
export function planGroundTiles(view:LabelBox,scale:number,pixelRatio:number,level:MapLevel,bounds?:LabelBox,shading=true):GroundTile[] {
  if(bounds){
    view={left:Math.max(view.left,bounds.left),right:Math.min(view.right,bounds.right),top:Math.max(view.top,bounds.top),bottom:Math.min(view.bottom,bounds.bottom)}
    if(view.left>=view.right||view.top>=view.bottom)return []
  }
  let resolution=Math.max(.125,Math.min(32,2**Math.round(Math.log2(scale*Math.min(1.5,pixelRatio)))))
  const plan=()=>{
    const size=GROUND_TILE_PIXELS/resolution,tiles:GroundTile[]=[],cx=(view.left+view.right)/2,cy=(view.top+view.bottom)/2
    for(let y=Math.floor(view.top/size);y<Math.ceil(view.bottom/size);y++)for(let x=Math.floor(view.left/size);x<Math.ceil(view.right/size);x++){
      tiles.push({key:`${level}:${resolution}:${x}:${y}${shading?'':':plain'}`,x:x*size,y:y*size,size,resolution,level,...(shading?{}:{shading:false})})
    }
    return tiles.sort((a,b)=>Math.hypot(a.x+a.size/2-cx,a.y+a.size/2-cy)-Math.hypot(b.x+b.size/2-cx,b.y+b.size/2-cy))
  }
  let tiles=plan()
  while(tiles.length*TILE_BYTES>GROUND_CACHE_BYTES*.75&&resolution>.125){resolution/=2;tiles=plan()}
  return tiles
}
export type GroundTexture={href:string;bytes:number;release:()=>void}
export type GroundTilePainter=(tile:GroundTile,signal?:AbortSignal)=>Promise<GroundTexture>
type Entry={tile:GroundTile;texture?:GroundTexture;used:number}

// Per-map lifetime, bounded decoded-pixel budget. Runtime Canvas painting is
// serial; prepared-file loading can use a small parallel pool. Camera demand
// replaces obsolete work while pinned textures retain their LRU protection.
export class GroundTileCache {
  private entries=new Map<string,Entry>()
  private listeners=new Set<()=>void>()
  private demand:string[]=[]
  private enabled=false
  private running=new Map<Entry,AbortController>()
  private reservations=new Map<Entry,number>()
  private timer:ReturnType<typeof setTimeout>|undefined
  private epoch=0
  private clock=0
  private memory=0
  private jobs=0
  private revision=0
  get version(){return this.revision}
  private failures=new Set<string>()
  private painter:GroundTilePainter
  private budget:number
  private concurrency:number
  constructor(painter:GroundTilePainter,budget=GROUND_CACHE_BYTES,concurrency=1){
    this.painter=painter;this.budget=budget;this.concurrency=Number.isFinite(concurrency)?Math.max(1,Math.min(4,Math.floor(concurrency))):1
  }
  subscribe=(callback:()=>void)=>{this.listeners.add(callback);return ()=>{this.listeners.delete(callback)}}
  activate(){this.enabled=true;this.schedule()}
  dispose(){
    this.enabled=false;this.epoch++;clearTimeout(this.timer);this.timer=undefined
    for(const controller of this.running.values())controller.abort()
    for(const entry of this.entries.values())entry.texture?.release()
    this.entries.clear();this.demand=[];this.memory=0;this.failures.clear()
  }
  setDemand(tiles:readonly GroundTile[]){
    this.demand=tiles.map(t=>t.key)
    const wanted=new Set(this.demand)
    for(const key of this.failures)if(!wanted.has(key))this.failures.delete(key)
    for(const [key,entry] of this.entries)if(!wanted.has(key)&&!entry.texture){this.running.get(entry)?.abort();this.entries.delete(key)}
    for(const tile of tiles){const entry=this.entries.get(tile.key)??{tile,used:0};entry.used=++this.clock;this.entries.set(tile.key,entry)}
    this.evict();this.schedule()
  }
  ready(tiles:readonly GroundTile[]){return tiles.length>0&&tiles.every(t=>!!this.entries.get(t.key)?.texture)}
  texture(key:string){return this.entries.get(key)?.texture}
  private get reservedBytes(){return [...this.reservations.values()].reduce((sum,bytes)=>sum+bytes,0)}
  get stats(){return {bytes:this.memory,reservedBytes:this.reservedBytes,entries:this.entries.size,jobs:this.jobs,active:this.running.size,failed:this.failures.size,pending:this.demand.filter(k=>!this.entries.get(k)?.texture).length}}
  private evict(reserve=0){
    const pinned=new Set(this.demand)
    const old=[...this.entries].filter(([key,e])=>e.texture&&!pinned.has(key)).sort((a,b)=>a[1].used-b[1].used)
    for(const [key,entry] of old){
      if(this.memory+reserve<=this.budget)break
      this.memory-=entry.texture!.bytes;entry.texture!.release();this.entries.delete(key)
    }
  }
  private schedule(){
    if(!this.enabled||this.running.size>=this.concurrency||this.timer!==undefined)return
    this.timer=setTimeout(()=>{this.timer=undefined;this.pump()},0)
  }
  private pump(){
    while(this.enabled&&this.running.size<this.concurrency){
      const key=this.demand.find(k=>{const entry=this.entries.get(k);return entry&&!entry.texture&&!this.failures.has(k)&&!this.running.has(entry)})
      if(!key)return
      const entry=this.entries.get(key)!,controller=new AbortController()
      const expected=(entry.tile.size*entry.tile.resolution+2*GROUND_TILE_BLEED)**2*4
      // Native painters have known pixel dimensions. Leave oversized custom
      // painter results to the publication guard rather than reserving more
      // than the entire budget. Reservations cover concurrent decode work.
      const reserve=expected<=this.budget?expected:0
      this.evict(this.reservedBytes+reserve)
      if(this.memory+this.reservedBytes+reserve>this.budget){
        if(this.running.size)return
        this.failures.add(key);this.notify();continue
      }
      this.running.set(entry,controller)
      this.reservations.set(entry,reserve)
      void this.paint(key,entry,controller,this.epoch)
    }
  }
  private async paint(key:string,entry:Entry,controller:AbortController,epoch:number){
    let changed=false
    try{
      const texture=await this.painter(entry.tile,controller.signal)
      this.reservations.delete(entry)
      if(!this.enabled||epoch!==this.epoch||this.entries.get(key)!==entry)texture.release()
      else{
        this.evict(texture.bytes+this.reservedBytes)
        if(this.memory+texture.bytes+this.reservedBytes>this.budget){texture.release();this.failures.add(key);changed=true;return}
        entry.texture=texture;this.memory+=texture.bytes;this.jobs++;changed=true
      }
    }catch{
      // Failed current entries retain their fallback. An obsolete rejection
      // must not poison a newly requested entry with the same geographic key.
      if(epoch===this.epoch&&this.entries.get(key)===entry){this.failures.add(key);changed=true}
    }finally{this.reservations.delete(entry);this.running.delete(entry);if(changed)this.notify();this.schedule()}
  }
  private notify(){this.revision++;for(const listener of this.listeners)listener()}
}

// Both bitmap and fallback clips use identical device-pixel boundaries, so
// progressive publication cannot expose seams or double coastal shading.
export function groundTileClip(tile:GroundTile,camera:{x:number;y:number},scale:number,yScale:number,size:{width:number;height:number},ratio:number):LabelBox {
  const snapX=(x:number)=>(Math.round((size.width/2+(x-camera.x)*scale)*ratio)/ratio-size.width/2)/scale+camera.x
  const snapY=(y:number)=>(Math.round((size.height/2+(y-camera.y)*scale*yScale)*ratio)/ratio-size.height/2)/(scale*yScale)+camera.y
  return {left:snapX(tile.x),right:snapX(tile.x+tile.size),top:snapY(tile.y),bottom:snapY(tile.y+tile.size)}
}
