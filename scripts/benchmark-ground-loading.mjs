// Controlled cold-cache download delay; optional Playwright authoring tool.
import fs from 'node:fs'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const url=process.argv[2]??'http://127.0.0.1:5175',delayMs=150,records=[]
try{
  for(let sample=0;sample<3;sample++){
    const page=await browser.newPage({viewport:{width:1440,height:900}})
    await page.addInitScript(()=>{
      new MutationObserver((records,observer)=>{
        if(document.querySelector('.prepared-ground')){window.groundMountedAt=performance.now();observer.disconnect()}
      }).observe(document,{subtree:true,childList:true})
    })
    let active=0,maxActive=0,requested=0,closing=false
    await page.route('**/textures/ground/*.png',async route=>{
      active++;requested++;maxActive=Math.max(active,maxActive)
      try{await new Promise(resolve=>setTimeout(resolve,delayMs));await route.continue()}
      catch(error){if(!closing)throw error}
      finally{active--}
    })
    await page.goto(url,{waitUntil:'domcontentloaded'})
    await page.waitForSelector('.prepared-ground')
    await page.waitForFunction(()=>{
      const matrix=document.querySelector('.map-ground')?.getScreenCTM()
      if(!matrix)return false
      const tiles=[...document.querySelectorAll('[data-prepared-ground]')].filter(tile=>{
        const rect=tile.querySelector('clipPath rect'),x=Number(rect.getAttribute('x')),y=Number(rect.getAttribute('y'))
        const a=new DOMPoint(x,y).matrixTransform(matrix),b=new DOMPoint(x+Number(rect.getAttribute('width')),y+Number(rect.getAttribute('height'))).matrixTransform(matrix)
        return b.x>0&&b.y>0&&a.x<innerWidth&&a.y<innerHeight
      })
      return tiles.length>0&&tiles.every(tile=>tile.querySelector('image'))
    })
    const elapsed=()=>page.evaluate(()=>performance.now()-window.groundMountedAt)
    const visibleImageMs=await elapsed()
    await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
    records.push({sample,visibleImageMs,renderedDetailMs:await elapsed(),maxActive,requested})
    // Pending preloads may be cancelled after the measured readiness point.
    closing=true
    await page.close()
  }
}finally{await browser.close()}
const median=key=>records.map(record=>record[key]).toSorted((a,b)=>a-b)[1]
const report={url,viewport:'1440×900',samples:3,delayMs,clock:'After .prepared-ground mounts; excludes app startup',records,summary:{visibleImageMs:median('visibleImageMs'),renderedDetailMs:median('renderedDetailMs')}}
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
