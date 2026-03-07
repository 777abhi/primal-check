import { test, expect } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Visual Regression Integration', () => {
  const baselineDir = './test-results/baselines';
  const diffDir = './test-results/diffs';

  test.beforeEach(() => {
    // Clean up directories
    if (fs.existsSync(baselineDir)) {
      fs.rmSync(baselineDir, { recursive: true, force: true });
    }
    if (fs.existsSync(diffDir)) {
      fs.rmSync(diffDir, { recursive: true, force: true });
    }
    fs.mkdirSync(baselineDir, { recursive: true });
    fs.mkdirSync(diffDir, { recursive: true });
  });

  test('should detect visual mismatches and throw an error', async ({ page }) => {
    // 1. Create a dummy HTML page
    const htmlPath = path.resolve(__dirname, 'fixtures', 'visual.html');
    if (!fs.existsSync(path.dirname(htmlPath))) {
      fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    }
    fs.writeFileSync(htmlPath, '<html><body style="background: red;"><h1>Hello Visual</h1></body></html>');
    const fileUrl = `file://${htmlPath}`;

    const config: SiteConfig = {
      name: 'VisualTest',
      url: fileUrl,
      visualRegressionConfig: {
        enabled: true,
        baselineDirectory: baselineDir,
        diffDirectory: diffDir,
        failOnMismatch: true,
        threshold: 0.1
      }
    };

    const engine = new PrimalEngine(page);

    // 2. First run generates the baseline
    await engine.run(config, ExecutionMode.READ_ONLY);

    // Check baseline created
    const baselineFile = path.join(baselineDir, 'VisualTest-baseline.png');
    expect(fs.existsSync(baselineFile)).toBe(true);

    // 3. Modify HTML to cause a visual diff
    fs.writeFileSync(htmlPath, '<html><body style="background: blue;"><h1>Hello Visual Diff</h1></body></html>');

    // 4. Second run should detect mismatch and fail
    await expect(engine.run(config, ExecutionMode.READ_ONLY)).rejects.toThrow(/Visual regression detected/);

    // 5. Diff file should be created
    const diffFiles = fs.readdirSync(diffDir);
    expect(diffFiles.length).toBeGreaterThan(0);
    expect(diffFiles.some(f => f.includes('VisualTest-diff'))).toBe(true);
  });
});
