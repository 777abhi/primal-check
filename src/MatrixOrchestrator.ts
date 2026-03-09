import { chromium, firefox, webkit, BrowserType } from 'playwright';
import { PrimalEngine } from './PrimalEngine';
import { ExecutionMode, SiteConfig } from './types';

export interface MatrixResult {
  browser: string;
  success: boolean;
  error?: string;
}

export class MatrixOrchestrator {
  static async run(config: SiteConfig, mode: ExecutionMode): Promise<MatrixResult[]> {
    const browsers: { name: string; type: BrowserType }[] = [
      { name: 'chromium', type: chromium },
      { name: 'firefox', type: firefox },
      { name: 'webkit', type: webkit }
    ];

    const results = await Promise.all(browsers.map(async ({ name, type }) => {
      let success = false;
      let errorMsg: string | undefined;

      // We clone the config and append the browser name to the test name, so reports/screenshots are distinct
      const browserConfig: SiteConfig = {
        ...config,
        name: `${config.name} [${name}]`
      };

      let browser;
      try {
        browser = await type.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        const engine = new PrimalEngine(page);
        await engine.run(browserConfig, mode);
        success = true;
      } catch (err: any) {
        success = false;
        errorMsg = err.message || String(err);
      } finally {
        if (browser) {
          await browser.close();
        }
      }

      return {
        browser: name,
        success,
        error: errorMsg
      };
    }));

    return results;
  }
}
