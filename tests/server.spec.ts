import { test, expect } from '@playwright/test';
import * as http from 'http';
import { startServer } from '../src/server';
import { SiteConfig, ExecutionMode } from '../src/types';

test.describe('API Server Integration', () => {
  let server: http.Server;
  const port = 3001; // Use a distinct port to avoid conflicts

  test.beforeAll(async () => {
    server = startServer(port);
    await new Promise((resolve) => server.on('listening', resolve));
  });

  test.afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const requestPost = (path: string, body: any): Promise<{ status: number; data: any }> => {
    return new Promise((resolve, reject) => {
      const dataString = JSON.stringify(body);
      const options = {
        hostname: 'localhost',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString)
        }
      };

      const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, data: JSON.parse(responseBody) });
          } catch (e) {
            resolve({ status: res.statusCode || 500, data: responseBody });
          }
        });
      });

      req.on('error', reject);
      req.write(dataString);
      req.end();
    });
  };

  test('should return 404 for unknown endpoints', async () => {
    const response = await requestPost('/unknown', {});
    expect(response.status).toBe(404);
  });

  test('should return 400 for invalid JSON payload', () => {
    return new Promise<void>((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port,
        path: '/run',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        expect(res.statusCode).toBe(400);
        resolve();
      });

      req.on('error', reject);
      req.write('{ invalid json ');
      req.end();
    });
  });

  test('should successfully run PrimalEngine via API in READ_ONLY mode', async () => {
    // We can't easily mock page.route inside the server's launched browser from the test directly without extra plumbing.
    // So we'll point it to a guaranteed existing URL (like a local dummy server or an empty page data uri).
    // Using a data URI is perfect for headless tests to ensure no network issues.
    const html = '<html><body><h1>Works</h1></body></html>';
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    const payload = {
      config: {
        name: 'API Test',
        url: dataUri,
      } as SiteConfig,
      mode: ExecutionMode.READ_ONLY
    };

    const response = await requestPost('/run', payload);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test('should return 500 and error message if execution fails', async () => {
    // A data URI with display:none on body will fail READ_ONLY mode's body check
    const html = '<html><body style="display: none;"><h1>Hidden</h1></body></html>';
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    const payload = {
      config: {
        name: 'API Fail Test',
        url: dataUri,
      } as SiteConfig,
      mode: ExecutionMode.READ_ONLY
    };

    const response = await requestPost('/run', payload);

    expect(response.status).toBe(500);
    expect(response.data.success).toBe(false);
    expect(response.data.error).toContain('Body is not visible');
  });
});
