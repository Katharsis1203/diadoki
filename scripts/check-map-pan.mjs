import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import { clampMapCamera } from '../src/game/mapView.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
// Optional authoring tools, shared with benchmark-browser.mjs.
const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
let chromium
try{({chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath))}
catch{throw new Error('Install Playwright separately or set DIADOCHI_PLAYWRIGHT_MODULE to its module path. See PERFORMANCE.md.')}
const url=process.argv[2]??'http://127.0.0.1:5175'
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const errors=[]
try{
  for(const size of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport:size,deviceScaleFactor:1.5,hasTouch:size.width<600})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(url)
    const map=page.locator('.campaign-map')
    const ready=()=>page.waitForFunction(()=>{
      const map=document.querySelector('.campaign-map')
      return map.dataset.groundRenderer==='vector'||map.dataset.groundRenderer==='cached'||map.querySelector('.prepared-ground')?.dataset.ready==='true'
    })
    const camera=()=>map.evaluate((svg,size)=>{
      const matrix=svg.querySelector('.map-ground').getScreenCTM(),point=new DOMPoint(size.width/2,size.height/2).matrixTransform(matrix.inverse())
      return {x:point.x,y:point.y,zoom:Number(svg.dataset.zoom),scale:matrix.a}
    },size)
    const covered=async()=>{
      const bounds=await map.boundingBox()
      assert.ok(bounds.x<=.01&&bounds.y<=.01&&bounds.x+bounds.width>=size.width-.01&&bounds.y+bounds.height>=size.height-.01,'Buffered map exposed an uncovered strip')
    }
    await ready()
    const start=await camera(),point={x:size.width*.5,y:size.height*.5}
    await page.mouse.move(point.x,point.y);await page.mouse.down()
    await page.mouse.move(point.x+12,point.y+8);await page.waitForTimeout(50);await ready()
    const retained=await map.getAttribute('viewBox')
    for(const [dx,dy] of [[25,10],[45,20],[65,-25],[25,30]]){
      await page.mouse.move(point.x+dx,point.y+dy);await page.waitForTimeout(35)
      const actual=await camera()
      assert.ok(Math.abs(actual.x-(start.x-dx/start.scale))<.02,'Horizontal pan drift')
      assert.ok(Math.abs(actual.y-(start.y-dy/(start.scale*mapProjection(true).yScale)))<.02,'Vertical pan drift')
      assert.equal(await map.getAttribute('viewBox'),retained,'Small pan repainted the SVG camera')
      await covered()
    }
    // A jump larger than the retained buffer refreshes before presentation.
    const dx=size.width*.4,dy=size.height*.2
    await page.mouse.move(point.x+dx,point.y+dy);await page.waitForTimeout(60);await covered()
    assert.notEqual(await map.getAttribute('viewBox'),retained)
    const shifted=await camera()
    await page.mouse.up();await page.waitForTimeout(60)
    const released=await camera()
    assert.ok(Math.hypot(shifted.x-released.x,shifted.y-released.y)<.02,'Release jumped')
    assert.equal(await page.locator('.map-pan-layer').getAttribute('data-panning'),'false')
    assert.equal(await page.locator('.command-panel').count(),0,'Drag triggered selection')
    await covered();await ready()
    // Zoom during a retained translation uses the current screen matrix.
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+30,point.y+15);await page.waitForTimeout(40)
    await page.mouse.move(point.x,point.y);await page.waitForTimeout(40)
    const anchor=await map.evaluate((svg,p)=>new DOMPoint(p.x,p.y).matrixTransform(svg.querySelector('.map-ground').getScreenCTM().inverse()).toJSON(),point)
    await page.mouse.wheel(0,-80);await page.waitForTimeout(70)
    const screen=await map.evaluate((svg,p)=>new DOMPoint(p.x,p.y).matrixTransform(svg.querySelector('.map-ground').getScreenCTM()).toJSON(),anchor)
    assert.ok(Math.hypot(screen.x-point.x,screen.y-point.y)<.03,'Zoom while dragging lost its anchor')
    await page.mouse.up()
    assert.equal(await page.locator('.map-pan-layer').getAttribute('data-panning'),'false')
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+25,point.y+15)
    await page.waitForTimeout(40);await page.keyboard.press('Escape');await page.waitForTimeout(40)
    assert.equal(await page.locator('.map-pan-layer').getAttribute('data-panning'),'false')
    const cancelled=await camera()
    await page.mouse.move(point.x+60,point.y+40);await page.mouse.up()
    const afterCancel=await camera()
    assert.ok(Math.hypot(cancelled.x-afterCancel.x,cancelled.y-afterCancel.y)<.02,'Cancelled drag resumed')
    // Reset and touch cancellation leave a settled camera and no capture state.
    await page.getByRole('button',{name:'New game',exact:true}).click();await ready()
    if(size.width<600){
      // CDP touch events provide genuine pointer capture rather than synthetic IDs.
      const session=await page.context().newCDPSession(page)
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]})
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+40,y:point.y+25}]})
      await page.waitForTimeout(60)
      await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
      await page.waitForTimeout(60)
      assert.equal(await page.locator('.map-pan-layer').getAttribute('data-panning'),'false')
      await covered()
    }
    // Repeated drags reach the clamp without exceeding it.
    for(let i=0;i<10;i++){
      await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(size.width-20,size.height-160);await page.mouse.up()
    }
    const edge=await camera(),bounded=clampMapCamera(edge,size,true)
    assert.ok(Math.hypot(edge.x-bounded.x,edge.y-bounded.y)<.1,'Camera exceeded the theatre limits')
    await covered()
    await page.setViewportSize({width:size.height,height:size.width});await page.waitForTimeout(100);await ready()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false)
    await page.close()
  }
  assert.deepEqual(errors,[])
  console.log('Desktop/mobile buffered coverage, retained scene, exact pan, large jumps, release, zoom during drag, touch cancellation, camera limits and resize passed.')
}finally{await browser.close()}
