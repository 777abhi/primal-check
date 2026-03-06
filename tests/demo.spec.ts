import { test } from '@playwright/test';
import { PrimalEngine } from '../src/PrimalEngine';
import { ExecutionMode, SiteConfig } from '../src/types';

test.describe('Primal Check Feature Demonstration', () => {

    test('Demonstrate READ_ONLY Mode Features', async ({ page }) => {
        // Listen to browser console to demonstrate page activity
        page.on('console', msg => console.log(`[Browser Console - READ_ONLY] ${msg.type()}: ${msg.text()}`));

        const engine = new PrimalEngine(page);

        const config: SiteConfig = {
            name: 'Demo App - Read Only',
            url: 'http://localhost:3002',
            screenshotConfig: {
                enabled: true,
                directory: './demo-screenshots',
                onFailure: true,
                onSuccess: true
            },
            accessibilityConfig: {
                enabled: true,
                failOnViolation: false // Only log to avoid failing the demo
            },
            networkTrafficConfig: {
                enabled: true,
                slowRequestThreshold: 500, // Detect the slow request in servers.js
                largePayloadThreshold: 500000, // Detect the large request in servers.js
                failOnIssues: false // Only log to avoid failing the demo
            },
            reportConfig: {
                enabled: true,
                directory: './demo-reports'
            },
            webhookConfig: {
                enabled: true,
                url: 'http://localhost:3003/webhook'
            }
        };

        console.log('--- Starting READ_ONLY Mode Run ---');
        await engine.run(config, ExecutionMode.READ_ONLY);
        console.log('--- Completed READ_ONLY Mode Run ---');
    });

    test('Demonstrate GORILLA Mode Features', async ({ page }) => {
        // Listen to browser console to demonstrate chaos interactions
        page.on('console', msg => console.log(`[Browser Console - GORILLA] ${msg.type()}: ${msg.text()}`));

        const engine = new PrimalEngine(page);

        const config: SiteConfig = {
            name: 'Demo App - Gorilla',
            url: 'http://localhost:3002',
            screenshotConfig: {
                enabled: true,
                directory: './demo-screenshots',
                onFailure: true,
                onSuccess: true
            },
            storageFuzzingConfig: {
                enabled: true
            },
            networkChaosConfig: {
                enabled: true,
                offline: false,
                latency: 100, // add a little latency
                requestFailureRate: 0.1 // 10% chance to fail
            },
            smartNavigationConfig: {
                enabled: true,
                steps: 3 // click multiple things
            },
             reportConfig: {
                enabled: true,
                directory: './demo-reports'
            },
            webhookConfig: {
                enabled: true,
                url: 'http://localhost:3003/webhook'
            }
        };

        console.log('--- Starting GORILLA Mode Run ---');
        await engine.run(config, ExecutionMode.GORILLA);
        console.log('--- Completed GORILLA Mode Run ---');
    });
});
