import { test, expect, Page } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';
import { PrimalPlugin } from '../src/types';

test.describe('PrimalEngine - Plugin System', () => {

    test('should execute plugins in GORILLA mode', async ({ page }) => {
        const engine = new PrimalEngine(page);
        let pluginExecuted = false;

        const mockPlugin: PrimalPlugin = {
            name: 'MockPlugin',
            run: async (p: Page) => {
                pluginExecuted = true;
            }
        };

        const config: SiteConfig = {
            name: 'Plugin Test',
            url: 'data:text/html,<body><h1>Plugin Test</h1></body>',
            plugins: [mockPlugin]
        };

        await engine.run(config, ExecutionMode.GORILLA);

        expect(pluginExecuted).toBe(true);
    });

    test('should not execute plugins in READ_ONLY mode', async ({ page }) => {
        const engine = new PrimalEngine(page);
        let pluginExecuted = false;

        const mockPlugin: PrimalPlugin = {
            name: 'MockPlugin',
            run: async (p: Page) => {
                pluginExecuted = true;
            }
        };

        const config: SiteConfig = {
            name: 'Plugin Test Read Only',
            url: 'data:text/html,<body><h1>Plugin Test</h1></body>',
            plugins: [mockPlugin]
        };

        await engine.run(config, ExecutionMode.READ_ONLY);

        expect(pluginExecuted).toBe(false);
    });
});
