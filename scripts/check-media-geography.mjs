import assert from 'node:assert/strict'
import {isAbsolute} from 'node:path'
import {pathToFileURL} from 'node:url'
const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const url=process.argv[2]??'http://127.0.0.1:5175',errors=[]
const states=[['assur','Assur','assyria',5,'Antigonids'],['zagros','Zagros','babylonia',6,'Nicanor'],['nisaea','Nisaean Plain','media',4,'Nicanor'],['ecbatana','Ecbatana','media',4,'Nicanor'],['rhagae','Rhagae','media',4,'Nicanor'],['paraitakene','Paraitakene','media',4,'Nicanor'],['western-valley','Western Valley','susiana',5,'Seleucids'],['ganzak','Ganzak','atropatene',5,'Atropatene'],['atropatene','Atropatene','atropatene',5,'Atropatene'],['northern-atropatene','Northern Uplands','atropatene',5,'Atropatene'],['atropatene-river-basin','River Basin','atropatene',5,'Atropatene'],['atropatene-coast','Caspian Coast','atropatene',5,'Atropatene']]
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport,hasTouch:viewport.width<600})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(url)
    const select=id=>page.locator(`[data-state=${id}][role=button]`).press('Enter')
    const close=()=>page.getByRole('button',{name:'Close state details'}).click()
    await select('ecbatana')
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await close()
    await page.getByRole('button',{name:'Detail',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
    for(const [id,name,province,count,owner] of states){
      await select(id)
      assert.equal(await page.locator('#command-title').innerText(),name)
      assert.match(await page.locator('.command-panel .eyebrow').innerText(),new RegExp(province,'i'))
      assert.ok((await page.locator('.command-panel').innerText()).includes(`Controlled by ${owner}`))
      assert.equal(await page.locator('.province-members button').count(),count)
      assert.ok(await page.locator('.terrain-summary').innerText())
      await close()
    }
    const riverPockets=await page.evaluate(()=>{
      const state=document.querySelector('[data-state=atropatene-river-basin] .state-area')
      const mountain=document.querySelector('[data-independent-terrain=mountains]>path')
      return [[47.80,37.20],[48.10,36.50],[48.35,36.40],[47.96,36.23]].every(([lon,lat])=>{
        const p=new DOMPoint(60+(lon-29)*33,35+(43-lat)*40)
        return state.isPointInFill(p)&&!mountain.isPointInFill(p)
      })
    })
    assert.ok(riverPockets,'River Basin includes both open pockets inside its river and foothill outline')
    assert.ok(await page.evaluate(()=>[
      ['atropatene',[45.83,36.57]],['ganzak',[45.83,36.51]],['atropatene',[45.30,36.45]],
    ].every(([id,[lon,lat]])=>document.querySelector(`[data-state=${id}] .state-area`)
      .isPointInFill(new DOMPoint(60+(lon-29)*33,35+(43-lat)*40)))),
    'Ganzak’s upper Lesser Zab boundary keeps each river bank in its own province')
    if(viewport.width>600){
      for(const [point,name] of [[[46.55,34.84],'Zagros'],[[46.73,34.25],'Zagros'],[[45.59,34.49],'Zagros'],[[44.95,34.70],'Assur'],[[48.15,33.85],'Western Valley'],
        [[47.6,34.5],'Nisaean Plain'],[[48.52,34.8],'Ecbatana'],[[51.44,35.6],'Rhagae'],[[50.2,33.8],'Paraitakene'],
        [[47.65,36.05],'Ganzak'],[[47.65,35.95],'Nisaean Plain'],[[47.04,35.91],'Ganzak'],[[47.04,35.83],'Nisaean Plain'],[[46.5,36.7],'Ganzak'],[[46.1,37.8],'Atropatene'],[[47.65,38.2],'Northern Uplands'],[[48.45,36.75],'River Basin'],[[48.65,37.55],'Caspian Coast'],[[47.80,37.20],'River Basin'],[[48.10,36.50],'River Basin'],[[48.35,36.40],'River Basin'],[[47.96,36.23],'River Basin']]){
        const fixture=states.find(([,stateName])=>stateName===name)
        await select(fixture[0])
        await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
        await close()
        const at=await page.locator('.map-ground').evaluate((g,[lon,lat])=>{
          const p=new DOMPoint(60+(lon-29)*33,35+(43-lat)*40).matrixTransform(g.getScreenCTM())
          return {x:p.x,y:p.y}
        },point)
        assert.ok(at.x>0&&at.x<viewport.width&&at.y>0&&at.y<viewport.height,'The focused province contains the selection fixture')
        await page.mouse.click(at.x,at.y)
        assert.equal(await page.locator('#command-title').innerText(),name,`Selection at ${point}`)
        await close()
      }
    }
    await select('susa')
    assert.match(await page.locator('.command-panel .eyebrow').innerText(),/susiana/i)
    assert.equal(await page.locator('.province-members button').count(),5,'Susiana includes Western Valley')
    await close()
    assert.ok(await page.evaluate(()=>{
      const peak=document.querySelector('[data-asset=mountain]')
      return !!peak&&[...document.querySelectorAll('.map-borders')].every(g=>g.getAttribute('clip-path')==='url(#mountain-border-clip)'&&!!(g.compareDocumentPosition(peak)&Node.DOCUMENT_POSITION_FOLLOWING))
    }),'Borders stop before mountains and render beneath the relief')
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    await page.getByRole('checkbox',{name:/Cached ground/}).uncheck()
    await page.getByRole('checkbox',{name:/Mountains and hills/}).uncheck()
    await page.getByRole('button',{name:'Close map settings'}).click()
    assert.equal(await page.locator('.campaign-map').getAttribute('data-ground-renderer'),'vector')
    const mountain=await page.locator('.map-ground').evaluate(()=>{
      const p=new DOMPoint(60+(46.30-29)*33,35+(43-35.16)*40)
      return {inside:document.querySelector('[data-independent-terrain=mountains]>path').isPointInFill(p),
        owners:[...document.querySelectorAll('.state-area')].filter(e=>e.isPointInFill(p)).length}
    })
    assert.equal(mountain.inside,true)
    assert.equal(mountain.owners,0,'Mountain exclusions remain active when artwork is hidden')
    assert.equal(await page.locator('[data-mountain-pass]').count(),7)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    console.log(`${viewport.width}×${viewport.height}: separate northern province, Nicanor ownership, river-bank selection, both Zagros entrances, mountain exclusions and vector fallback passed.`)
    await page.close()
  }
  assert.deepEqual(errors,[])
}finally{await browser.close()}
