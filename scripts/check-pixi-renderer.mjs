import assert from 'node:assert/strict'
import fs from 'node:fs'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const base=process.argv[2]??'http://127.0.0.1:5175'
const output=process.argv[3],errors=[]
if(output)fs.mkdirSync(output,{recursive:true})
const pixiUrl=new URL(base);pixiUrl.searchParams.set('renderer','pixi')
async function difference(page,first,second){
  return page.evaluate(async([first,second])=>{
    const decode=async data=>{
      const image=new Image();image.src=`data:image/png;base64,${data}`;await image.decode()
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height
      const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
      return ctx.getImageData(0,0,image.width,image.height).data
    }
    const a=await decode(first),b=await decode(second)
    let total=0,changed=0
    for(let i=0;i<a.length;i+=4){
      const d=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/3
      total+=d;if(d>20)changed++
    }
    return {mean:total/(a.length/4),changed:changed/(a.length/4)}
  },[first.toString('base64'),second.toString('base64')])
}
const ready=page=>page.waitForFunction(()=>{
  const surfaces=[...document.querySelectorAll('[data-pixi-canvas]')]
  return document.querySelector('.prepared-ground')?.dataset.ready==='true'&&surfaces.length===2&&surfaces.every(e=>e.dataset.ready==='true')
}).catch(async error=>{console.error(await page.locator('[data-pixi-canvas]').evaluateAll(es=>es.map(e=>e.dataset)));throw error})
try{
  for(const {width,height,ratio} of [{width:1440,height:900,ratio:1},{width:1440,height:900,ratio:2},{width:390,height:844,ratio:2}]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:ratio,hasTouch:width<600})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(pixiUrl.href)
    await page.locator('.territory-state[data-state=susa]').press('Enter')
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await page.locator('.command-panel .close-panel').click()
    await ready(page)
    for(const mode of ['province','close']){
      if(mode==='close'){
        const zoom=page.getByRole('button',{name:'Zoom in',exact:true})
        for(let i=0;i<5&&await zoom.isEnabled();i++)await zoom.click()
        await ready(page)
      }
      await page.waitForTimeout(100)
      const gpu=await page.screenshot()
      const style=await page.addStyleTag({content:'[data-pixi-canvas]{visibility:hidden!important}[data-pixi-fallback]{visibility:visible!important}'})
      const svg=await page.screenshot()
      await style.evaluate(e=>e.remove())
      const delta=await difference(page,gpu,svg)
      if(output){fs.writeFileSync(`${output}/${width}-dpr${ratio}-${mode}-pixi.png`,gpu);fs.writeFileSync(`${output}/${width}-dpr${ratio}-${mode}-svg.png`,svg)}
      assert.ok(delta.mean<2&&delta.changed<.015,`${width} DPR ${ratio} ${mode}: excessive visual difference ${JSON.stringify(delta)}`)
      console.log(`${width}×${height} DPR ${ratio} ${mode}: mean pixel difference ${delta.mean.toFixed(3)}, changed ${(delta.changed*100).toFixed(3)}%`)
    }
    const point={x:width*.5,y:height*.45}
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+80,point.y+60);await page.mouse.up();await ready(page)
    await page.setViewportSize({width:height,height:width});await ready(page)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    const bytes=await page.locator('[data-pixi-canvas]').evaluateAll(es=>es.map(e=>Number(e.dataset.textureBytes)))
    assert.ok(bytes.every(n=>n<=64*1024*1024),'Retained textures exceeded per-layer budget')
    await page.locator('.territory-state[data-state=karun]').press('Enter')
    assert.equal(await page.locator('#command-title').innerText(),'Karun')
    await page.locator('.command-panel .close-panel').click()
    await ready(page)
    // Actual context loss must reveal the original SVG rather than a blank map.
    await page.locator('[data-pixi-canvas="scenery"] canvas').evaluate(canvas=>canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext())
    await page.waitForFunction(()=>document.querySelector('[data-pixi-canvas="scenery"]')?.dataset.failed==='true')
    assert.equal(await page.locator('[data-pixi-fallback="scenery"]').evaluate(e=>getComputedStyle(e).visibility),'visible')
    await page.close()
  }
  // Unsupported WebGL preserves the playable SVG scene without crashing.
  const page=await browser.newPage()
  page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true})
    const original=HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'||type==='experimental-webgl'?null:original.call(this,type,...args)}
    if(typeof OffscreenCanvas!=='undefined'){
      const offscreen=OffscreenCanvas.prototype.getContext
      OffscreenCanvas.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:offscreen.call(this,type,...args)}
    }
  })
  await page.goto(pixiUrl.href)
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-pixi-canvas]')].some(e=>e.dataset.failed==='true'))
  await page.locator('.territory-state[data-state=babylon]').press('Enter')
  assert.equal(await page.locator('#command-title').innerText(),'Babylon')
  await page.close()
  assert.deepEqual(errors,[])
  console.log('Pixi alignment, close-zoom quality, selection, pan, resize, texture budgets and WebGL fallback passed.')
}finally{await browser.close()}
