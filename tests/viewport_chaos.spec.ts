import { test, expect, Page } from '@playwright/test';
import { PrimalEngine } from '../src/PrimalEngine';
import { SiteConfig, ExecutionMode } from '../src/types';

test.describe('Viewport Chaos', () => {
  let engine: PrimalEngine;
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    engine = new PrimalEngine(page);
  });

  test('should trigger a resize event in GORILLA mode when enabled', async () => {
    const config: SiteConfig = {
      name: 'Viewport Test Site',
      url: 'http://localhost:3000',
      viewportChaosConfig: {
        enabled: true
      }
    };

    await page.route(config.url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <script>
                window.resizeCount = 0;
                window.addEventListener('resize', () => {
                  window.resizeCount++;
                });
              </script>
              <h1>Viewport Test</h1>
            </body>
          </html>
        `,
      });
    });

    await engine.run(config, ExecutionMode.GORILLA);

    const resizeCount = await page.evaluate(() => (window as any).resizeCount);
    expect(resizeCount).toBeGreaterThan(0);
  });
});
