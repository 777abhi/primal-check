import { test, expect } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test.describe('DOM Checkpoint', () => {
  test('should restore DOM when a destructive interaction removes the body content', async ({ page }) => {
    await page.route('http://localhost:3000/dom-destroyer', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <head><title>DOM Destroyer</title></head>
            <body>
              <h1 id="the-heading">Welcome to the DOM Destroyer</h1>
              <button id="destroy-btn" onclick="document.body.innerHTML = ''">Click me to destroy</button>
            </body>
          </html>
        `
      });
    });

    const config: SiteConfig = {
      name: 'DOM Destroyer Test',
      url: 'http://localhost:3000/dom-destroyer',
      smartNavigationConfig: {
        enabled: true,
        steps: 1
      },
      domCheckpointConfig: {
        enabled: true
      }
    };

    const engine = new PrimalEngine(page);
    await engine.run(config, ExecutionMode.GORILLA);

    // After GORILLA mode, the body should be visible thanks to checkpointing,
    // since the button click destroyed the body.
    const h1Visible = await page.isVisible('#the-heading');
    expect(h1Visible).toBe(true);
  });
});
