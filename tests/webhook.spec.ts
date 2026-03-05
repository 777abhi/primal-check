import { test, expect } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';
import * as http from 'http';

test.describe('PrimalEngine - Webhooks Integration', () => {
  let server: http.Server;
  let receivedPayloads: any[] = [];
  let serverUrl = '';

  test.beforeAll(async () => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        if (body) {
          try {
            receivedPayloads.push(JSON.parse(body));
          } catch (e) {
            console.error('Failed to parse webhook body:', e);
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'received' }));
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        serverUrl = `http://127.0.0.1:${address.port}/webhook`;
        resolve();
      });
    });
  });

  test.afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  test.beforeEach(() => {
    receivedPayloads = [];
  });

  test('should dispatch a webhook with success status and payload', async ({ page }) => {
    const config: SiteConfig = {
      name: 'Webhook Test Site',
      url: 'data:text/html,<html><body><h1>Success</h1></body></html>',
      webhookConfig: {
        enabled: true,
        url: serverUrl,
      }
    };

    const engine = new PrimalEngine(page);
    await engine.run(config, ExecutionMode.READ_ONLY);

    // Wait a brief moment for the webhook to be processed
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(receivedPayloads.length).toBe(1);
    const payload = receivedPayloads[0];
    expect(payload.name).toBe('Webhook Test Site');
    expect(payload.mode).toBe('READ_ONLY');
    expect(payload.success).toBe(true);
    expect(payload.errors).toBeDefined();
    expect(payload.errors.length).toBe(0);
    expect(payload.timestamp).toBeDefined();
  });

  test('should dispatch a webhook with failure status and errors payload', async ({ page }) => {
    const config: SiteConfig = {
      name: 'Webhook Failure Site',
      url: 'data:text/html,<html><body><script>throw new Error("Test Error");</script></body></html>',
      webhookConfig: {
        enabled: true,
        url: serverUrl,
      }
    };

    const engine = new PrimalEngine(page);

    // We expect the engine to throw an error due to console errors in READ_ONLY mode
    await expect(engine.run(config, ExecutionMode.READ_ONLY)).rejects.toThrow(/Console errors detected/);

    // Wait a brief moment for the webhook to be processed
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(receivedPayloads.length).toBe(1);
    const payload = receivedPayloads[0];
    expect(payload.name).toBe('Webhook Failure Site');
    expect(payload.mode).toBe('READ_ONLY');
    expect(payload.success).toBe(false);
    expect(payload.errors).toBeDefined();
    expect(payload.errors.length).toBeGreaterThan(0);
    expect(payload.errors[0]).toContain('Test Error');
  });

  test('should not dispatch a webhook when disabled', async ({ page }) => {
    const config: SiteConfig = {
      name: 'Webhook Disabled Site',
      url: 'data:text/html,<html><body><h1>Success</h1></body></html>',
      webhookConfig: {
        enabled: false,
        url: serverUrl,
      }
    };

    const engine = new PrimalEngine(page);
    await engine.run(config, ExecutionMode.READ_ONLY);

    // Wait a brief moment for any potential webhook to be processed
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(receivedPayloads.length).toBe(0);
  });
});
