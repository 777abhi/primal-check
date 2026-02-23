import { test, expect, Page } from '@playwright/test';
import { PrimalEngine, SiteConfig, ExecutionMode } from '../src/PrimalEngine';

test.describe('PrimalEngine - Visual Verification', () => {
  let engine: PrimalEngine;
  let page: Page;

  const baseConfig: SiteConfig = {
    name: 'Visual Test Site',
    url: 'http://localhost:3000',
  };

  test.beforeEach(async ({ page: p }) => {
    page = p;
    engine = new PrimalEngine(page);
  });

  test('should capture screenshot on success when configured', async () => {
    let screenshotCalled = false;
    await page.route(baseConfig.url, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body><h1>Success</h1></body></html>',
        });
    });

    const originalScreenshot = page.screenshot.bind(page);
    // @ts-ignore
    page.screenshot = async (options) => {
        screenshotCalled = true;
        return Buffer.from('');
    };

    const config: SiteConfig = {
        ...baseConfig,
        screenshotConfig: {
            enabled: true,
            onSuccess: true,
            onFailure: false,
            directory: './screenshots-test'
        }
    };

    await engine.run(config, ExecutionMode.READ_ONLY);

    expect(screenshotCalled).toBe(true);

    page.screenshot = originalScreenshot;
  });

  test('should capture screenshot on failure when configured', async () => {
    let screenshotCalled = false;
    const originalScreenshot = page.screenshot.bind(page);
    // @ts-ignore
    page.screenshot = async (options) => {
        screenshotCalled = true;
        return Buffer.from('');
    };

    const config: SiteConfig = {
        ...baseConfig,
        url: 'http://invalid-url-for-screenshot.com',
        screenshotConfig: {
            enabled: true,
            onSuccess: false,
            onFailure: true,
            directory: './screenshots-test'
        }
    };

    await page.route(config.url, route => route.abort());

    try {
        await engine.run(config, ExecutionMode.READ_ONLY);
    } catch (e) {
        // Expected error
    }

    expect(screenshotCalled).toBe(true);

    page.screenshot = originalScreenshot;
  });

  test('should not capture screenshot if disabled', async () => {
    let screenshotCalled = false;
    const originalScreenshot = page.screenshot.bind(page);
    // @ts-ignore
    page.screenshot = async (options) => {
        screenshotCalled = true;
        return Buffer.from('');
    };

    const config: SiteConfig = {
        ...baseConfig,
        screenshotConfig: {
            enabled: false,
            onSuccess: true,
            onFailure: true,
            directory: './screenshots-test'
        }
    };

    await page.route(baseConfig.url, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body><h1>Success</h1></body></html>',
        });
    });

    await engine.run(config, ExecutionMode.READ_ONLY);

    expect(screenshotCalled).toBe(false);
    page.screenshot = originalScreenshot;
  });
});
