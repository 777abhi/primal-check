import { Page } from '@playwright/test';
import { VisualRegressionConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export class VisualRegressionAnalyzer {
  private config: VisualRegressionConfig;
  private siteName: string;
  private page: Page;

  constructor(page: Page, config: VisualRegressionConfig, siteName: string) {
    this.page = page;
    this.config = config;
    this.siteName = siteName;
  }

  async analyze(): Promise<void> {
    if (!this.config.enabled) return;

    const baselineDir = this.config.baselineDirectory || './baselines';
    const diffDir = this.config.diffDirectory || './diffs';

    // Ensure directories exist
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true });
    }
    if (!fs.existsSync(diffDir)) {
      fs.mkdirSync(diffDir, { recursive: true });
    }

    const sanitizedName = this.siteName.replace(/[^a-z0-9]/gi, '_');
    const baselinePath = path.join(baselineDir, `${sanitizedName}-baseline.png`);
    const currentPath = path.join(diffDir, `${sanitizedName}-current.png`);
    const diffPath = path.join(diffDir, `${sanitizedName}-diff.png`);

    // Capture current state
    await this.page.screenshot({ path: currentPath, fullPage: true });

    // If no baseline exists, set current as baseline and return
    if (!fs.existsSync(baselinePath)) {
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`Baseline created at ${baselinePath}`);
      return;
    }

    // Baseline exists, compare
    const baselinePng = PNG.sync.read(fs.readFileSync(baselinePath));
    const currentPng = PNG.sync.read(fs.readFileSync(currentPath));

    // Ensure images are same dimensions
    const width = Math.max(baselinePng.width, currentPng.width);
    const height = Math.max(baselinePng.height, currentPng.height);

    const adjustedBaseline = this.resizeImage(baselinePng, width, height);
    const adjustedCurrent = this.resizeImage(currentPng, width, height);

    const diff = new PNG({ width, height });

    const threshold = this.config.threshold ?? 0.1;

    const mismatchedPixels = pixelmatch(
      adjustedBaseline.data,
      adjustedCurrent.data,
      diff.data,
      width,
      height,
      { threshold }
    );

    if (mismatchedPixels > 0) {
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      const message = `Visual regression detected: ${mismatchedPixels} pixels mismatch. Diff saved to ${diffPath}`;
      console.warn(message);
      if (this.config.failOnMismatch) {
        throw new Error(message);
      }
    } else {
      // If no mismatch, we can clean up the current snapshot to save space
      if (fs.existsSync(currentPath)) {
        fs.unlinkSync(currentPath);
      }
    }
  }

  private resizeImage(img: PNG, width: number, height: number): PNG {
    if (img.width === width && img.height === height) {
      return img;
    }
    const newImg = new PNG({ width, height });
    img.bitblt(newImg, 0, 0, img.width, img.height, 0, 0);
    return newImg;
  }
}
