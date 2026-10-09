import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

// Uses the optional browser tools already used by the map authoring checks.
const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const url=process.argv[2]??'http://127.0.0.1:5175',errors=[]
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport,hasTouch:viewport.width<600})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(url)
    const select=(id='susa')=>page.locator(`.territory-state[data-state=${id}]`).press('Enter')
    const close=()=>page.getByRole('button',{name:'Close state details'}).click()
    const centres=page.locator('[data-scenery][data-asset=settlement]')
    const tiers=()=>centres.evaluateAll(es=>Object.fromEntries(es.map(e=>[e.dataset.scenery,e.dataset.tier])))
    const checkTier=async tier=>{
      const actual=await tiers()
      assert.equal(actual['susa-city-art'],'city')
      assert.equal(actual['karun-centre-art'],tier)
      assert.equal(actual['mountain-entrance-centre'],'homestead')
      assert.ok(['homestead','village'].includes(actual['western-valley-centre']))
      assert.equal(actual['elymais-centre-art'],'village')
    }
    await select()
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await close()
    await page.getByRole('button',{name:'Detail',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
    assert.ok(await page.evaluate(()=>[
      ['susa',[46.75,32.20]],['nippur',[46.67,32.20]],
      ['chaldaea',[47.60,30.78]],['karun',[47.68,30.78]],['susa',[47.50,31.20]],['susa',[47.48,31.10]],['susa',[47.53,31.28]],
    ].every(([id,[lon,lat]])=>document.querySelector(`[data-state=${id}] .state-area`)
      .isPointInFill(new DOMPoint(60+(lon-29)*33,35+(43-lat)*40)))),
    'Babylonia and Susiana meet on the river instead of assigning the eastern bank to Babylonia')
    assert.equal(await page.locator('[data-state=cossaea][role=button],[data-scenery=cossaea-centre-art]').count(),0)
    await checkTier('homestead')
    assert.equal(await page.locator('[data-scenery=susa-city-art] use').getAttribute('href'),'#scenery-susian-city')
    assert.equal(await page.locator('[data-field^=susa]').count(),3)
    if(viewport.width>600){
      // Actual pointer clicks at the drawn settlement anchors pass through art
      // to the owning state polygon, for every Susiana state centre.
      for(const [id,state] of [['susa-city-art','Susa'],['karun-centre-art','Karun'],['elymais-centre-art','Elymais'],['mountain-entrance-centre','Mountain Entrance'],['western-valley-centre','Western Valley']]){
        const at=await page.locator(`[data-scenery=${id}]`).evaluate(g=>{
          const p=new DOMPoint(0,0).matrixTransform(g.getScreenCTM())
          return {x:p.x,y:p.y}
        })
        await page.mouse.click(at.x,at.y)
        assert.equal(await page.locator('#command-title').innerText(),state)
        await close()
      }
      for(const point of [[47.75,34.30],[48.45,34.25]]){
        const at=await page.locator('.map-ground').evaluate((g,[lon,lat])=>{
          const p=new DOMPoint(60+(lon-29)*33,35+(43-lat)*40).matrixTransform(g.getScreenCTM())
          return {x:p.x,y:p.y}
        },point)
        await page.mouse.click(at.x,at.y)
        assert.equal(await page.locator('#command-title').innerText(),'Western Valley','The expanded southern river bank selects Western Valley')
        assert.match(await page.locator('.command-panel .eyebrow').innerText(),/susiana/i)
        await close()
      }
      for(const [point,state] of [[[47.50,31.20],'Susa'],[[48.54,31.13],'Karun'],[[48.62,31.13],'Elymais'],[[48.37,30.84],'Karun'],[[48.45,30.84],'Elymais'],[[48.9,30.2],'Elymais']]){
        const at=await page.locator('.map-ground').evaluate((g,[lon,lat])=>{
          const p=new DOMPoint(60+(lon-29)*33,35+(43-lat)*40).matrixTransform(g.getScreenCTM())
          return {x:p.x,y:p.y}
        },point)
        await page.mouse.click(at.x,at.y)
        assert.equal(await page.locator('#command-title').innerText(),state,'River-bank pointer selection follows the reorganised district')
        await close()
      }
      const formerCossaea=await page.locator('.map-ground').evaluate(g=>{
        const p=new DOMPoint(60+(47.25-29)*33,35+(43-33.12)*40).matrixTransform(g.getScreenCTM())
        return {x:p.x,y:p.y}
      })
      await page.mouse.click(formerCossaea.x,formerCossaea.y)
      assert.equal(await page.locator('#command-title').innerText(),'Susa','Former Cossaean land selects the merged capital state')
      await close()
      const labels=await page.locator('.map-labels text').evaluateAll(es=>es.map(e=>({text:[...e.querySelectorAll('tspan')].map(t=>t.textContent).join(' '),box:e.getBoundingClientRect().toJSON()})))
      assert.ok(labels.some(l=>l.text==='Susa'))
      for(const name of ['Karun','Elymais','Mountain Entrance','Western Valley'])assert.ok(labels.some(l=>l.text===name),`${name}: missing close-view label`)
      const local=labels.filter(l=>['Susa','Karun','Elymais','Mountain Entrance','Western Valley'].includes(l.text))
      for(let i=0;i<local.length;i++)for(let j=i+1;j<local.length;j++){
        const a=local[i].box,b=local[j].box
        assert.ok(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),'Susa labels overlap')
      }
    }
    await select('western-valley')
    assert.match(await page.locator('.command-panel .eyebrow').innerText(),/susiana/i)
    await page.getByRole('button',{name:'Develop',exact:true}).click()
    assert.equal(await page.locator('[data-scenery=western-valley-centre]').getAttribute('data-tier'),'village')
    await close()
    await select('karun')
    await page.getByRole('button',{name:'End turn',exact:true}).click()
    await page.getByRole('button',{name:'Build fort',exact:true}).click();await checkTier('homestead')
    await page.getByRole('button',{name:'Develop',exact:true}).click();await checkTier('village')
    await page.getByRole('button',{name:'Develop',exact:true}).click();await checkTier('fortress')
    await page.getByRole('button',{name:'End turn',exact:true}).click()
    await page.getByRole('button',{name:'Develop',exact:true}).click();await checkTier('city')
    await close()
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    await page.getByRole('checkbox',{name:/Settlement artwork/}).uncheck()
    assert.equal(await page.locator('[data-scenery][data-asset=settlement]').count(),0)
    for(const id of ['susa-city-art','karun-centre-art','elymais-centre-art','mountain-entrance-centre','western-valley-centre'])assert.equal(await page.locator(`[data-simple-centre=${id}]`).count(),1)
    await page.getByRole('checkbox',{name:/Settlement artwork/}).check()
    await page.getByRole('checkbox',{name:/Cached ground/}).uncheck()
    await page.getByRole('button',{name:'Close map settings'}).click()
    assert.equal(await page.locator('.campaign-map').getAttribute('data-ground-renderer'),'vector')
    assert.equal(await page.locator('.terrain-wash[clip-path="url(#state-clip-susa)"]').count(),5)
    await checkTier('city')
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    console.log(`${viewport.width}×${viewport.height}: Susiana state settlements, development, simple markers and vector terrain passed.`)
    await page.close()
  }
  assert.deepEqual(errors,[])
}finally{await browser.close()}
