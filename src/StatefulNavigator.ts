import { Page } from '@playwright/test';
import { SiteConfig } from './types';

export class StatefulNavigator {
  private page: Page;
  private transitionMatrix: Record<string, Record<string, number>>;
  private currentState: string | null;

  constructor(page: Page) {
    this.page = page;
    this.transitionMatrix = {};
    this.currentState = null;
  }

  private async captureState(): Promise<string> {
    // For simplicity, we define a state by its URL path + hash
    // In more complex implementations, this could be a DOM skeleton hash
    return await this.page.evaluate(() => window.location.pathname + window.location.hash);
  }

  async performStatefulInteractions(steps: number, config: SiteConfig): Promise<void> {
    const excludeSelectors = config.excludeSelectors;
    const checkpointEnabled = config.domCheckpointConfig?.enabled;

    this.currentState = await this.captureState();
    if (!this.transitionMatrix[this.currentState]) {
      this.transitionMatrix[this.currentState] = {};
    }

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
        // We track which specific locators we click from this state to avoid repeating identical clicks
        // and force exploration of new edges in the state graph.
        const stateEdges = this.transitionMatrix[this.currentState] || {};

        let targetIndex = -1;
        let unvisitedIndices: number[] = [];

        // Find locators we haven't clicked yet from this state
        for (let j = 0; j < count; j++) {
           try {
             const html = await interactables.nth(j).evaluate((el) => el.outerHTML);
             if (!stateEdges[html]) {
               unvisitedIndices.push(j);
             }
           } catch {
             // Detached
           }
        }

        let clickedHtml = "";
        if (unvisitedIndices.length > 0) {
           targetIndex = unvisitedIndices[Math.floor(Math.random() * unvisitedIndices.length)];
        } else {
           // All visited, pick one with the lowest transition count
           let minClicks = Infinity;
           let candidateIndices: number[] = [];
           for (let j = 0; j < count; j++) {
             try {
                const html = await interactables.nth(j).evaluate((el) => el.outerHTML);
                const clicks = stateEdges[html] || 0;
                if (clicks < minClicks) {
                  minClicks = clicks;
                  candidateIndices = [j];
                } else if (clicks === minClicks) {
                  candidateIndices.push(j);
                }
             } catch {}
           }
           if (candidateIndices.length > 0) {
             targetIndex = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
           } else {
             targetIndex = Math.floor(Math.random() * count);
           }
        }

        try {
          const targetLocator = interactables.nth(targetIndex);
          clickedHtml = await targetLocator.evaluate((el) => el.outerHTML).catch(() => "unknown");
          await targetLocator.click();
          await this.page.waitForLoadState('networkidle').catch(() => {});

          if (checkpointEnabled && checkpoint) {
             const bodyVisible = await this.page.isVisible('body');
             if (!bodyVisible) {
               throw new Error('Body is no longer visible after interaction.');
             }
          }

          const newState = await this.captureState();

          // We record the edge we took from currentState
          if (this.currentState) {
             if (!this.transitionMatrix[this.currentState]) {
                 this.transitionMatrix[this.currentState] = {};
             }
             if (!this.transitionMatrix[this.currentState][clickedHtml]) {
                 this.transitionMatrix[this.currentState][clickedHtml] = 0;
             }
             this.transitionMatrix[this.currentState][clickedHtml]++;
          }

          this.currentState = newState;

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

  getTransitionMatrix(): Record<string, Record<string, number>> {
    return this.transitionMatrix;
  }
}
