import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const url=process.argv[2]??'http://127.0.0.1:5175',errors=[]
const centres=[['babylon-city-art','Babylon'],['sippar-centre','Sippar'],['nippur-centre','Nippur'],['diyala-centre','Diyala'],['chaldaea-centre','Chaldaea']]
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport,hasTouch:viewport.width<600})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(url)
    const select=id=>page.locator(`.territory-state[data-state=${id}]`).press('Enter')
    const close=()=>page.getByRole('button',{name:'Close state details'}).click()
    const clickAt=async ([lon,lat])=>{
      const at=await page.locator('.map-ground').evaluate((g,[lon,lat])=>{
        const p=new DOMPoint(60+(lon-29)*33,35+(43-lat)*40).matrixTransform(g.getScreenCTM())
        return {x:p.x,y:p.y}
      },[lon,lat])
      await page.mouse.click(at.x,at.y)
    }
    await select('babylon')
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await close()
    await page.getByRole('button',{name:'Detail',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
    assert.equal(await page.locator('[data-state=ur][role=button],[data-state=uruk][role=button],[data-scenery=ur-centre],[data-scenery=uruk-centre]').count(),0)
    for(const [id] of centres)assert.equal(await page.locator(`[data-scenery=${id}]`).count(),1)
    for(const [id,stateId] of [['uruk-city','nippur'],['ur-city','chaldaea'],['larsa-city','nippur']])assert.equal(await page.locator(`.map-settlements [data-settlement=${id}]`).getAttribute('data-state'),stateId)
    if(viewport.width>600){
      for(const [id,name] of centres){
        const at=await page.locator(`[data-scenery=${id}]`).evaluate(g=>{
          const p=new DOMPoint(0,0).matrixTransform(g.getScreenCTM())
          return {x:p.x,y:p.y}
        })
        await page.mouse.click(at.x,at.y)
        assert.equal(await page.locator('#command-title').innerText(),name)
        await close()
      }
      for(const [at,name] of [[[43.8,32.12],'Babylon'],[[43.8,31.95],'Babylon'],[[44.8,34],'Sippar'],[[45.35,33.5],'Diyala'],[[45.7,32],'Nippur'],[[45.64,31.32],'Nippur'],[[46.1,30.96],'Chaldaea']]){
        await clickAt(at)
        assert.equal(await page.locator('#command-title').innerText(),name,`${at}: pointer selection`)
        await close()
      }
    }
    const tier=()=>page.locator('[data-scenery=chaldaea-centre]').getAttribute('data-tier')
    await select('chaldaea')
    assert.equal(await tier(),'homestead')
    await page.getByRole('button',{name:'Build fort',exact:true}).click();assert.equal(await tier(),'homestead')
    for(const expected of ['village','fortress']){
      await page.getByRole('button',{name:'Develop',exact:true}).click();assert.equal(await tier(),expected)
    }
    await page.getByRole('button',{name:'End turn',exact:true}).click()
    await page.getByRole('button',{name:'Develop',exact:true}).click();assert.equal(await tier(),'city')
    await close()
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    await page.getByRole('checkbox',{name:/Settlement artwork/}).uncheck()
    assert.equal(await page.locator('[data-scenery][data-asset=settlement]').count(),0)
    // The capital keeps its faction seal; each other primary centre gets a dot.
    for(const [id] of centres.slice(1))assert.equal(await page.locator(`[data-simple-centre=${id}]`).count(),1)
    await page.getByRole('checkbox',{name:/Settlement artwork/}).check()
    await page.getByRole('checkbox',{name:/Cached ground/}).uncheck()
    await page.getByRole('button',{name:'Close map settings'}).click()
    assert.equal(await page.locator('.campaign-map').getAttribute('data-ground-renderer'),'vector')
    assert.equal(await tier(),'city')
    for(const id of ['ur','uruk'])assert.equal(await page.locator(`[clip-path="url(#state-clip-${id})"]`).count(),0)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    console.log(`${viewport.width}×${viewport.height}: five Babylonian districts, river-bank selection, merged settlements, development and vector fallback passed.`)
    await page.close()
  }
  assert.deepEqual(errors,[])
}finally{await browser.close()}
