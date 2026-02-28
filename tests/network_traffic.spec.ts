import { test, expect, Page } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test.describe('Network Traffic Analysis', () => {
  let engine: PrimalEngine;
  let page: Page;

  const validConfig: SiteConfig = {
    name: 'Traffic Test Site',
    url: 'http://localhost:3000',
  };

  test.beforeEach(async ({ page: p }) => {
    page = p;
    engine = new PrimalEngine(page);
  });

  test('should detect slow requests and large payloads without failing if failOnIssues is false', async () => {
    const config: SiteConfig = {
      ...validConfig,
      networkTrafficConfig: {
        enabled: true,
        slowRequestThreshold: 50, // ms
        largePayloadThreshold: 100, // bytes
        failOnIssues: false,
      },
    };

    await page.route(config.url, async (route) => {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));
      // Simulate large payload
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: 'a'.repeat(200),
      });
    });

    // Should not throw
    await engine.run(config, ExecutionMode.READ_ONLY);
  });

  test('should fail if slow requests are detected and failOnIssues is true', async () => {
    const config: SiteConfig = {
      ...validConfig,
      networkTrafficConfig: {
        enabled: true,
        slowRequestThreshold: 50, // ms
        failOnIssues: true,
      },
    };

    await page.route(config.url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><script src="/slow.js"></script>ok</body></html>',
      });
    });

    await page.route('**/slow.js', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.fulfill({ status: 200, body: 'console.log("slow");', contentType: 'application/javascript' });
    });

    // Wait for the script to load completely. We need to wait for `requestfinished`, not just response.
    const runPromise = engine.run(config, ExecutionMode.READ_ONLY);
    await page.waitForEvent('requestfinished', req => req.url().includes('slow.js'));

    await expect(runPromise).rejects.toThrow(/Network Traffic Issues Detected/);
  });

  test('should fail if large payloads are detected and failOnIssues is true', async () => {
    const config: SiteConfig = {
      ...validConfig,
      networkTrafficConfig: {
        enabled: true,
        largePayloadThreshold: 100, // bytes
        failOnIssues: true,
      },
    };

    await page.route(config.url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: 'a'.repeat(200),
      });
    });

    await expect(engine.run(config, ExecutionMode.READ_ONLY)).rejects.toThrow(/Network Traffic Issues Detected/);
  });
});
