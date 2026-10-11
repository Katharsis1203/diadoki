import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { LabelBox } from '../game/mapView'

export type PixiMapSprite={id:string;source:string;x:number;y:number;width:number;height:number;alpha?:number;
  frame?:{x:number;y:number;width:number;height:number}}
type Props={sprites:readonly PixiMapSprite[];view:LabelBox;scaleX:number;scaleY:number;name:string;children:ReactNode}

// SVG owns layer order and interaction. Each GPU surface replaces only the
// artwork in its slot, and retains authored SVG if initialization/loading fails.
export function PixiMapLayer({sprites,view,scaleX,scaleY,name,children}:Props){
  const host=useRef<HTMLDivElement>(null),fallback=useRef<SVGGElement>(null)
  const renderer=useRef<import('../rendering/pixiMapRenderer').PixiMapRenderer|null>(null)
  const current=useRef({sprites,view,scaleX,scaleY})
  const revision=useRef(0)
  useEffect(()=>{
    let cancelled=false
    const epoch=revision
    let owned:import('../rendering/pixiMapRenderer').PixiMapRenderer|undefined
    const node=host.current!,svg=fallback.current!
    import('../rendering/pixiMapRenderer').then(async({PixiMapRenderer})=>{
      const instance=new PixiMapRenderer(node)
      owned=instance
      await instance.init()
      if(cancelled){instance.destroy();return}
      renderer.current=instance
      const token=++revision.current
      const painted=await instance.update(current.current)
      if(!cancelled&&painted&&token===revision.current){node.style.visibility='visible';svg.style.visibility='hidden';node.dataset.ready='true'}
    }).catch(error=>{owned?.destroy();node.dataset.failed='true';node.dataset.failure=error instanceof Error?error.stack:String(error)})
    return ()=>{cancelled=true;epoch.current++;owned?.destroy();renderer.current=null;svg.style.visibility='';node.style.visibility='hidden'}
  },[])
  useLayoutEffect(()=>{
    current.current={sprites,view,scaleX,scaleY}
    const node=host.current!,svg=fallback.current!,instance=renderer.current
    node.style.visibility='hidden';svg.style.visibility='';node.dataset.ready='false'
    if(!instance)return
    const token=++revision.current
    instance.update(current.current).then(painted=>{
      if(painted&&token===revision.current){node.style.visibility='visible';svg.style.visibility='hidden';node.dataset.ready='true'}
    }).catch(error=>{node.dataset.failed='true';node.dataset.failure=error instanceof Error?error.stack:String(error)})
  },[sprites,view,scaleX,scaleY])
  return <g data-pixi-layer={name} pointerEvents="none" aria-hidden="true">
    <g ref={fallback} data-pixi-fallback={name}>{children}</g>
    {/* Lay out the canvas in screen pixels so SVG's CSS rounding cannot shift
        scenery by a whole map unit at close zoom. */}
    <foreignObject x="0" y="0" width={Math.round((view.right-view.left)*scaleX)} height={Math.round((view.bottom-view.top)*scaleY)} transform={`translate(${view.left} ${view.top}) scale(${1/scaleX} ${1/scaleY})`}>
      <div ref={host} data-pixi-canvas={name} style={{width:'100%',height:'100%',visibility:'hidden'}}/>
    </foreignObject>
  </g>
}
