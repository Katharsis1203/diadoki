import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
const modulePath=process.env.DIADOCHI_PLAYWRIGHT_MODULE??'playwright'
const {chromium}=await import(isAbsolute(modulePath)?pathToFileURL(modulePath).href:modulePath)
const browser=await chromium.launch({headless:true,...(process.env.DIADOCHI_BROWSER?{executablePath:process.env.DIADOCHI_BROWSER}:{}),args:['--no-sandbox']})
const url=process.argv[2]??'http://127.0.0.1:5175',errors=[]
try{
  for(const ratio of [1,2]){
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:ratio})
    page.on('pageerror',error=>errors.push(error.message))
    await page.goto(url)
    await page.locator('.territory-state[data-state=cossaea]').press('Enter')
    await page.getByRole('button',{name:'Focus province',exact:true}).first().click()
    await page.getByRole('button',{name:'Close state details'}).click()
    for(let round=0;round<2;round++){
      const zoomIn=page.getByRole('button',{name:'Zoom in',exact:true})
      while(await zoomIn.isEnabled())await zoomIn.click()
      if(round===1)await page.evaluate(async()=>{
        const svg=document.querySelector('.campaign-map')
        for(let i=0;i<8;i++){
          svg.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:700,clientY:500,deltaY:i%2?-8:8}))
          await new Promise(requestAnimationFrame)
        }
      })
      await page.waitForFunction(()=>document.querySelector('.prepared-ground')?.dataset.ready==='true'&&document.querySelector('.map-pan-layer')?.dataset.promoted==='true')
      await page.waitForTimeout(100)
      const options={clip:{x:300,y:160,width:740,height:500}},cached=await page.screenshot(options)
      const nativeStyle=await page.addStyleTag({content:'.map-pan-layer{will-change:auto!important;transform:translate(0,0)!important}'})
      const native=await page.screenshot(options)
      await nativeStyle.evaluate(element=>element.remove())
      const meanDifference=await page.evaluate(async([first,second])=>{
        const decode=async data=>{
          const image=new Image();image.src=`data:image/png;base64,${data}`;await image.decode()
          const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height
          const context=canvas.getContext('2d');context.drawImage(image,0,0)
          return context.getImageData(0,0,image.width,image.height).data
        }
        const a=await decode(first),b=await decode(second)
        let difference=0
        for(let i=0;i<a.length;i++)if(i%4!==3)difference+=Math.abs(a[i]-b[i])
        return difference/(a.length*.75)
      },[cached.toString('base64'),native.toString('base64')])
      assert.ok(meanDifference<.25,`DPR ${ratio}, zoom round ${round}: retained image differs from native rendering by ${meanDifference.toFixed(3)} channel levels`)
      console.log(`DPR ${ratio}, close zoom round ${round+1}: native-reference difference ${meanDifference.toFixed(3)}`)
      for(let i=0;i<4;i++)await page.getByRole('button',{name:'Zoom out',exact:true}).click()
    }
    await page.close()
  }
  assert.deepEqual(errors,[])
  console.log('Repeated close zooms retain native SVG sharpness at DPR 1 and 2.')
}finally{await browser.close()}
