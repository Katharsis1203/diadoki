import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const url=process.argv[2]??'http://127.0.0.1:5175'
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const errors=[]
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5})
  page.on('pageerror',error=>errors.push(error.message))
  await page.addInitScript(()=>{
    window.groundResources={created:0,released:0,canvases:0}
    const create=URL.createObjectURL.bind(URL),release=URL.revokeObjectURL.bind(URL),element=document.createElement.bind(document)
    URL.createObjectURL=blob=>{window.groundResources.created++;return create(blob)}
    URL.revokeObjectURL=href=>{window.groundResources.released++;return release(href)}
    document.createElement=(name,...args)=>{if(name==='canvas')window.groundResources.canvases++;return element(name,...args)}
  })
  let resume
  const gate=new Promise(resolve=>{resume=resolve}),requests=[]
  await page.route('**/textures/ground/*.png',async route=>{
    requests.push(route.request().url())
    if(route.request().url().includes('_2_'))await gate
    await route.continue().catch(()=>{})
  })
  await page.goto(url)
  await page.waitForFunction(()=>{
    const tiles=[...document.querySelectorAll('[data-prepared-ground]')]
    return tiles.length>0&&tiles.every(tile=>tile.querySelector('image[data-ground-resolution="0.5"]'))
  })
  assert.ok(requests[0].includes('_0.5_'),'Visible coarse coverage was not prioritised')
  assert.equal(await page.locator('[data-prepared-fallback]').count(),0)
  assert.equal(await page.locator('.prepared-ground .terrain-wash,.prepared-ground .terrain-detail').count(),0)
  assert.equal(await page.locator('.prepared-ground').getAttribute('data-ready'),'false')
  // The canonical state hit layer remains usable while high detail is delayed.
  await page.locator('.territory-state[data-state=babylon]').press('Enter')
  assert.equal(await page.locator('#command-title').textContent(),'Babylon')
  await page.getByRole('button',{name:'Close state details'}).click()
  await page.waitForTimeout(100)
  await page.evaluate(()=>{
    window.outsideGroundMutations=[]
    new MutationObserver(records=>{
      for(const record of records)if(!record.target.closest?.('.prepared-ground'))window.outsideGroundMutations.push(record.target.nodeName)
    }).observe(document.querySelector('.campaign-map'),{subtree:true,childList:true,attributes:true,characterData:true})
  })
  resume()
  await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
  await page.waitForTimeout(150)
  assert.deepEqual(await page.evaluate(()=>window.outsideGroundMutations),[],'Image publication mutated the parent scene')
  assert.equal(await page.locator('.prepared-ground image[data-ground-resolution="0.5"]').count(),0)
  assert.equal(await page.locator('[data-prepared-ground]').count(),await page.locator('.prepared-ground image').count(),'Fine imagery overlapped its coarse fallback')
  const stats=await page.locator('.prepared-ground').evaluate(node=>node.dataset)
  assert.ok(Number(stats.cacheBytes)+Number(stats.cacheReserved)<=64*1024*1024)
  assert.ok(Number(stats.cacheActive)<=3)
  assert.equal(await page.evaluate(()=>window.groundResources.canvases),0)
  await page.getByRole('button',{name:'Settings',exact:true}).click()
  await page.getByRole('checkbox',{name:/^Cached ground/}).uncheck()
  await page.waitForFunction(()=>window.groundResources.created===window.groundResources.released)
  await page.getByRole('checkbox',{name:/^Cached ground/}).check()
  await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
  await page.close()
  // Failed fine downloads keep decoded coarse imagery instead of expensive SVG.
  const failed=await browser.newPage({viewport:{width:1440,height:900}})
  failed.on('pageerror',error=>errors.push(error.message))
  await failed.route('**/textures/ground/*_2_*.png',route=>route.fulfill({status:503,body:''}))
  await failed.goto(url)
  await failed.waitForFunction(()=>{
    const tiles=[...document.querySelectorAll('[data-prepared-ground]')]
    return tiles.length>0&&tiles.every(tile=>tile.querySelector('image'))&&Number(document.querySelector('.prepared-ground')?.dataset.cacheFailed)>0
  })
  assert.equal(await failed.locator('[data-prepared-fallback]').count(),0)
  assert.equal(await failed.locator('.prepared-ground image[data-ground-resolution="2"]').count(),0)
  await failed.close()
  assert.deepEqual(errors,[])
  console.log('Visible-first coarse coverage, isolated fine-image publication, three-job pool, memory bounds, resource release/reactivation and coarse download fallback passed.')
}finally{await browser.close()}
