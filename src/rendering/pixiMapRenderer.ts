import { Application, Container, ImageSource, Rectangle, Sprite, Texture } from 'pixi.js'
import type { PixiMapSprite } from '../components/PixiMapLayer'
import type { LabelBox } from '../game/mapView'

type Update={sprites:readonly PixiMapSprite[];view:LabelBox;scaleX:number;scaleY:number}
type Resource={texture:Texture;image:HTMLImageElement;bytes:number;used:number}
const TEXTURE_BUDGET=64*1024*1024

export class PixiMapRenderer{
  private app=new Application()
  private world=new Container()
  private textures=new Map<string,Resource>()
  private pending=new Map<string,Promise<Resource>>()
  private sprites=new Map<string,Sprite>()
  private frames:Texture[]=[]
  private disposed=false
  private initialized=false
  private failed=false
  private generation=0
  private clock=0
  constructor(privateHost:HTMLDivElement){this.host=privateHost}
  private host:HTMLDivElement
  async init(){
    await this.app.init({width:1,height:1,backgroundAlpha:0,autoStart:false,antialias:true,
      preference:['webgl'],resolution:Math.min(window.devicePixelRatio||1,2),autoDensity:true})
    this.initialized=true
    if(this.disposed){this.app.destroy({removeView:true,releaseGlobalResources:false},{children:true});return}
    this.app.stage.eventMode='none'
    this.app.stage.addChild(this.world)
    this.app.canvas.style.width='100%';this.app.canvas.style.height='100%'
    this.host.appendChild(this.app.canvas)
    this.app.canvas.addEventListener('webglcontextlost',this.contextLost)
  }
  private contextLost=()=>{this.failed=true;this.generation++;this.host.style.visibility='hidden';this.host.dataset.ready='false';this.host.dataset.failed='true';
    const fallback=this.host.closest('[data-pixi-layer]')?.querySelector<SVGGElement>('[data-pixi-fallback]')
    if(fallback)fallback.style.visibility=''
  }
  private load(source:string){
    const existing=this.textures.get(source)
    if(existing){existing.used=++this.clock;return Promise.resolve(existing)}
    const job=this.pending.get(source)
    if(job)return job
    const promise=(async()=>{
      const image=new Image()
      if(source.startsWith('symbol:')){
        const [,id,radius]=source.split(':')
        const symbol=document.getElementById(id)
        if(!symbol)throw new Error(`Missing scenery symbol: ${id}`)
        const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="312" viewBox="-30 -44 60 52"><defs><clipPath id="art"><rect x="-24" y="-40" width="48" height="40"/></clipPath></defs><ellipse cx="4" cy="1.5" rx="${radius}" ry="3.5" fill="#594932" fill-opacity=".21"/><g clip-path="url(#art)" stroke-linejoin="round" stroke-linecap="round">${symbol.innerHTML}</g></svg>`
        image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
      }else image.src=source
      await image.decode()
      if(this.disposed){image.src='';throw new Error('Renderer disposed')}
      const mipmaps=source.startsWith('symbol:')
      const resource={image,texture:new Texture({source:new ImageSource({resource:image,autoGenerateMipmaps:mipmaps,mipmapFilter:'linear'})}),
        bytes:Math.ceil(image.naturalWidth*image.naturalHeight*4*(mipmaps?4/3:1)),used:++this.clock}
      this.textures.set(source,resource);return resource
    })().finally(()=>this.pending.delete(source))
    this.pending.set(source,promise);return promise
  }
  async update({sprites,view,scaleX,scaleY}:Update){
    if(this.disposed||this.failed||!this.initialized)return false
    const generation=++this.generation
    const sources=new Set(sprites.map(s=>s.source))
    await Promise.all([...sources].map(source=>this.load(source)))
    if(this.disposed||this.failed||generation!==this.generation)return false
    const width=Math.max(1,Math.round((view.right-view.left)*scaleX)),height=Math.max(1,Math.round((view.bottom-view.top)*scaleY))
    if(this.app.screen.width!==width||this.app.screen.height!==height)this.app.renderer.resize(width,height)
    // Renderer.resize writes pixel CSS dimensions; inside foreignObject those
    // would be scaled a second time by SVG. Fill its map-space rectangle instead.
    this.app.canvas.style.width='100%';this.app.canvas.style.height='100%'
    this.world.position.set(-view.left*scaleX,-view.top*scaleY)
    this.world.scale.set(scaleX,scaleY)
    const retained=new Set(sprites.map(s=>s.id))
    for(const [id,sprite] of this.sprites)if(!retained.has(id)){sprite.destroy();this.sprites.delete(id)}
    const oldFrames=this.frames;this.frames=[]
    sprites.forEach((spec,index)=>{
      const base=this.textures.get(spec.source)!.texture
      const texture=spec.frame?new Texture({source:base.source,frame:new Rectangle(spec.frame.x,spec.frame.y,spec.frame.width,spec.frame.height)}):base
      if(spec.frame)this.frames.push(texture)
      let sprite=this.sprites.get(spec.id)
      if(!sprite){sprite=new Sprite(texture);this.world.addChild(sprite);this.sprites.set(spec.id,sprite)}
      sprite.texture=texture;sprite.position.set(spec.x,spec.y);sprite.width=spec.width;sprite.height=spec.height;sprite.alpha=spec.alpha??1
      this.world.setChildIndex(sprite,index)
    })
    for(const frame of oldFrames)frame.destroy(false)
    this.app.render()
    let bytes=[...this.textures.values()].reduce((sum,r)=>sum+r.bytes,0)
    for(const [source,resource] of [...this.textures].sort((a,b)=>a[1].used-b[1].used)){
      if(bytes<=TEXTURE_BUDGET)break
      if(sources.has(source))continue
      resource.texture.destroy(true);resource.image.src='';this.textures.delete(source);bytes-=resource.bytes
    }
    this.host.dataset.textureBytes=String(bytes);this.host.dataset.sprites=String(sprites.length)
    return true
  }
  destroy(){
    if(this.disposed)return
    this.disposed=true;this.generation++
    if(this.initialized){
      this.app.canvas.removeEventListener('webglcontextlost',this.contextLost)
      // Clearing Pixi's global pools while the other map layer is still alive
      // invalidates its batches. Release this application's resources only.
      this.app.destroy({removeView:true,releaseGlobalResources:false},{children:true,texture:false,textureSource:false})
    }
    for(const frame of this.frames)frame.destroy(false)
    for(const resource of this.textures.values()){resource.texture.destroy(true);resource.image.src=''}
    this.textures.clear();this.pending.clear();this.sprites.clear()
  }
}
