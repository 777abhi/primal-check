import { test, expect } from '@playwright/test';
import { PrimalEngine } from '../src/PrimalEngine';
import { ExecutionMode, SiteConfig } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

test.describe('PrimalEngine - Tracing Config', () => {
    const traceDir = './test-traces';

    test.beforeAll(() => {
        if (!fs.existsSync(traceDir)) {
            fs.mkdirSync(traceDir, { recursive: true });
        }
    });

    test.afterEach(() => {
        // Clean up trace directory
        if (fs.existsSync(traceDir)) {
            const files = fs.readdirSync(traceDir);
            for (const file of files) {
                fs.unlinkSync(path.join(traceDir, file));
            }
        }
    });

    test('should generate a trace zip when tracingConfig is enabled', async ({ page }) => {
        // Use a simple data URL or about:blank to avoid external dependencies
        await page.goto('about:blank');
        const engine = new PrimalEngine(page);

        const config: SiteConfig = {
            name: 'Tracing Test App',
            url: 'about:blank',
            tracingConfig: {
                enabled: true,
                directory: traceDir
            }
        };

        await engine.run(config, ExecutionMode.READ_ONLY);

        // Verify a trace zip file was created
        const files = fs.readdirSync(traceDir);
        const traceFiles = files.filter(f => f.endsWith('.zip') && f.includes('Tracing_Test_App'));
        expect(traceFiles.length).toBe(1);
        expect(fs.statSync(path.join(traceDir, traceFiles[0])).size).toBeGreaterThan(0);
    });

    test('should not generate a trace zip when tracingConfig is disabled', async ({ page }) => {
        await page.goto('about:blank');
        const engine = new PrimalEngine(page);

        const config: SiteConfig = {
            name: 'Tracing Disabled App',
            url: 'about:blank',
            tracingConfig: {
                enabled: false,
                directory: traceDir
            }
        };

        await engine.run(config, ExecutionMode.READ_ONLY);

        // Verify no trace zip file was created
        const files = fs.readdirSync(traceDir);
        const traceFiles = files.filter(f => f.endsWith('.zip') && f.includes('Tracing_Disabled_App'));
        expect(traceFiles.length).toBe(0);
    });
});