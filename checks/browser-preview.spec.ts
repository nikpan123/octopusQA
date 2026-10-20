import {test,expect} from '../shared/browser-preview';
import {readPreviewPosition} from '../shared/preview-position.cjs';

for(const marker of ['Pierwszy test','Drugi równoległy test']){
  test(marker+' — podgląd nazwy, kroków i nawigacji',async({page,context},testInfo)=>{
    await context.route('http://preview-check.test/**',route=>route.fulfill({contentType:'text/html',body:'<h1>Strona kontrolna</h1><input aria-label="Haslo" type="password"><button id="under" style="position:fixed;right:24px;top:88px;width:100px;height:20px" onclick="this.dataset.clicked=\'true\'">Przycisk</button>'}));
    await page.goto('http://preview-check.test/start');
    await test.step('Sprawdzenie nakładki '+marker,async()=>{
      const overlay=page.locator('#qa-test-preview');
      await expect(overlay).toHaveAttribute('data-test-title',new RegExp(marker));
      await expect(overlay).toHaveAttribute('data-step','Sprawdzenie nakładki '+marker);
      await expect(overlay).toHaveAttribute('data-test-index',marker==='Pierwszy test'?'1':'2');
      await expect(overlay).toHaveAttribute('data-total-tests','3');
      if(testInfo.config.workers===1&&marker==='Drugi równoległy test'){
        const saved=await readPreviewPosition(String(testInfo.config.metadata.qaBrowserPreviewPositionFile));
        expect(saved).not.toBeNull();const restored=(await overlay.boundingBox())!;
        expect(Math.abs(restored.x-saved!.left)).toBeLessThan(2);
        expect(Math.abs(restored.y-saved!.top)).toBeLessThan(35);
      }
      // Zamknięty Shadow DOM nie dodaje tekstów do selektorów aplikacji.
      await expect(page.getByRole('heading')).toHaveCount(1);
      await page.locator('#under').click();
      await expect(page.locator('#under')).toHaveAttribute('data-clicked','true');
      const before=(await overlay.boundingBox())!;
      await page.mouse.move(before.x+20,before.y+20);await page.mouse.down();
      await page.mouse.move(before.x>300?60:620,before.y>300?120:500,{steps:10});await page.mouse.up();
      const moved=(await overlay.boundingBox())!;
      expect(Math.abs(moved.y-before.y)).toBeGreaterThan(200);expect(Math.abs(moved.x-before.x)).toBeGreaterThan(100);
      expect(moved.x).toBeGreaterThanOrEqual(0);
      await expect(overlay).toHaveAttribute('data-position-saved','true');
      if(marker==='Pierwszy test')await page.screenshot({path:testInfo.outputPath('nakladka.png')});
      await page.getByLabel('Haslo').fill('qa-never-show-this-password');
      await expect(overlay).not.toHaveAttribute('data-action',/qa-never-show/);
    });
    await test.step('Nowa strona '+marker,async()=>{
      const previous=(await page.locator('#qa-test-preview').boundingBox())!;
      await page.goto('http://preview-check.test/next');
      await expect(page.locator('#qa-test-preview')).toHaveAttribute('data-step','Nowa strona '+marker);
      const restored=(await page.locator('#qa-test-preview').boundingBox())!;
      expect(Math.abs(restored.x-previous.x)).toBeLessThan(2);
      expect(Math.abs(restored.y-previous.y)).toBeLessThan(35);
      const popup=await context.newPage();await popup.goto('http://preview-check.test/popup');
      await expect(popup.locator('#qa-test-preview')).toHaveAttribute('data-test-title',new RegExp(marker));
      await expect(popup.locator('#qa-test-preview')).toHaveAttribute('data-step','Nowa strona '+marker);
      const popupPosition=(await popup.locator('#qa-test-preview').boundingBox())!;
      expect(Math.abs(popupPosition.x-restored.x)).toBeLessThan(2);
      expect(Math.abs(popupPosition.y-restored.y)).toBeLessThan(35);
      await popup.close();
    });
  });
}
test.describe('Zwykłe wykonanie bez nakładki',()=>{
  test.use({qaBrowserPreview:false});
  test('wyłączony podgląd nie dodaje elementów',async({page})=>{
    await page.goto('data:text/html,<h1>Bez podgladu</h1>');
    await expect(page.locator('#qa-test-preview')).toHaveCount(0);
  });
});
