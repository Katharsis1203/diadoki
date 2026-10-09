import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const url=process.argv[2]??'http://127.0.0.1:5175',errors=[]
const states=[['upper-euphrates','Upper Euphrates'],['nisibis','Nisibis'],['nineveh','Nineveh'],['arbela','Arbela'],['assur','Assur']]
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport,hasTouch:viewport.width<600})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(url)
    const select=id=>page.locator(`.territory-state[data-state="${id}"]`).press('Enter')
    const close=()=>page.getByRole('button',{name:'Close state details'}).click()
    const checkTier=async tier=>{
      for(const [id] of states)assert.equal(await page.locator(`[data-scenery="${id}-centre-art"]`).getAttribute('data-tier'),id==='nineveh'?'city':id==='assur'?tier:'homestead')
    }
    await select('nineveh')
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await close()
    await page.getByRole('button',{name:'Detail',exact:true}).click()
    if(viewport.width>600)await page.getByRole('button',{name:'Zoom in',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
    await checkTier('homestead')
    assert.equal(await page.locator('[data-scenery=nineveh-centre-art] use').getAttribute('href'),'#scenery-assyrian-city')
    if(viewport.width>600){
      for(const [id,name] of states){
        const at=await page.locator(`[data-scenery="${id}-centre-art"]`).evaluate(g=>{
          const p=new DOMPoint(0,0).matrixTransform(g.getScreenCTM())
          return {x:p.x,y:p.y}
        })
        await page.mouse.click(at.x,at.y)
        assert.equal(await page.locator('#command-title').innerText(),name)
        await close()
      }
      const labels=await page.locator('.map-labels text').evaluateAll(es=>es.map(e=>({text:e.textContent.replace(/\s+/g,''),box:e.getBoundingClientRect().toJSON()})))
      for(const [,name] of states)assert.equal(labels.filter(l=>l.text===name.replaceAll(' ','')).length,1,`${name}: must have one visible state label`)
      const local=labels.filter(l=>states.some(([,name])=>l.text===name.replaceAll(' ','')))
      for(let i=0;i<local.length;i++)for(let j=i+1;j<local.length;j++){
        const a=local[i].box,b=local[j].box
        assert.ok(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),'Assyria labels overlap')
      }
    }
    // Capture through the actual campaign flow before using local development.
    await select('sippar')
    await page.getByRole('button',{name:'Move commander here',exact:true}).click()
    await select('assur')
    await page.getByRole('button',{name:'Invade',exact:true}).click()
    await page.getByRole('button',{name:'Assault',exact:true}).click()
    assert.equal(await page.locator('#command-title').innerText(),'Assur')
    await page.getByRole('button',{name:'End turn',exact:true}).click()
    await page.getByRole('button',{name:'Build fort',exact:true}).click();await checkTier('homestead')
    await page.getByRole('button',{name:'Develop',exact:true}).click();await checkTier('village')
    await page.getByRole('button',{name:'Develop',exact:true}).click();await checkTier('fortress')
    await page.getByRole('button',{name:'End turn',exact:true}).click()
    await page.getByRole('button',{name:'Develop',exact:true}).click();await checkTier('city')
    await close()
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    await page.getByRole('checkbox',{name:/Settlement artwork/}).uncheck()
    for(const [id] of states){
      assert.equal(await page.locator(`[data-scenery="${id}-centre-art"]`).count(),0)
      assert.equal(await page.locator(`[data-simple-centre="${id}-centre-art"]`).count(),1)
    }
    await page.getByRole('checkbox',{name:/Settlement artwork/}).check()
    await page.getByRole('checkbox',{name:/Cached ground/}).uncheck()
    await page.getByRole('button',{name:'Close map settings'}).click()
    assert.equal(await page.locator('.campaign-map').getAttribute('data-ground-renderer'),'vector')
    for(const [id] of states)assert.ok(await page.locator(`.terrain-wash[clip-path="url(#state-clip-${id})"]`).count()>0)
    await checkTier('city')
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    console.log(`${viewport.width}×${viewport.height}: Assyria centres, selection, conquest, local development and SVG fallback passed.`)
    await page.close()
  }
  assert.deepEqual(errors,[])
}finally{await browser.close()}
