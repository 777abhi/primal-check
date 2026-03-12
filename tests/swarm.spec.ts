import { test, expect } from '@playwright/test';
import { SwarmOrchestrator } from '../src/SwarmOrchestrator';
import { ExecutionMode, SiteConfig, DeviceSwarmConfig } from '../src/types';
import * as http from 'http';

test.describe('Swarm Orchestrator', () => {
  let server: http.Server;
  let port: number;

  test.beforeAll(async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Swarm</h1></body></html>');
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

  test('should run the configuration across multiple emulated devices', async () => {
    const swarmConfig: DeviceSwarmConfig = {
        enabled: true,
        devices: ['iPhone 12', 'Pixel 5'],
        fuzzGeolocation: true,
        fuzzPermissions: true
    };

    const config: SiteConfig = {
      name: 'Swarm Test Site',
      url: `http://localhost:${port}`,
    };

    const results = await SwarmOrchestrator.run(config, ExecutionMode.READ_ONLY, swarmConfig);

    expect(results).toHaveLength(2);

    // Check if each device ran successfully
    const devices = results.map(r => r.device);
    expect(devices).toContain('iPhone 12');
    expect(devices).toContain('Pixel 5');

    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
