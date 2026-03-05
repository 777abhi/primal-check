import { SiteConfig, ExecutionMode } from './types';
import * as http from 'http';
import * as https from 'https';

export class WebhookDispatcher {
  static async dispatch(config: SiteConfig, mode: ExecutionMode, success: boolean, errors: Error[]): Promise<void> {
    if (!config.webhookConfig || !config.webhookConfig.enabled || !config.webhookConfig.url) {
      return;
    }

    const payload = JSON.stringify({
      name: config.name,
      url: config.url,
      mode: mode,
      success: success,
      timestamp: new Date().toISOString(),
      errors: errors.map(e => e.message),
    });

    try {
      const parsedUrl = new URL(config.webhookConfig.url);
      const isHttps = parsedUrl.protocol === 'https:';
      const requestModule = isHttps ? https : http;

      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      };

      const options = {
        method: config.webhookConfig.method || 'POST',
        headers: { ...defaultHeaders, ...config.webhookConfig.headers },
      };

      await new Promise<void>((resolve, reject) => {
        const req = requestModule.request(parsedUrl, options, (res) => {
          // Consume response data to free up memory
          res.on('data', () => {});
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`Webhook failed with status code ${res.statusCode}`));
            }
          });
        });

        req.on('error', (e) => {
          reject(e);
        });

        req.write(payload);
        req.end();
      });
    } catch (e) {
      // Catch and log to avoid crashing the engine entirely
      console.warn(`Failed to dispatch webhook:`, e);
    }
  }
}
