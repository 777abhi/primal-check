import { test, expect } from '@playwright/test';
import { PrimalEngine, ExecutionMode } from '../src/PrimalEngine';

test.describe('Exploratory Navigation', () => {
  test('should prioritize unvisited elements when strategy is exploratory', async ({ page }) => {
    const engine = new PrimalEngine(page);
    await engine.run({
      name: 'Exploratory Test',
      url: 'data:text/html,' + encodeURIComponent(`
        <html>
          <body>
            <button id="btn1" onclick="window.clickedBtn1 = true">Button 1</button>
            <button id="btn2" onclick="window.clickedBtn2 = true">Button 2</button>
            <button id="btn3" onclick="window.clickedBtn3 = true">Button 3</button>
          </body>
        </html>
      `),
      smartNavigationConfig: {
        enabled: true,
        steps: 3,
        strategy: 'exploratory'
      }
    }, ExecutionMode.GORILLA);

    const btn1Clicked = await page.evaluate(() => (window as any).clickedBtn1);
    const btn2Clicked = await page.evaluate(() => (window as any).clickedBtn2);
    const btn3Clicked = await page.evaluate(() => (window as any).clickedBtn3);

    expect(btn1Clicked).toBe(true);
    expect(btn2Clicked).toBe(true);
    expect(btn3Clicked).toBe(true);
  });
});
