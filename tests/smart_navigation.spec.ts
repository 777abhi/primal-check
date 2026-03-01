import { test, expect, Page } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test.describe('Smart Navigation', () => {
  let engine: PrimalEngine;
  let page: Page;

  const validConfig: SiteConfig = {
    name: 'Test Site',
    url: 'http://localhost:3000',
    smartNavigationConfig: {
      enabled: true,
      steps: 3
    }
  };

  test.beforeEach(async ({ page: p }) => {
    page = p;
    engine = new PrimalEngine(page);
  });

  test('should perform multiple interactions when configured', async () => {
    await page.route(validConfig.url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <button id="btn1" onclick="window.clickCount = (window.clickCount || 0) + 1">Button 1</button>
            </body>
          </html>
        `,
      });
    });

    await engine.run(validConfig, ExecutionMode.GORILLA);

    const clickCount = await page.evaluate(() => (window as any).clickCount);
    expect(clickCount).toBe(3);
  });
});
