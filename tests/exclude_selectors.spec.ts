import { test, expect, Page } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test.describe('Exclude Selectors (GORILLA Mode)', () => {
  let engine: PrimalEngine;

  test.beforeEach(async ({ page }) => {
    engine = new PrimalEngine(page);

    // Set up a dummy page with both safe and danger elements
    await page.route('**/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <body>
              <button id="safe-btn" onclick="document.body.dataset.safeClicked = 'true'">Safe Button</button>
              <button id="danger-btn" onclick="document.body.dataset.dangerClicked = 'true'">Danger Button</button>

              <input type="text" id="safe-input" name="safe">
              <input type="text" id="danger-input" name="danger">

              <!-- Dummy elements for smart navigation to find enough targets to ensure the interactions happen enough times -->
              <a href="#">Link 1</a><a href="#">Link 2</a><a href="#">Link 3</a>
            </body>
          </html>
        `
      });
    });
  });

  test('should not interact with excluded elements', async ({ page }) => {
    const config: SiteConfig = {
      name: 'Exclude Selectors Test',
      url: 'http://dummy.local',
      smartNavigationConfig: {
        enabled: true,
        steps: 10 // Increase steps to ensure probability of hitting the danger button if it wasn't excluded
      },
      excludeSelectors: ['#danger-btn', '#danger-input']
    };

    await engine.run(config, ExecutionMode.GORILLA);

    // Verify the safe button might have been clicked, but the danger button definitely wasn't
    const dangerClicked = await page.evaluate(() => document.body.dataset.dangerClicked);
    expect(dangerClicked).toBeUndefined();

    // Verify the danger input wasn't fuzzed
    const dangerInputValue = await page.locator('#danger-input').inputValue();
    expect(dangerInputValue).toBe('');
  });
});
