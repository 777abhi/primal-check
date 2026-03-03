#!/usr/bin/env node

import { chromium } from 'playwright';
import { PrimalEngine } from './PrimalEngine';
import { ExecutionMode, SiteConfig } from './types';

async function main() {
  const args = process.argv.slice(2);
  let url = '';
  let mode: ExecutionMode = ExecutionMode.READ_ONLY;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && i + 1 < args.length) {
      url = args[i + 1];
      i++;
    } else if (args[i] === '--mode' && i + 1 < args.length) {
      const modeArg = args[i + 1].toUpperCase();
      if (modeArg === 'GORILLA') {
        mode = ExecutionMode.GORILLA;
      }
      i++;
    }
  }

  if (!url) {
    console.log('Usage: primal-check --url <url> [--mode <READ_ONLY|GORILLA>]');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const engine = new PrimalEngine(page);

  const config: SiteConfig = {
    name: 'CLI Run',
    url: url,
    screenshotConfig: {
      enabled: true,
      onFailure: true,
      onSuccess: false
    }
  };

  try {
    await engine.run(config, mode);
    console.log('Primal Check completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Primal Check failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
