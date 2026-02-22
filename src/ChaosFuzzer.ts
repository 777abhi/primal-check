import { Locator } from '@playwright/test';

export class ChaosFuzzer {
  static async fuzzInput(input: Locator): Promise<void> {
    const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
    const typeAttr = await input.getAttribute('type');
    const type = typeAttr ? typeAttr.toLowerCase() : 'text';

    try {
      if (tagName === 'select') {
        await this.fuzzSelect(input);
      } else if (tagName === 'textarea') {
        await input.fill('Random Text ' + Math.random().toString(36).substring(7));
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
      await input.fill('RandomString ' + Math.random().toString(36).substring(7));
    } else if (type === 'url') {
      await input.fill('https://example.com/' + Math.random().toString(36).substring(7));
    } else if (type === 'email') {
      await input.fill(`test${Math.floor(Math.random() * 1000)}@example.com`);
    } else if (type === 'number') {
      await input.fill(Math.floor(Math.random() * 100).toString());
    } else if (['date', 'datetime-local'].includes(type)) {
      await input.fill('2024-01-01');
    }
  }
}
