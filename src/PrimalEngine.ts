import { Page } from '@playwright/test';
import { SiteConfig, ExecutionMode } from './types';

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

    try {
      // Navigation
      try {
        await this.page.goto(config.url);
      } catch (error) {
        throw new Error(`Navigation failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (mode === ExecutionMode.READ_ONLY) {
        await this.runReadOnly(errors);
      } else if (mode === ExecutionMode.GORILLA) {
        await this.runGorilla();
      }
    } finally {
      // Cleanup listener
      if (mode === ExecutionMode.READ_ONLY) {
        this.page.off('pageerror', errorListener);
      }
    }
  }

  private async runReadOnly(errors: Error[]): Promise<void> {
    // Check body visibility
    const bodyVisible = await this.page.isVisible('body');
    if (!bodyVisible) {
      throw new Error('Body is not visible on the page.');
    }

    // Check if any errors were caught
    if (errors.length > 0) {
      throw new Error(`Console errors detected: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  private async runGorilla(): Promise<void> {
    // Randomised interaction: Click the first available visible button or link
    // "randomised interaction" could imply picking a random element.
    // But "clicking the first available" is the example.
    // I will pick a random one from the available ones to be "randomised".

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
}
