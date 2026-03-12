import { chromium, devices, Browser } from 'playwright';
import { PrimalEngine } from './PrimalEngine';
import { ExecutionMode, SiteConfig, DeviceSwarmConfig } from './types';

export interface SwarmResult {
  device: string;
  success: boolean;
  error?: string;
}

export class SwarmOrchestrator {
  static async run(config: SiteConfig, mode: ExecutionMode, swarmConfig: DeviceSwarmConfig): Promise<SwarmResult[]> {
    if (!swarmConfig.devices || swarmConfig.devices.length === 0) {
      throw new Error("Swarm config must contain at least one device.");
    }

    let browser: Browser | null = null;
    let results: SwarmResult[] = [];

    try {
      browser = await chromium.launch({ headless: true });

      results = await Promise.all(swarmConfig.devices.map(async (deviceName) => {
        let success = false;
        let errorMsg: string | undefined;

        const deviceDescriptor = devices[deviceName];
        if (!deviceDescriptor) {
          return {
            device: deviceName,
            success: false,
            error: `Device descriptor for "${deviceName}" not found in Playwright.`
          };
        }

        const browserConfig: SiteConfig = {
          ...config,
          name: `${config.name} [${deviceName}]`
        };

        const contextOptions: any = { ...deviceDescriptor };

        if (swarmConfig.fuzzGeolocation) {
          contextOptions.geolocation = {
            latitude: (Math.random() * 180) - 90,
            longitude: (Math.random() * 360) - 180
          };
          contextOptions.permissions = contextOptions.permissions || [];
          if (!contextOptions.permissions.includes('geolocation')) {
            contextOptions.permissions.push('geolocation');
          }
        }

        if (swarmConfig.fuzzPermissions) {
           const potentialPermissions = ['geolocation', 'notifications', 'camera', 'microphone'];
           contextOptions.permissions = contextOptions.permissions || [];

           potentialPermissions.forEach(perm => {
             // 50% chance to grant each permission
             if (Math.random() > 0.5 && !contextOptions.permissions.includes(perm)) {
               contextOptions.permissions.push(perm);
             }
           });
        }

        let context;
        try {
          context = await browser!.newContext(contextOptions);
          const page = await context.newPage();

          const engine = new PrimalEngine(page);
          await engine.run(browserConfig, mode);
          success = true;
        } catch (err: any) {
          success = false;
          errorMsg = err.message || String(err);
        } finally {
          if (context) {
            await context.close();
          }
        }

        return {
          device: deviceName,
          success,
          error: errorMsg
        };
      }));

    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return results;
  }
}
