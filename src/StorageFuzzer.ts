import { Page, BrowserContext } from '@playwright/test';
import { HeuristicFuzzer } from './HeuristicFuzzer';

export class StorageFuzzer {
  static async fuzz(page: Page, fuzzer: HeuristicFuzzer): Promise<void> {
    try {
      await this.fuzzCookies(page.context(), fuzzer);
      await this.fuzzLocalStorage(page, fuzzer);
    } catch (e) {
      console.warn('Storage fuzzing failed:', e);
    }
  }

  static async fuzzCookies(context: BrowserContext, fuzzer: HeuristicFuzzer): Promise<void> {
    const cookies = await context.cookies();
    if (cookies.length === 0) return;

    for (const cookie of cookies) {
      if (Math.random() > 0.5) {
        // Clear cookie
        await context.clearCookies({ name: cookie.name, domain: cookie.domain, path: cookie.path });
      } else {
        // Mutate cookie
        const result = fuzzer.mutateString(cookie.value);
        // We need to re-add it with new value.
        // `addCookies` overwrites if match.
        // We construct a strictly typed object to avoid TS errors with extra properties if any.
        // Playwright `addCookies` takes a simpler structure than what `cookies()` returns.
        const newCookie = {
            name: cookie.name,
            value: result.value,
            domain: cookie.domain,
            path: cookie.path,
            expires: cookie.expires,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite
        };
        try {
            await context.addCookies([newCookie]);
        } catch (e) {
            fuzzer.recordFailure(result.strategy);
            console.warn('Failed to add mutated cookie:', e);
        }
      }
    }
  }

  static async fuzzLocalStorage(page: Page, fuzzer: HeuristicFuzzer): Promise<void> {
    // We cannot easily pass an instance into page.evaluate,
    // but we can generate mutated payloads beforehand, or generate inside and let it be.
    // Wait, LocalStorage allows strings natively. We can do mutations outside and pass in.
    const storageItems = await page.evaluate(() => {
      const items: {key: string, value: string}[] = [];
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          const val = localStorage.getItem(key);
          if (val !== null) items.push({key, value: val});
        });
      } catch (e) {}
      return items;
    });

    if (storageItems.length === 0) return;

    for (const item of storageItems) {
      if (Math.random() > 0.5) {
        await page.evaluate((k) => {
          try { localStorage.removeItem(k); } catch(e){}
        }, item.key);
      } else {
        const result = fuzzer.mutateString(item.value);
        try {
          await page.evaluate(({k, v}) => {
            try { localStorage.setItem(k, v); } catch(e) { throw e; }
          }, { k: item.key, v: result.value });
        } catch (e) {
          fuzzer.recordFailure(result.strategy);
        }
      }
    }
  }
}
