import { test, expect, Page } from '@playwright/test';
import { PrimalEngine } from '../src/PrimalEngine';
import { SiteConfig, ExecutionMode } from '../src/types';

test.describe('PrimalEngine - Form Fuzzing (GORILLA Mode)', () => {
  let engine: PrimalEngine;
  let page: Page;

  const validConfig: SiteConfig = {
    name: 'Form Test Site',
    url: 'http://localhost:3000',
  };

  test.beforeEach(async ({ page: p }) => {
    page = p;
    engine = new PrimalEngine(page);
  });

  test('should fill visible input fields in GORILLA mode', async () => {
    await page.route(validConfig.url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <form>
                <input type="text" id="name" />
                <input type="email" id="email" />
                <textarea id="message"></textarea>
                <select id="country">
                  <option value="us">US</option>
                  <option value="uk">UK</option>
                </select>
              </form>
            </body>
          </html>
        `,
      });
    });

    await engine.run(validConfig, ExecutionMode.GORILLA);

    // Assertions
    const nameValue = await page.inputValue('#name');
    expect(nameValue).not.toBe('');

    const emailValue = await page.inputValue('#email');
    expect(emailValue).not.toBe('');

    const messageValue = await page.inputValue('#message');
    expect(messageValue).not.toBe('');

    // Select verification is tricky if default is already selected.
    // But we'll assume fuzzer might change it or pick one.
    // If it picks the same one, test might pass falsely if we don't check for change.
    // But for "fuzzing", just ensuring it's not empty/invalid state is a start.
    // Let's stick to text inputs for the failing test to be clear.
  });
});
