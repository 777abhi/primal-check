import { Page } from '@playwright/test';

export class ViewportFuzzer {
  static async fuzzViewport(page: Page): Promise<void> {
    const viewports = [
      { width: 320, height: 568 },   // iPhone SE
      { width: 375, height: 667 },   // iPhone 8
      { width: 414, height: 896 },   // iPhone 11 Pro Max
      { width: 768, height: 1024 },  // iPad
      { width: 1024, height: 1366 }, // iPad Pro
      { width: 1366, height: 768 },  // Common Laptop
      { width: 1920, height: 1080 }, // Full HD Desktop
      { width: 2560, height: 1440 }, // QHD
      { width: 3840, height: 2160 }, // 4K
      // Some weird edge cases
      { width: 800, height: 600 },
      { width: 320, height: 480 },
      { width: 250, height: 800 },   // Very narrow
      { width: 1000, height: 300 }   // Very wide/short
    ];

    const randomIndex = Math.floor(Math.random() * viewports.length);
    const viewport = viewports[randomIndex];

    try {
      await page.setViewportSize(viewport);
    } catch (e) {
      console.warn('Failed to fuzz viewport size:', e);
    }
  }
}
