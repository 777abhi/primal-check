import { Locator } from '@playwright/test';
import { HeuristicFuzzer } from './HeuristicFuzzer';
import { PayloadMinimizer } from './PayloadMinimizer';

export class ChaosFuzzer {
  static async fuzzInput(input: Locator, fuzzer: HeuristicFuzzer): Promise<void> {
    const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
    const typeAttr = await input.getAttribute('type');
    const type = typeAttr ? typeAttr.toLowerCase() : 'text';

    let lastStrategy = '';
    try {
      if (tagName === 'select') {
        await this.fuzzSelect(input);
      } else if (tagName === 'textarea') {
        const result = fuzzer.mutateString('Random Text');
        lastStrategy = result.strategy;
        if (result.value === "") {
          await input.fill(' ');
        } else {
          await input.fill(result.value);
        }
      } else if (tagName === 'input') {
        await this.fuzzInputElement(input, type, fuzzer);
      }
    } catch (e) {
      if (lastStrategy) {
        fuzzer.recordFailure(lastStrategy);
      }
      // Ignore errors for individual inputs to continue fuzzing others
      // console.warn(`Failed to fuzz input:`, e);
    }
  }

  private static async fuzzSelect(select: Locator): Promise<void> {
    const options = select.locator('option');
    const optionCount = await options.count();
    if (optionCount > 0) {
      const randomOptionIndex = Math.floor(Math.random() * optionCount);
      await select.selectOption({ index: randomOptionIndex });
    }
  }

  private static async fuzzInputElement(input: Locator, type: string, fuzzer: HeuristicFuzzer): Promise<void> {
    let result;
    if (['checkbox', 'radio'].includes(type)) {
      if (Math.random() > 0.5) {
        await input.check();
      }
      return;
    } else if (['text', 'search', 'tel', 'password'].includes(type)) {
      result = fuzzer.mutateString('RandomString');
    } else if (type === 'url') {
      result = fuzzer.mutateString('https://example.com/');
    } else if (type === 'email') {
      result = fuzzer.mutateString('test@example.com');
    } else if (type === 'number') {
      result = fuzzer.mutateNumber();
    } else if (['date', 'datetime-local'].includes(type)) {
      await input.fill('2024-01-01');
      return;
    } else {
      result = fuzzer.mutateString('RandomString'); // Fallback
    }

    let fillValue = result.value === "" ? ' ' : result.value;

    try {
      await input.fill(fillValue);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      // Only minimize if it's likely a payload rejection (not a timeout or detached element)
      const isDetachedOrTimeout = errorMsg.includes('Timeout') || errorMsg.includes('Target closed') || errorMsg.includes('detached') || errorMsg.includes('not visible');

      // Automatic Payload Minimization for easier debugging
      if (!isDetachedOrTimeout && fillValue.length > 1) {
        const minimizer = new PayloadMinimizer();
        const minimalPayload = await minimizer.minimize(fillValue, async (testPayload) => {
          try {
            // Use a very short timeout for minimizing so we don't hang if the element actually disappeared
            await input.fill(testPayload, { timeout: 100 });
            return false; // Did not throw
          } catch {
            return true; // Still throws
          }
        });
        console.warn(`[Payload Minimizer] Minimal failing payload for strategy '${result.strategy}': "${minimalPayload}"`);
      }

      fuzzer.recordFailure(result.strategy);
      throw e; // Rethrow to let the parent try/catch handle it or log it
    }
  }
}
