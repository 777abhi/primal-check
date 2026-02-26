import { Page } from '@playwright/test';
import { SiteConfig, ExecutionMode, NetworkChaosConfig, AccessibilityConfig } from './types';
import { ChaosFuzzer } from './ChaosFuzzer';
import * as path from 'path';
import AxeBuilder from '@axe-core/playwright';

export { SiteConfig, ExecutionMode, ScreenshotConfig, NetworkChaosConfig, AccessibilityConfig } from './types';

export class PrimalEngine {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async run(config: SiteConfig, mode: ExecutionMode): Promise<void> {
    const errors: Error[] = [];
    const errorListener = (exception: Error) => {
      errors.push(exception);
    };

    // Monitor console for pageerror events in READ_ONLY mode
    if (mode === ExecutionMode.READ_ONLY) {
      this.page.on('pageerror', errorListener);
    }

    let success = false;
    try {
      if (mode === ExecutionMode.GORILLA && config.networkChaosConfig?.enabled) {
        await this.applyNetworkChaos(config.networkChaosConfig);
      }

      // Navigation
      try {
        await this.page.goto(config.url);
      } catch (error) {
        throw new Error(`Navigation failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (mode === ExecutionMode.READ_ONLY) {
        await this.runReadOnly(config, errors);
      } else if (mode === ExecutionMode.GORILLA) {
        await this.runGorilla();
      }
      success = true;
    } finally {
      // Cleanup listener
      if (mode === ExecutionMode.READ_ONLY) {
        this.page.off('pageerror', errorListener);
      }

      if (config.screenshotConfig && config.screenshotConfig.enabled) {
        const shouldCapture = (success && config.screenshotConfig.onSuccess) || (!success && config.screenshotConfig.onFailure);
        if (shouldCapture) {
          await this.captureScreenshot(config, mode, success);
        }
      }
    }
  }

  private async captureScreenshot(config: SiteConfig, mode: ExecutionMode, success: boolean): Promise<void> {
    const dir = config.screenshotConfig?.directory || './screenshots';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const status = success ? 'success' : 'failure';
    // Sanitize name
    const sanitizedName = config.name.replace(/[^a-z0-9]/gi, '_');
    const filename = `${sanitizedName}-${mode}-${status}-${timestamp}.png`;

    // Construct full path. Note: Playwright handles directory creation.
    const fullPath = path.join(dir, filename);

    try {
        await this.page.screenshot({ path: fullPath, fullPage: true });
    } catch (e) {
        console.warn(`Failed to capture screenshot:`, e);
    }
  }

  private async runReadOnly(config: SiteConfig, errors: Error[]): Promise<void> {
    // Check body visibility
    const bodyVisible = await this.page.isVisible('body');
    if (!bodyVisible) {
      throw new Error('Body is not visible on the page.');
    }

    // Check accessibility if enabled
    if (config.accessibilityConfig && config.accessibilityConfig.enabled) {
      await this.checkAccessibility(config.accessibilityConfig);
    }

    // Check if any errors were caught
    if (errors.length > 0) {
      throw new Error(`Console errors detected: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  private async checkAccessibility(config: AccessibilityConfig): Promise<void> {
    try {
      const results = await new AxeBuilder({ page: this.page }).analyze();

      if (results.violations.length > 0) {
        const violationDetails = results.violations.map(v => {
          return `${v.id} (${v.impact}): ${v.description} - Nodes: ${v.nodes.length}`;
        }).join('\n');

        const message = `Accessibility violations detected:\n${violationDetails}`;

        // Log the violations
        console.warn(message);

        if (config.failOnViolation) {
          throw new Error(message);
        }
      }
    } catch (e) {
      // Re-throw if it's the error we just threw, otherwise wrap or log?
      // If it is the violation error, we want it to propagate.
      if (e instanceof Error && e.message.startsWith('Accessibility violations detected')) {
        throw e;
      }
      // If Axe fails for some reason
      console.error('Accessibility check failed to run:', e);
      throw new Error(`Accessibility check failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private async applyNetworkChaos(chaos: NetworkChaosConfig): Promise<void> {
    if (chaos.offline) {
      await this.page.context().setOffline(true);
    }

    if ((chaos.latency && chaos.latency > 0) || (chaos.requestFailureRate && chaos.requestFailureRate > 0)) {
      await this.page.route('**/*', async (route) => {
        // Random failure
        if (chaos.requestFailureRate && Math.random() < chaos.requestFailureRate) {
          try {
            await route.abort();
            return;
          } catch (e) {
            // Ignore abort errors
          }
        }

        // Latency
        if (chaos.latency && chaos.latency > 0) {
          await new Promise(resolve => setTimeout(resolve, chaos.latency));
        }

        try {
          await route.continue();
        } catch (e) {
          // Ignore continue errors
        }
      });
    }
  }

  private async runGorilla(): Promise<void> {
    await this.scrollAndExplore();
    await this.fuzzForms();

    // Randomised interaction: Click the first available visible button or link
    const interactables = this.page.locator('button:visible, a:visible');
    const count = await interactables.count();

    if (count > 0) {
      // Pick a random index
      const randomIndex = Math.floor(Math.random() * count);
      await interactables.nth(randomIndex).click();
    } else {
      console.warn('No visible buttons or links found to interact with.');
    }
  }

  private async fuzzForms(): Promise<void> {
    const inputs = this.page.locator('input:visible, textarea:visible, select:visible');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      await ChaosFuzzer.fuzzInput(input);
    }
  }

  /**
   * Scrolls the page to the bottom to trigger lazy loading and reveal hidden elements.
   * This is crucial for GORILLA mode to discover more interactable elements.
   */
  private async scrollAndExplore(): Promise<void> {
    try {
      await this.page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          const distance = 100; // Pixels to scroll per step
          const delay = 50;     // Milliseconds between steps
          const maxScrolls = 500; // Safety limit (~50000px height)
          let scrolls = 0;

          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            scrolls++;

            // Check if we reached the bottom (with small tolerance) or hit the safety limit
            if ((window.innerHeight + window.scrollY) >= scrollHeight - 5 || scrolls >= maxScrolls) {
              clearInterval(timer);
              resolve();
            }
          }, delay);
        });
      });
    } catch (e) {
      console.warn('Scroll interaction failed:', e);
    }
  }
}
