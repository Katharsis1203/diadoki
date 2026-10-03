// Optional authoring tool: Playwright is not a runtime/build dependency.
// DIADOCHI_PLAYWRIGHT_MODULE can point at a separately installed module.
import fs from 'node:fs'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
let chromium
try{({chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath))}
catch{throw new Error('Install Playwright separately or set DIADOCHI_PLAYWRIGHT_MODULE to its module path. See PERFORMANCE.md.')}
const url=process.argv[2]??'http://127.0.0.1:5175'
const samples=Number(process.env.DIADOCHI_BENCHMARK_SAMPLES??3)
const events=Number(process.env.DIADOCHI_BENCHMARK_EVENTS??120)
if(!Number.isInteger(samples)||samples<1||!Number.isInteger(events)||events<1)throw new Error('Samples and events must be positive integers.')
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const records=[]
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}})
  const client=await page.context().newCDPSession(page)
  await client.send('Performance.enable')
  const metrics=async()=>Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]))
  await page.goto(url)
  if(process.env.DIADOCHI_BENCHMARK_PRESET==='light'){
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    await page.getByRole('button',{name:'Light detail',exact:true}).click()
    await page.getByRole('button',{name:'Close map settings'}).click()
  }
  for(let sample=0;sample<samples;sample++)for(const mode of ['pan','zoom','selection']){
    await page.getByRole('button',{name:'New game',exact:true}).click()
    await page.waitForTimeout(650)
    if(!url.includes('ground=vector'))await page.waitForFunction(()=>document.querySelector('.campaign-map').dataset.groundRenderer==='cached')
    if(mode==='pan'){await page.mouse.move(700,500);await page.mouse.down()}
    const before=await metrics(),start=performance.now()
    const renderers=await page.evaluate(async({mode,events})=>{
      const svg=document.querySelector('.campaign-map'),renderers={}
      for(let i=0;i<events;i++){
        if(mode==='pan')svg.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,buttons:1,clientX:700+Math.sin(i/14)*70,clientY:500+Math.cos(i/14)*45}))
        else if(mode==='zoom')svg.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:700,clientY:500,deltaY:i%2?8:-8}))
        else document.querySelector(`.territory-state[data-state=${['sippar','nippur','uruk','ur','diyala','chaldaea'][i%6]}]`).dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))
        await new Promise(requestAnimationFrame)
        renderers[svg.dataset.groundRenderer]=(renderers[svg.dataset.groundRenderer]??0)+1
      }
      await new Promise(requestAnimationFrame)
      return renderers
    },{mode,events})
    const after=await metrics()
    if(mode==='pan')await page.mouse.up()
    records.push({sample,mode,scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,
      taskMs:(after.TaskDuration-before.TaskDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,
      styleMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,wallMs:performance.now()-start,renderers,
      svgNodes:await page.locator('.campaign-map *').count()})
    console.error(`Completed ${sample+1}/${samples}: ${mode}`)
  }
}finally{await browser.close()}
const median=values=>values.toSorted((a,b)=>a-b)[Math.floor(values.length/2)]
const summary=Object.fromEntries(['pan','zoom','selection'].map(mode=>[mode,Object.fromEntries(['scriptMs','taskMs','layoutMs','styleMs','wallMs'].map(key=>[key,median(records.filter(r=>r.mode===mode).map(r=>r[key]))]))]))
const report={url,viewport:'1440×900',samples,eventsPerScenario:events,preset:process.env.DIADOCHI_BENCHMARK_PRESET??'full',records,summary}
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
