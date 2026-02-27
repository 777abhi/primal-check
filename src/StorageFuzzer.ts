import { Page, BrowserContext } from '@playwright/test';

export class StorageFuzzer {
  static async fuzz(page: Page): Promise<void> {
    try {
      await this.fuzzCookies(page.context());
      await this.fuzzLocalStorage(page);
    } catch (e) {
      console.warn('Storage fuzzing failed:', e);
    }
  }

  static async fuzzCookies(context: BrowserContext): Promise<void> {
    const cookies = await context.cookies();
    if (cookies.length === 0) return;

    for (const cookie of cookies) {
      if (Math.random() > 0.5) {
        // Clear cookie
        await context.clearCookies({ name: cookie.name, domain: cookie.domain, path: cookie.path });
      } else {
        // Mutate cookie
        const newValue = cookie.value + '_fuzzed_' + Math.random().toString(36).substring(7);
        // We need to re-add it with new value.
        // `addCookies` overwrites if match.
        // We construct a strictly typed object to avoid TS errors with extra properties if any.
        // Playwright `addCookies` takes a simpler structure than what `cookies()` returns.
        const newCookie = {
            name: cookie.name,
            value: newValue,
            domain: cookie.domain,
            path: cookie.path,
            expires: cookie.expires,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite
        };
        await context.addCookies([newCookie]);
      }
    }
  }

  static async fuzzLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      try {
        const keys = Object.keys(localStorage);
        if (keys.length === 0) return;

        keys.forEach(key => {
          if (Math.random() > 0.5) {
            // Remove item
            localStorage.removeItem(key);
          } else {
            // Mutate item
            const originalValue = localStorage.getItem(key);
            if (originalValue !== null) {
              const newValue = originalValue + '_fuzzed_' + Math.random().toString(36).substring(7);
              localStorage.setItem(key, newValue);
            }
          }
        });
      } catch (e) {
        // Ignore errors (e.g. security restrictions)
      }
    });
  }
}
