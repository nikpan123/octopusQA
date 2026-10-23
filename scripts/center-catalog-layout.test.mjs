import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium,expect} from '@playwright/test';
const root=path.resolve(fileURLToPath(new URL('../..',import.meta.url)),'Centrum-testow');
const {createCenter}=await import(pathToFileURL(path.join(root,'server.mjs')));

test('Katalog Centrum: czytelne wiersze, akcje, filtry, zaznaczanie oraz oba motywy i małe ekrany', {timeout:60000}, async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'center-catalog-layout-'));
 const server=await createCenter({dataDir:dir});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge'});const page=await browser.newPage({viewport:{width:1900,height:1000}});
  const errors=[];let writes=0;page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',route=>{if(route.request().method()!=='GET'){writes++;return route.abort();}return route.continue();});
  await page.goto(`http://127.0.0.1:${server.address().port}/#tests`);
  await expect(page.locator('.catalog-table tbody tr')).toHaveCount(40);
  await expect(page.locator('.catalog-row-actions .qa-guide-button').first()).toBeVisible();
  const title=await page.locator('.catalog-title').first().innerText();
  await page.locator('.catalog-title').first().click();await expect(page.locator('#modal')).toBeVisible();await expect(page.locator('#dialog-title')).toHaveText(title);await page.locator('#cancel').click();
  await page.locator('.catalog-row-actions .qa-guide-button').first().click();await expect(page.locator('.qa-guide-dialog')).toBeVisible();await page.keyboard.press('Escape');
  await page.locator('[data-edit-scenario]').first().click();await expect(page.locator('.scenario-editor-dialog')).toBeVisible();await page.keyboard.press('Escape');
  await page.locator('[data-select]').first().check();await expect(page.locator('#save-suite')).toBeEnabled();
  await expect(page.locator('[data-select]').first()).toBeChecked();
  await page.locator('#project-filter').selectOption('octopus');await expect(page.locator('.catalog-project-name').first()).toHaveText('Octopus');
  await page.locator('#project-filter').selectOption('cms');
  for(const theme of ['light','dark']){
   await page.locator('#qa-theme-mode').selectOption(theme);
   await page.waitForTimeout(250);
   for(const width of [1900,1440,1024,390]){
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,theme+' '+width);
    const row=page.locator('.catalog-table tbody tr').first();
    if(width>=1440)assert((await row.boundingBox()).height<160,'Wiersz ma pozostać zwarty');
    await expect(row.locator('[data-check-test]')).toBeVisible();
    if(width===390)await row.scrollIntoViewIfNeeded();
    if(width===1900||width===390)await page.screenshot({path:`outputs/center-catalog-${theme}-${width}.png`});
   }
  }
  await page.locator('#search').fill('NIEISTNIEJACY_SCENARIUSZ_123');await expect(page.locator('.catalog-table-wrap')).toContainText('Brak testów pasujących do filtrów');
  assert.equal(writes,0);assert.deepEqual(errors,[]);
 }finally{
  await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));
  if(path.dirname(dir)!==path.resolve(tmpdir())||!path.basename(dir).startsWith('center-catalog-layout-'))throw Error('Niepoprawny katalog testowy');
  await rm(dir,{recursive:true,force:true});
 }
});
