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
export type GroundTilePainter=(tile:GroundTile)=>Promise<GroundTexture>
type Entry={tile:GroundTile;texture?:GroundTexture;used:number}

// Per-map lifetime, bounded decoded-pixel budget. Only one raster job runs at a
// time. A new camera demand replaces obsolete queued work; visible tiles stay
// pinned while old resolutions/regions are evicted in least-recent-use order.
export class GroundTileCache {
  private entries=new Map<string,Entry>()
  private listeners=new Set<()=>void>()
  private demand:string[]=[]
  private enabled=false
  private busy=false
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
  constructor(painter:GroundTilePainter,budget=GROUND_CACHE_BYTES){this.painter=painter;this.budget=budget}
  subscribe=(callback:()=>void)=>{this.listeners.add(callback);return ()=>{this.listeners.delete(callback)}}
  activate(){this.enabled=true;this.schedule()}
  dispose(){
    this.enabled=false;this.epoch++;clearTimeout(this.timer);this.timer=undefined
    for(const entry of this.entries.values())entry.texture?.release()
    this.entries.clear();this.demand=[];this.memory=0;this.failures.clear()
  }
  setDemand(tiles:readonly GroundTile[]){
    this.demand=tiles.map(t=>t.key)
    const wanted=new Set(this.demand)
    for(const key of this.failures)if(!wanted.has(key))this.failures.delete(key)
    for(const [key,entry] of this.entries)if(!wanted.has(key)&&!entry.texture)this.entries.delete(key)
    for(const tile of tiles){const entry=this.entries.get(tile.key)??{tile,used:0};entry.used=++this.clock;this.entries.set(tile.key,entry)}
    this.evict();this.schedule()
  }
  ready(tiles:readonly GroundTile[]){return tiles.length>0&&tiles.every(t=>!!this.entries.get(t.key)?.texture)}
  texture(key:string){return this.entries.get(key)?.texture}
  get stats(){return {bytes:this.memory,entries:this.entries.size,jobs:this.jobs,pending:this.demand.filter(k=>!this.entries.get(k)?.texture).length}}
  private evict(reserve=0){
    const pinned=new Set(this.demand)
    const old=[...this.entries].filter(([key,e])=>e.texture&&!pinned.has(key)).sort((a,b)=>a[1].used-b[1].used)
    for(const [key,entry] of old){
      if(this.memory+reserve<=this.budget)break
      this.memory-=entry.texture!.bytes;entry.texture!.release();this.entries.delete(key)
    }
  }
  private schedule(){
    if(!this.enabled||this.busy||this.timer!==undefined)return
    this.timer=setTimeout(()=>{this.timer=undefined;void this.pump()},0)
  }
  private async pump(){
    const key=this.demand.find(k=>!this.failures.has(k)&&this.entries.has(k)&&!this.entries.get(k)!.texture)
    if(!this.enabled||!key)return
    this.busy=true;const epoch=this.epoch,entry=this.entries.get(key)!
    try{
      const texture=await this.painter(entry.tile)
      if(!this.enabled||epoch!==this.epoch||this.entries.get(key)!==entry)texture.release()
      else{
        this.evict(texture.bytes)
        if(this.memory+texture.bytes>this.budget){texture.release();this.failures.add(key);return}
        entry.texture=texture;this.memory+=texture.bytes;this.jobs++;this.revision++
        for(const listener of this.listeners)listener()
      }
    }catch{
      // Keep the local vector ground if bitmap creation is unsupported/fails.
      if(epoch===this.epoch)this.failures.add(key)
    }finally{this.busy=false;this.schedule()}
  }
}

// Both bitmap and fallback clips use identical device-pixel boundaries, so
// progressive publication cannot expose seams or double coastal shading.
export function groundTileClip(tile:GroundTile,camera:{x:number;y:number},scale:number,yScale:number,size:{width:number;height:number},ratio:number):LabelBox {
  const snapX=(x:number)=>(Math.round((size.width/2+(x-camera.x)*scale)*ratio)/ratio-size.width/2)/scale+camera.x
  const snapY=(y:number)=>(Math.round((size.height/2+(y-camera.y)*scale*yScale)*ratio)/ratio-size.height/2)/(scale*yScale)+camera.y
  return {left:snapX(tile.x),right:snapX(tile.x+tile.size),top:snapY(tile.y),bottom:snapY(tile.y+tile.size)}
}
