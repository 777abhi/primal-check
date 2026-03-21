import { test, expect } from '@playwright/test';
import { PrimalEngine } from '../src/PrimalEngine';
import { ExecutionMode, SiteConfig } from '../src/types';
import * as http from 'http';

test.describe('Threat Intelligence Integration', () => {
  let feedServer: http.Server;
  const feedPort = 3005;
  const payloads = ["<script>alert('threat')</script>", "' OR 1=1 -- THREAT"];

  test.beforeAll(async () => {
    feedServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payloads));
    });
    await new Promise<void>((resolve) => feedServer.listen(feedPort, resolve));
  });

  test.afterAll(() => {
    feedServer.close();
  });

  test('should fetch threat payloads and inject them in GORILLA mode', async ({ page }) => {
    const config: SiteConfig = {
      name: 'Threat Test',
      url: 'http://localhost:3000/form',
      threatIntelligenceConfig: {
        enabled: true,
        feedUrls: [`http://localhost:${feedPort}/feed.json`]
      }
    };

    await page.route(config.url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html><body>
            <form>
              <input type="text" id="test-input" name="test">
              <input type="text" id="test-input2" name="test2">
              <input type="text" id="test-input3" name="test3">
              <input type="text" id="test-input4" name="test4">
              <input type="text" id="test-input5" name="test5">
              <input type="text" id="test-input6" name="test6">
            </form>
          </body></html>
        `,
      });
    });

    const engine = new PrimalEngine(page);
    await engine.run(config, ExecutionMode.GORILLA);

    // Get all filled values from inputs
    const values = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        return Array.from(inputs).map((i: any) => i.value);
    });

    // Check if at least one of the inputs got filled with a threat payload
    const foundThreat = values.some(v => payloads.includes(v));
    expect(foundThreat).toBe(true);
  });
});
