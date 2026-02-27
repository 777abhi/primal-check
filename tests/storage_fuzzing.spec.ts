import { test, expect, Page } from '@playwright/test';
import { PrimalEngine } from '../src/PrimalEngine';
import { SiteConfig, ExecutionMode } from '../src/types';

test.describe('PrimalEngine - Storage Fuzzing (GORILLA Mode)', () => {
  let engine: PrimalEngine;
  let page: Page;

  const fuzzConfig: SiteConfig = {
    name: 'Storage Fuzz Site',
    url: 'http://localhost:3000',
    storageFuzzingConfig: {
      enabled: true,
    },
  };

  test.beforeEach(async ({ page: p }) => {
    page = p;
    engine = new PrimalEngine(page);
  });

  test('should fuzz cookies and local storage', async () => {
    // 1. Setup initial state
    await page.context().addCookies([
      {
        name: 'session_id',
        value: 'secret_token_123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.route(fuzzConfig.url, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<html><body><h1>Storage Test</h1></body></html>'
        });
    });

    await page.goto(fuzzConfig.url);

    await page.evaluate(() => {
      localStorage.setItem('user_preference', 'dark_mode');
    });

    // 2. Run Engine
    // Note: TypeScript will complain here because storageFuzzingConfig is not in SiteConfig yet.
    // We suppress the error for now to allow "TDD" style or just let it fail build.
    // Since I'm in a strict environment, I might need to cast to any to make it run
    // but fail logic, OR I accept that "failing test" means "failing compilation" in this step.
    // However, the prompt says "Test: Write a failing test first."
    // If I cannot run the test because of compilation error, I can't really "run" it.
    // But usually in TS, adding a property that doesn't exist is a compilation error.
    // I will cast it to any to bypass TS check and fail on runtime logic (property ignored)
    // or fail on the fact that nothing happens.

    await engine.run(fuzzConfig as any, ExecutionMode.GORILLA);

    // 3. Assertions
    // We expect EITHER the cookie to be changed/gone OR the local storage to be changed/gone.
    // Since it's random, checking for *any* change is safer if we implement it to be aggressive.
    // But for a single run, randomness might result in no change if we are not careful?
    // The plan says "Randomly clear or mutate".
    // I should probably mock Math.random to ensure deterministic behavior for the test?
    // Or I check if at least one of them is different/missing.

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session_id');

    const localStorageVal = await page.evaluate(() => localStorage.getItem('user_preference'));

    const cookieChanged = !sessionCookie || sessionCookie.value !== 'secret_token_123';
    const storageChanged = localStorageVal !== 'dark_mode';

    console.log('Cookie changed:', cookieChanged);
    console.log('Storage changed:', storageChanged);

    // If nothing is implemented yet, both will remain same.
    expect(cookieChanged || storageChanged).toBe(true);
  });
});
