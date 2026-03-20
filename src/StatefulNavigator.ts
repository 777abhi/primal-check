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
    // We define state by combining the URL path/hash with a lightweight structural DOM hash.
    // This allows detecting sub-states like modals that don't change the URL.
    return await this.page.evaluate(() => {
      const urlPart = window.location.pathname + window.location.hash;

      // Basic recursive function to build a structural skeleton of visible elements
      function buildSkeleton(element: Element): string {
        // Skip text nodes and comments (handled implicitly by iterating over Element children)
        // Skip hidden elements to focus on visual state.
        // offsetWidth and offsetHeight is a very fast way to check if an element is visibly rendered,
        // avoiding the expensive getComputedStyle call recursively.
        if (element instanceof HTMLElement) {
          if (element.offsetWidth === 0 && element.offsetHeight === 0) {
            return '';
          }
        }

        let skeleton = '<' + element.tagName.toLowerCase();

        // Include structural attributes like id, type for inputs, or custom roles if needed
        if (element.id) {
            skeleton += '#' + element.id;
        }

        skeleton += '>';

        for (let i = 0; i < element.children.length; i++) {
          skeleton += buildSkeleton(element.children[i]);
        }

        skeleton += '</' + element.tagName.toLowerCase() + '>';
        return skeleton;
      }

      // Hash function (djb2) to keep the string short
      function hashString(str: string): number {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
          hash = (hash * 33) ^ str.charCodeAt(i);
        }
        return hash >>> 0;
      }

      const domSkeleton = buildSkeleton(document.body);
      const domHash = hashString(domSkeleton).toString(16);

      return urlPart + '|' + domHash;
    });
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
