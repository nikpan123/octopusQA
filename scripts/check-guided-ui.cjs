const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function check(){
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [name,url] of [['Octopus','http://127.0.0.1:4173'],['Centrum','http://127.0.0.1:4180/#tests'],['CMS','http://127.0.0.1:4181/#tests'],['Hurtownia','http://127.0.0.1:18767']]){
   const page=await browser.newPage({viewport:{width:1500,height:1050}});
   const errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/**',route=>{
    if(route.request().method()!=='GET'){writes.push(route.request().url());return route.abort();}
    return route.continue();
   });
   await page.goto(url);
   await page.locator('.qa-guide-intro summary').click();
   assert.match(await page.locator('.qa-guide-intro').textContent(),/Pominięte/);
   await page.locator('.qa-guide-intro summary').click();
   const guide=page.locator('[data-qa-guide]').first();
   await guide.waitFor({timeout:30000});
   const before=await page.locator('input[type=checkbox]:checked').count();
   await guide.click();
   assert.equal(await page.locator('.qa-guide-dialog[open] h3').count(),6);
   assert.match(await page.locator('.qa-guide-dialog').textContent(),/Wpływ na dane/);
   assert.equal(await page.locator('input[type=checkbox]:checked').count(),before);
   await page.keyboard.press('Escape');
   if(await page.locator('#qa-theme-mode').count())await page.locator('#qa-theme-mode').selectOption('dark');
   else await page.evaluate(()=>document.documentElement.dataset.theme='dark');
   await guide.click();
   assert.equal(await page.locator('.qa-guide-dialog').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(23, 33, 49)');
   await page.setViewportSize({width:390,height:844});
   assert.equal(await page.locator('.qa-guide-dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
   await page.keyboard.press('Escape');
   if(name==='Hurtownia'){
    await page.locator('nav [data-view=scenarios]').click();
    await page.locator('#scenario-detail > [data-qa-guide]').waitFor();
    await page.locator('#scenario-detail > [data-qa-guide]').click();
    assert.match(await page.locator('.qa-guide-dialog').textContent(),/HTTP 200/);
    await page.keyboard.press('Escape');
   }
   assert.deepEqual(writes,[],'Instrukcje nie wysyłają poleceń zapisu ani uruchomienia');
   assert.deepEqual(errors,[]);
   console.log(name+': instrukcja, brak uruchomień i zmiany wyboru, ciemny motyw i mały ekran — OK');
   await page.close();
  }
 }finally{await browser.close();}
}
check().catch(error=>{console.error(error);process.exitCode=1;});
