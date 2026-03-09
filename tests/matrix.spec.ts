import { test, expect } from '@playwright/test';
import { MatrixOrchestrator } from '../src/MatrixOrchestrator';
import { ExecutionMode, SiteConfig } from '../src/types';
import * as http from 'http';

test.describe('Matrix Orchestrator', () => {
  let server: http.Server;
  let port: number;

  test.beforeAll(async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Matrix</h1></body></html>');
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  test.afterAll(() => {
    server.close();
  });

  test('should run the configuration across multiple browsers', async () => {
    const config: SiteConfig = {
      name: 'Matrix Test Site',
      url: `http://localhost:${port}`,
    };

    const results = await MatrixOrchestrator.run(config, ExecutionMode.READ_ONLY);

    expect(results).toHaveLength(3);

    // Check if each browser ran successfully
    const browsers = results.map(r => r.browser);
    expect(browsers).toContain('chromium');
    expect(browsers).toContain('firefox');
    expect(browsers).toContain('webkit');

    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
