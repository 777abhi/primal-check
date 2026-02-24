import { test, expect } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test.describe('Scroll & Explore', () => {
  test('should scroll to trigger lazy loading and interact with new elements in GORILLA mode', async ({ page }) => {
    // Setup page content with a sentinel for lazy loading
    await page.route('**/scroll-test', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body style="height: 3000px; position: relative;">
              <div id="content">
                <h1>Scroll down to load more</h1>
              </div>
              <div id="sentinel" style="position: absolute; top: 2500px; height: 10px; width: 100%; background: red;"></div>
              <script>
                const observer = new IntersectionObserver((entries) => {
                  entries.forEach(entry => {
                    if (entry.isIntersecting) {
                      const btn = document.createElement('button');
                      btn.id = 'lazy-btn';
                      btn.textContent = 'Lazy Button';
                      btn.onclick = () => btn.textContent = 'Clicked';
                      // Style it to be visible near the sentinel
                      btn.style.position = 'absolute';
                      btn.style.top = '2600px';
                      document.body.appendChild(btn);
                      observer.disconnect();
                    }
                  });
                });
                observer.observe(document.getElementById('sentinel'));
              </script>
            </body>
          </html>
        `
      });
    });

    const engine = new PrimalEngine(page);
    const config: SiteConfig = {
      name: 'Scroll Test',
      url: 'http://localhost/scroll-test',
      screenshotConfig: { enabled: false }
    };

    // Run in GORILLA mode
    await engine.run(config, ExecutionMode.GORILLA);

    // Assert that the lazy loaded button exists and was clicked
    // Note: PrimalEngine clicks a random button. Since this is the only one (hopefully), it should click it.
    // However, if there are other buttons/links (none in my HTML), it's deterministic.
    const btn = page.locator('#lazy-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Clicked');
  });
});
