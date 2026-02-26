import { test, expect } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';
import * as path from 'path';

test.describe('Accessibility Check', () => {
  test('should detect accessibility violations in READ_ONLY mode', async ({ page }) => {
    const engine = new PrimalEngine(page);
    // Use absolute path for file URL
    const fixturePath = path.resolve(__dirname, 'fixtures/a11y-fail.html');
    const url = `file://${fixturePath}`;

    const config: SiteConfig = {
      name: 'A11y Fail',
      url: url,
      accessibilityConfig: {
        enabled: true,
        failOnViolation: true
      }
    };

    // Expect the engine to throw an error with details about violations
    await expect(engine.run(config, ExecutionMode.READ_ONLY)).rejects.toThrow(/Accessibility violations detected/);
  });
});
