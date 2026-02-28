# Primal Check - Feature Exploration Runbook

This runbook provides a step-by-step guide to exploring and testing all the capabilities of the `PrimalEngine` within your Playwright test suite.

## Prerequisites

Before running the examples below, ensure your environment is set up:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Start your local application** (or use an external URL for testing).
   Ensure the application you are testing is running and accessible (e.g., `http://localhost:3000`).

---

## 1. Basic Health Check (`READ_ONLY` Mode)

**Goal:** Verify that a page loads successfully, the body is visible, and no console errors occur during load.

**Test Setup:**
Create a file named `tests/health-check.spec.ts`:

```typescript
import { test } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test('Basic Health Check', async ({ page }) => {
  const engine = new PrimalEngine(page);
  const config: SiteConfig = {
    name: 'Health Check Site',
    url: 'http://localhost:3000', // Replace with your target URL
  };

  // Run in READ_ONLY mode
  await engine.run(config, ExecutionMode.READ_ONLY);
});
```

**Run the test:**
```bash
npx playwright test tests/health-check.spec.ts
```

---

## 2. Accessibility Checks

**Goal:** Scan the page for WCAG accessibility violations.

**Test Setup:**
Update your configuration to include `accessibilityConfig`:

```typescript
import { test } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test('Accessibility Check', async ({ page }) => {
  const engine = new PrimalEngine(page);
  const config: SiteConfig = {
    name: 'Accessibility Site',
    url: 'http://localhost:3000',
    accessibilityConfig: {
      enabled: true,
      failOnViolation: true // Set to false to only log warnings
    }
  };

  await engine.run(config, ExecutionMode.READ_ONLY);
});
```

---

## 3. Visual Verification (Screenshots)

**Goal:** Automatically capture screenshots on success or failure.

**Test Setup:**
Update your configuration to include `screenshotConfig`:

```typescript
import { test } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test('Visual Verification', async ({ page }) => {
  const engine = new PrimalEngine(page);
  const config: SiteConfig = {
    name: 'Visual Site',
    url: 'http://localhost:3000',
    screenshotConfig: {
      enabled: true,
      directory: './screenshots', // Ensure this directory is writable
      onFailure: true,
      onSuccess: true
    }
  };

  // Run in READ_ONLY or GORILLA mode
  await engine.run(config, ExecutionMode.READ_ONLY);
});
```

**Check the results:**
After running the test, look in the `./screenshots` directory for the captured images.

---

## 4. Chaos Testing (`GORILLA` Mode)

**Goal:** Simulate unpredictable user behavior to test application stability. This mode automatically scrolls the page, fuzzes forms, and performs a random click on visible buttons or links.

**Test Setup:**
```typescript
import { test } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test('Gorilla Chaos Testing', async ({ page }) => {
  const engine = new PrimalEngine(page);
  const config: SiteConfig = {
    name: 'Chaos Site',
    url: 'http://localhost:3000'
  };

  // Run in GORILLA mode
  await engine.run(config, ExecutionMode.GORILLA);
});
```

---

## 5. Storage Fuzzing

**Goal:** Randomly clear or mutate cookies and local storage items to test state persistence and session handling resilience.

**Test Setup:**
Add `storageFuzzingConfig` to your configuration and run in `GORILLA` mode:

```typescript
import { test } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test('Storage Fuzzing', async ({ page }) => {
  const engine = new PrimalEngine(page);
  const config: SiteConfig = {
    name: 'Storage Fuzzing Site',
    url: 'http://localhost:3000',
    storageFuzzingConfig: {
      enabled: true
    }
  };

  await engine.run(config, ExecutionMode.GORILLA);
});
```

---

## 6. Network Chaos

**Goal:** Simulate network instability such as latency, request failures, or completely offline states.

**Test Setup:**
Add `networkChaosConfig` to your configuration and run in `GORILLA` mode:

```typescript
import { test } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test('Network Chaos', async ({ page }) => {
  const engine = new PrimalEngine(page);
  const config: SiteConfig = {
    name: 'Network Chaos Site',
    url: 'http://localhost:3000',
    networkChaosConfig: {
      enabled: true,
      offline: false, // Set to true to simulate offline mode
      latency: 500, // Introduce a 500ms delay to requests
      requestFailureRate: 0.1 // 10% chance for network requests to fail
    }
  };

  await engine.run(config, ExecutionMode.GORILLA);
});
```

---

## Combining Features

You can combine multiple configurations to run a comprehensive test. For example, a thorough `GORILLA` test:

```typescript
import { test } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from '../src/PrimalEngine';

test('Comprehensive Gorilla Test', async ({ page }) => {
  const engine = new PrimalEngine(page);
  const config: SiteConfig = {
    name: 'Comprehensive Site',
    url: 'http://localhost:3000',
    screenshotConfig: {
      enabled: true,
      onFailure: true,
      onSuccess: false
    },
    storageFuzzingConfig: {
      enabled: true
    },
    networkChaosConfig: {
      enabled: true,
      latency: 200,
      requestFailureRate: 0.05
    }
  };

  await engine.run(config, ExecutionMode.GORILLA);
});
```
