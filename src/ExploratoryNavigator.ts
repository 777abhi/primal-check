import { Page, Locator } from '@playwright/test';
import { SiteConfig } from './types';

export class ExploratoryNavigator {
  private page: Page;
  private visitedLocators: Set<string>;

  constructor(page: Page) {
    this.page = page;
    this.visitedLocators = new Set();
  }

  async performExploratoryInteractions(steps: number, config: SiteConfig): Promise<void> {
    const excludeSelectors = config.excludeSelectors;
    const checkpointEnabled = config.domCheckpointConfig?.enabled;

    for (let i = 0; i < steps; i++) {
      let checkpoint: string | null = null;
      if (checkpointEnabled) {
        try {
          checkpoint = await this.page.content();
        } catch (e) {
          console.warn('Failed to capture DOM checkpoint:', e);
        }
      }

      let locatorString = 'button:visible, a:visible';
      if (excludeSelectors && excludeSelectors.length > 0) {
        const exclusions = `:not(${excludeSelectors.join(', ')})`;
        locatorString = `button:visible${exclusions}, a:visible${exclusions}`;
      }

      const interactables = this.page.locator(locatorString);
      const count = await interactables.count();

      if (count > 0) {
        // Collect locators and their HTML representation to uniquely identify them
        const unvisitedIndices: number[] = [];
        for (let j = 0; j < count; j++) {
          try {
            const html = await interactables.nth(j).evaluate((el) => el.outerHTML);
            if (!this.visitedLocators.has(html)) {
              unvisitedIndices.push(j);
            }
          } catch {
            // Element might be detached, ignore it
          }
        }

        let targetIndex: number;
        if (unvisitedIndices.length > 0) {
          // Prioritize unvisited elements
          const randomUnvisitedIndex = Math.floor(Math.random() * unvisitedIndices.length);
          targetIndex = unvisitedIndices[randomUnvisitedIndex];
        } else {
          // Fallback to purely random if all are visited
          targetIndex = Math.floor(Math.random() * count);
        }

        try {
          const target = interactables.nth(targetIndex);
          const html = await target.evaluate((el) => el.outerHTML);
          this.visitedLocators.add(html);

          await target.click();
          await this.page.waitForLoadState('networkidle').catch(() => {});

          if (checkpointEnabled && checkpoint) {
             const bodyVisible = await this.page.isVisible('body');
             if (!bodyVisible) {
               throw new Error('Body is no longer visible after interaction.');
             }
          }
        } catch (e) {
          console.warn('Failed to click interactable or maintain DOM state:', e);
          if (checkpointEnabled && checkpoint) {
            console.warn('Restoring DOM from checkpoint...');
            try {
              await this.page.setContent(checkpoint);
              await this.page.waitForLoadState('networkidle').catch(() => {});
            } catch (restoreError) {
              console.warn('Failed to restore DOM from checkpoint:', restoreError);
            }
          }
        }
      } else {
        console.warn('No visible buttons or links found to interact with.');
        break;
      }
    }
  }
}
