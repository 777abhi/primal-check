import { Locator } from '@playwright/test';
import { HeuristicFuzzer } from './HeuristicFuzzer';

export class ChaosFuzzer {
  static async fuzzInput(input: Locator): Promise<void> {
    const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
    const typeAttr = await input.getAttribute('type');
    const type = typeAttr ? typeAttr.toLowerCase() : 'text';

    try {
      if (tagName === 'select') {
        await this.fuzzSelect(input);
      } else if (tagName === 'textarea') {
        await input.fill(HeuristicFuzzer.mutateString('Random Text'));
      } else if (tagName === 'input') {
        await this.fuzzInputElement(input, type);
      }
    } catch (e) {
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

  private static async fuzzInputElement(input: Locator, type: string): Promise<void> {
    if (['checkbox', 'radio'].includes(type)) {
      if (Math.random() > 0.5) {
        await input.check();
      }
    } else if (['text', 'search', 'tel', 'password'].includes(type)) {
      await input.fill(HeuristicFuzzer.mutateString('RandomString'));
    } else if (type === 'url') {
      await input.fill(HeuristicFuzzer.mutateString('https://example.com/'));
    } else if (type === 'email') {
      await input.fill(HeuristicFuzzer.mutateString('test@example.com'));
    } else if (type === 'number') {
      await input.fill(HeuristicFuzzer.mutateNumber());
    } else if (['date', 'datetime-local'].includes(type)) {
      await input.fill('2024-01-01');
    } else {
      await input.fill(HeuristicFuzzer.mutateString('RandomString')); // Fallback
    }
  }
}
