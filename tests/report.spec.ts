import { test, expect } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';
import * as fs from 'fs';
import * as path from 'path';

test.describe('PrimalEngine - HTML Reporting', () => {
  const reportDir = './test-reports';

  test.beforeEach(() => {
    // Clean up report directory before tests
    if (fs.existsSync(reportDir)) {
      fs.rmSync(reportDir, { recursive: true, force: true });
    }
  });

  test.afterAll(() => {
    // Clean up after tests
    if (fs.existsSync(reportDir)) {
      fs.rmSync(reportDir, { recursive: true, force: true });
    }
  });

  test('should generate an HTML report when enabled', async ({ page }) => {
    const config: SiteConfig = {
      name: 'Test Site',
      url: 'data:text/html,<html><body><h1>Hello</h1></body></html>',
      reportConfig: {
        enabled: true,
        directory: reportDir,
      }
    };

    const engine = new PrimalEngine(page);
    await engine.run(config, ExecutionMode.READ_ONLY);

    // Wait a brief moment for file system write to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(fs.existsSync(reportDir)).toBe(true);
    const files = fs.readdirSync(reportDir);
    expect(files.length).toBeGreaterThan(0);

    const reportFile = files.find(f => f.endsWith('.html'));
    expect(reportFile).toBeDefined();

    const reportContent = fs.readFileSync(path.join(reportDir, reportFile!), 'utf-8');
    expect(reportContent).toContain('Test Site');
    expect(reportContent).toContain('READ_ONLY');
    expect(reportContent).toContain('success');
  });

  test('should not generate an HTML report when disabled', async ({ page }) => {
    const config: SiteConfig = {
      name: 'Test Site',
      url: 'data:text/html,<html><body><h1>Hello</h1></body></html>',
      reportConfig: {
        enabled: false,
        directory: reportDir,
      }
    };

    const engine = new PrimalEngine(page);
    await engine.run(config, ExecutionMode.READ_ONLY);

    // Wait a brief moment for file system write to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    if (fs.existsSync(reportDir)) {
        const files = fs.readdirSync(reportDir);
        expect(files.filter(f => f.endsWith('.html')).length).toBe(0);
    } else {
        expect(fs.existsSync(reportDir)).toBe(false);
    }
  });
});
