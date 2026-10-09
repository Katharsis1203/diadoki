import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import { project } from '../src/game/geographicProjection.ts'

const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const url=process.argv[2]??'http://127.0.0.1:5175',errors=[]
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport,hasTouch:viewport.width<600})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(url)
    await page.getByRole('button',{name:'Dominion overview',exact:true}).click()
    await page.locator('[data-state=mountain-entrance][role=button]').press('Enter')
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await page.getByRole('button',{name:'Close state details'}).click()
    await page.getByRole('button',{name:'Detail',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true')
    assert.equal(await page.locator('[data-mountain-pass]').count(),7,'All authored passes have terrain markers')
    const inspect=(point=project([48.76,32.73]))=>page.evaluate(([x,y])=>{
      const p=new DOMPoint(x,y),ground=document.querySelector('.map-ground')
      const screen=p.matrixTransform(ground.getScreenCTM())
      const target=document.elementFromPoint(screen.x,screen.y)
      return {
        inside:document.querySelector('[data-independent-terrain=mountains]>path').isPointInFill(p),
        owners:[...document.querySelectorAll('.state-area')].filter(e=>e.isPointInFill(p)).length,
        hit:!!target?.closest('[data-state][role=button],[data-draft-state][role=button]'),
        clipped:[...document.querySelectorAll('.map-borders')].every(e=>e.getAttribute('clip-path')==='url(#mountain-border-clip)'),
        x:screen.x,y:screen.y,
      }
    },point)
    const at=await inspect()
    assert.equal(at.inside,true,'Fixture is independent mountain ground')
    assert.equal(at.owners,0,'No campaign or atlas state contains mountain ground')
    assert.equal(at.hit,false,'Mountain ground has no state pointer target')
    assert.equal(at.clipped,true,'Border ink stops before mountain belts')
    assert.ok(at.x>0&&at.x<viewport.width&&at.y>0&&at.y<viewport.height,'Mountain fixture is visible')
    await page.mouse.click(at.x,at.y)
    assert.equal(await page.locator('#command-title,#draft-title').count(),0,'Mountains cannot open state details')
    const riverShoulder=await inspect(project([49.52,32.02]))
    assert.equal(riverShoulder.inside,true,'The north bank of Elymais is independent mountain ground')
    assert.equal(riverShoulder.owners,0,'No state owns the upper-river mountain shoulder')
    assert.equal(riverShoulder.hit,false,'The mountain shoulder has no state pointer target')
    for(const [point,id,title] of [[project([50.01,32.05]),'mountain-entrance','Mountain Entrance'],[project([49.85,31.99]),'elymais','Elymais']]){
      const valley=await page.evaluate(([x,y])=>{
        const p=new DOMPoint(x,y).matrixTransform(document.querySelector('.map-ground').getScreenCTM())
        return {x:p.x,y:p.y,id:document.elementFromPoint(p.x,p.y)?.closest('[data-state][role=button]')?.dataset.state}
      },point)
      assert.equal(valley.id,id,'Open passage ground has its valley state as the pointer target')
      await page.mouse.click(valley.x,valley.y)
      assert.equal(await page.locator('#command-title').innerText(),title)
      await page.getByRole('button',{name:'Close state details'}).click()
    }
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    await page.getByRole('checkbox',{name:/Mountains and hills/}).uncheck()
    await page.getByRole('button',{name:'Close map settings'}).click()
    assert.equal(await page.locator('[data-asset=mountain]').count(),0)
    const hiddenArt=await inspect()
    assert.equal(hiddenArt.inside,true,'Unowned terrain persists when relief artwork is hidden')
    assert.equal(hiddenArt.owners,0)
    assert.equal(hiddenArt.hit,false)
    assert.equal(await page.locator('[data-mountain-pass]').count(),7)
    console.log(`${viewport.width}×${viewport.height}: mountain ownership, restored valley selection, border clipping and pass markers passed.`)
    await page.close()
  }
  assert.deepEqual(errors,[])
}finally{await browser.close()}
