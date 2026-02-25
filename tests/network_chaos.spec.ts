import { test, expect } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test('Network Chaos: Offline mode should fail navigation', async ({ page }) => {
  const engine = new PrimalEngine(page);

  const config: SiteConfig = {
    name: 'Chaos Test',
    url: 'http://example.com',
    screenshotConfig: { enabled: false },
    networkChaosConfig: {
      enabled: true,
      offline: true
    }
  };

  // We expect the run to fail because we are simulating offline mode.
  await expect(engine.run(config, ExecutionMode.GORILLA)).rejects.toThrow();
});
