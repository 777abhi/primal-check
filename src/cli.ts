#!/usr/bin/env node

import { chromium } from 'playwright';
import { PrimalEngine } from './PrimalEngine';
import { MatrixOrchestrator } from './MatrixOrchestrator';
import { ExecutionMode, SiteConfig } from './types';
import { startServer } from './server';

async function main() {
  const args = process.argv.slice(2);
  let url = '';
  let mode: ExecutionMode = ExecutionMode.READ_ONLY;
  let serve = false;
  let port = 3000;
  let matrix = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && i + 1 < args.length) {
      url = args[i + 1];
      i++;
    } else if (args[i] === '--matrix') {
      matrix = true;
    } else if (args[i] === '--mode' && i + 1 < args.length) {
      const modeArg = args[i + 1].toUpperCase();
      if (modeArg === 'GORILLA') {
        mode = ExecutionMode.GORILLA;
      }
      i++;
    } else if (args[i] === '--serve') {
      serve = true;
    } else if (args[i] === '--port' && i + 1 < args.length) {
      port = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (serve) {
    startServer(port);
    return; // Keep the process alive for the server
  }

  if (!url) {
    console.log('Usage: primal-check --url <url> [--mode <READ_ONLY|GORILLA>] [--matrix]');
    console.log('       primal-check --serve [--port <port>]');
    process.exit(1);
  }

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
    if (matrix) {
      console.log('Running in Matrix Mode (Chromium, Firefox, WebKit)...');
      const results = await MatrixOrchestrator.run(config, mode);
      const allSuccess = results.every(r => r.success);

      console.log('Matrix Results:');
      results.forEach(r => {
        console.log(`- ${r.browser}: ${r.success ? 'Success' : `Failed (${r.error})`}`);
      });

      if (!allSuccess) {
        process.exit(1);
      }
    } else {
      const browser = await chromium.launch({ headless: true });
      try {
        const context = await browser.newContext();
        const page = await context.newPage();
        const engine = new PrimalEngine(page);

        await engine.run(config, mode);
      } finally {
        await browser.close();
      }
    }

    console.log('Primal Check completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Primal Check failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
