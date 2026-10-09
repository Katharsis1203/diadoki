import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const url=process.argv[2]??'http://127.0.0.1:5175',errors=[]
const states=[['persepolis','Persepolis','city'],['pasargadae','Pasargadae','village'],['western-persis','Western Persis','homestead'],['persian-coast','Persian Coast','village'],['western-foothills','Western Foothills','homestead']]
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport,hasTouch:viewport.width<600})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(url)
    await page.getByRole('button',{name:'Dominion overview',exact:true}).click()
    await page.locator('[data-draft-state=persepolis]').press('Enter')
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await page.getByRole('button',{name:'Close map draft details'}).click()
    await page.getByRole('button',{name:'Detail',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
    for(const [id,name,tier] of states){
      const art=page.locator(`[data-scenery="${id}-centre-art"]`)
      assert.equal(await art.count(),1,`${id}: one illustrated centre`)
      assert.equal(await art.getAttribute('data-tier'),tier)
      assert.equal(await page.locator(`[data-draft-centre="${id}"]`).count(),0,`${id}: no duplicate atlas dot`)
      const at=await art.evaluate(g=>{const p=new DOMPoint(0,0).matrixTransform(g.getScreenCTM());return {x:p.x,y:p.y}})
      assert.ok(at.x>0&&at.x<viewport.width&&at.y>0&&at.y<viewport.height,`${id}: centre outside focused viewport`)
      await page.mouse.click(at.x,at.y)
      assert.equal(await page.locator('#draft-title').innerText(),name)
      assert.ok(await page.locator(`[data-district-landscape="${id}"]`).innerText())
      assert.equal(await page.getByRole('button',{name:'Develop',exact:true}).count(),0,'Atlas appearance must not imply playable development')
      await page.getByRole('button',{name:'Close map draft details'}).click()
    }
    assert.equal(await page.locator('[data-draft-state=central-plateau],[data-scenery=central-plateau-centre-art]').count(),0,'The old plateau state and centre are removed')
    const inspectHighlands=()=>page.locator('.map-ground').evaluate(g=>{
      const point=new DOMPoint(60+(53.8-29)*33,35+(43-32.1)*40)
      const screen=point.matrixTransform(g.getScreenCTM())
      return {inside:document.querySelector('[data-mountain-region=persis-northern-highlands]').isPointInFill(point),
        owners:[...document.querySelectorAll('.state-area')].filter(p=>p.isPointInFill(point)).length,
        hit:!!document.elementFromPoint(screen.x,screen.y)?.closest('[data-draft-state],[data-state][role=button]'),
        x:screen.x,y:screen.y}
    })
    const highlands=await inspectHighlands()
    assert.equal(highlands.inside,true,'The northern plateau is part of the independent region')
    assert.equal(highlands.owners,0,'No district owns the Northern Highlands')
    assert.equal(highlands.hit,false,'The blocked region has no state hit target')
    if(viewport.width>600){
      await page.mouse.click(highlands.x,highlands.y)
      assert.equal(await page.locator('#draft-title,#command-title').count(),0,'Clicking the highlands cannot select a state')
      assert.equal(await page.locator('.map-labels text').filter({hasText:'Northern Highlands'}).count(),1,'The area barrier has a readable map caption')
      for(const [point,id] of [[[52.3,31.5],'western-foothills'],[[52.65,31.2],'western-foothills'],[[53.2,31.3],'pasargadae'],[[55.2,30.6],'pasargadae'],[[56.65,31.0],'pasargadae'],[[51.65,31.55],'western-foothills']]){
        const at=await page.locator('.map-ground').evaluate((g,[lon,lat])=>{
          const p=new DOMPoint(60+(lon-29)*33,35+(43-lat)*40).matrixTransform(g.getScreenCTM());return {x:p.x,y:p.y}
        },point)
        await page.mouse.click(at.x,at.y)
        assert.equal(await page.locator(`[data-draft-state=${id}]`).getAttribute('aria-pressed'),'true','The open corridor ground selects its valley district')
        await page.getByRole('button',{name:'Close map draft details'}).click()
      }
      await page.locator('[data-draft-state=western-foothills]').press('Enter')
      assert.ok(!(await page.locator('.theatre-inspector').innerText()).includes('Hecatompylos'),'The inspector no longer advertises a northern plateau border')
      await page.getByRole('button',{name:'Close map draft details'}).click()
    }
    await page.locator('[data-draft-state=persepolis]').press('Enter')
    const capitalHighlight=await page.locator('[data-draft-selection=persepolis]').evaluate(g=>{
      const p=new DOMPoint(60+(53.5-29)*33,35+(43-29.5)*40)
      const fill=g.querySelector('.district-selection-fill'),target=document.querySelector('[data-draft-state=persepolis] .state-area')
      const screen=p.matrixTransform(g.getScreenCTM())
      const peak=document.querySelector('[data-asset=mountain]')
      return {filled:fill.isPointInFill(p),owned:target.isPointInFill(p),
        targetOpacity:getComputedStyle(target).fillOpacity,
        clipped:!!g.closest('[clip-path="url(#mountain-border-clip)"]'),
        intercepts:!!document.elementFromPoint(screen.x,screen.y)?.closest('[data-draft-selection]'),
        beneathRelief:!!(g.compareDocumentPosition(peak)&Node.DOCUMENT_POSITION_FOLLOWING),
        matchingOutline:fill.getAttribute('d')===g.querySelector('.state-selection').getAttribute('d')}
    })
    assert.equal(capitalHighlight.filled,true,'The capital highlight fills its administrative outline across mountain terrain')
    assert.equal(capitalHighlight.owned,false,'The visual highlight does not restore mountain ownership')
    assert.equal(capitalHighlight.targetOpacity,'0','The passable hit shape adds no second fill or mountain-shaped cutouts')
    assert.equal(capitalHighlight.clipped,false,'The capital highlight has no mountain-shaped clipping')
    assert.equal(capitalHighlight.intercepts,false,'The visual overlay cannot intercept state selection')
    assert.equal(capitalHighlight.beneathRelief,true,'The continuous highlight stays beneath mountain artwork')
    assert.equal(capitalHighlight.matchingOutline,true)
    await page.getByRole('button',{name:'Close map draft details'}).click()
    assert.ok(await page.evaluate(()=>{
      const peak=document.querySelector('[data-asset=mountain]')
      return !!peak&&[...document.querySelectorAll('.map-borders')].every(border=>!!(border.compareDocumentPosition(peak)&Node.DOCUMENT_POSITION_FOLLOWING))
    }),'Province, state and ownership borders must render beneath relief')
    assert.equal(await page.locator('[data-scenery=persepolis-centre-art] use').getAttribute('href'),'#scenery-persian-city')
    assert.equal(await page.locator('[data-scenery=pasargadae-centre-art] use').getAttribute('href'),'#scenery-pasargadan-village')
    if(viewport.width>600){
      const labels=await page.locator('[data-draft-label]').evaluateAll(es=>es.map(e=>({id:e.dataset.draftLabel,box:e.getBoundingClientRect().toJSON()})))
      const local=labels.filter(l=>states.some(([id])=>id===l.id))
      assert.equal(local.length,5,'Every Persis state has one label at province focus')
      for(let i=0;i<local.length;i++)for(let j=i+1;j<local.length;j++){
        const a=local[i].box,b=local[j].box
        assert.ok(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),'Persis labels overlap')
      }
    }
    assert.ok(await page.locator('[data-asset=rocks]').count()>0,'Small rock outcrops appear in the province view')
    assert.ok(await page.locator('[data-asset=scrub]').count()>0,'Sparse scrub appears in the province view')
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    await page.getByRole('checkbox',{name:/Mountains and hills/}).uncheck()
    assert.equal(await page.locator('[data-asset=rocks]').count(),0)
    assert.equal((await inspectHighlands()).owners,0,'Terrain exclusions remain when relief is hidden')
    assert.equal(await page.locator('[data-mountain-region=persis-northern-highlands]').count(),1)
    await page.getByRole('checkbox',{name:/Mountains and hills/}).check()
    await page.getByRole('checkbox',{name:/Vegetation/}).uncheck()
    assert.equal(await page.locator('[data-asset=scrub]').count(),0)
    await page.getByRole('checkbox',{name:/Vegetation/}).check()
    await page.getByRole('checkbox',{name:/Settlement artwork/}).uncheck()
    for(const [id] of states){
      assert.equal(await page.locator(`[data-scenery="${id}-centre-art"]`).count(),0)
      assert.equal(await page.locator(`[data-simple-centre="${id}-centre-art"]`).count(),1)
      assert.equal(await page.locator(`[data-draft-centre="${id}"]`).count(),0)
    }
    await page.getByRole('checkbox',{name:/Settlement artwork/}).check()
    await page.getByRole('checkbox',{name:/Cached ground/}).uncheck()
    await page.getByRole('button',{name:'Close map settings'}).click()
    assert.equal(await page.locator('.campaign-map').getAttribute('data-ground-renderer'),'vector')
    assert.equal(await page.locator('.terrain-wash[clip-path="url(#terrain-region-clip-persis-northern-highlands)"]').count(),1,'Highland shading uses the independent region clip in the vector fallback')
    for(const [id] of states)assert.ok(await page.locator(`.terrain-wash[clip-path="url(#state-clip-${id})"]`).count()>0,`${id}: own terrain clip`)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    await page.locator('[data-state=mountain-entrance][role=button]').press('Enter')
    assert.equal(await page.locator('#command-title').innerText(),'Mountain Entrance')
    assert.match(await page.locator('.command-panel .eyebrow').innerText(),/susiana/i)
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await page.getByRole('button',{name:'Close state details'}).click()
    const entrance=page.locator('[data-scenery=mountain-entrance-centre]')
    assert.equal(await entrance.count(),1)
    const entranceAt=await entrance.evaluate(g=>{const p=new DOMPoint(0,0).matrixTransform(g.getScreenCTM());return {x:p.x,y:p.y}})
    await page.mouse.click(entranceAt.x,entranceAt.y)
    assert.equal(await page.locator('#command-title').innerText(),'Mountain Entrance')
    await page.getByRole('button',{name:'Close state details'}).click()
    await page.locator('[data-state=western-valley][role=button]').press('Enter')
    assert.equal(await page.locator('#command-title').innerText(),'Western Valley')
    assert.match(await page.locator('.command-panel .eyebrow').innerText(),/susiana/i)
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await page.getByRole('button',{name:'Close state details'}).click()
    const westernValley=page.locator('[data-scenery=western-valley-centre]')
    assert.equal(await westernValley.count(),1)
    const westernAt=await westernValley.evaluate(g=>{const p=new DOMPoint(0,0).matrixTransform(g.getScreenCTM());return {x:p.x,y:p.y}})
    await page.mouse.click(westernAt.x,westernAt.y)
    assert.equal(await page.locator('#command-title').innerText(),'Western Valley')
    assert.match(await page.locator('.command-panel .eyebrow').innerText(),/susiana/i)
    console.log(`${viewport.width}×${viewport.height}: Persis centres, selection, labels, simple markers and SVG fallback passed.`)
    await page.close()
  }
  const core=await browser.newPage()
  await core.goto(`${url.replace(/\/$/,'')}?provinces=core`)
  assert.equal(await core.locator('[data-draft-state]').count(),0)
  assert.equal(await core.locator('[data-scenery=persepolis-centre-art]').count(),0)
  await core.close()
  assert.deepEqual(errors,[])
}finally{await browser.close()}
