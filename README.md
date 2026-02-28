# Primal Check

Primal Check is a lightweight, reliable QA automation utility built on top of Playwright. It provides a structured way to perform health checks and chaos testing on your web applications.

## Installation

Ensure you have Node.js installed. Then, install the necessary dependencies:

```bash
npm install @playwright/test typescript ts-node @axe-core/playwright axe-core
npx playwright install
```

## Usage

Primal Check is designed to be used within your Playwright test suite.

### Basic Setup

Import the `PrimalEngine`, `ExecutionMode` and `SiteConfig` in your test file:

```typescript
import { test } from '@playwright/test';
import { PrimalEngine, ExecutionMode, SiteConfig } from './src/PrimalEngine'; // Adjust import path as needed

test('Basic Health Check', async ({ page }) => {
  const engine = new PrimalEngine(page);

  const config: SiteConfig = {
    name: 'My Application',
    url: 'http://localhost:3000',
    screenshotConfig: {
      enabled: true,
      onFailure: true,
      onSuccess: false
    },
    accessibilityConfig: {
      enabled: true,
      failOnViolation: false // Set to true to fail the test on violations
    },
    storageFuzzingConfig: {
      enabled: true // Enable cookie and local storage fuzzing in GORILLA mode
    }
  };

  await engine.run(config, ExecutionMode.READ_ONLY);
});
```

## Existing Features

Primal Check currently supports two execution modes and visual verification:

### 1. READ_ONLY Mode (Health Check)
Designed for smoke testing and basic health verification.
- **Navigation Verification**: Ensures the page loads successfully.
- **Body Visibility**: Checks if the `<body>` tag is visible, ensuring the page rendered content.
- **Console Error Monitoring**: Listens for and reports any console exceptions or page errors that occur during load.
- **Accessibility Check**: Scans the page for WCAG violations using `axe-core`. Can be configured to just log warnings or fail the test.
- **Network Traffic Analysis**: Monitors network requests for slow responses or large payloads against configurable thresholds. Can be configured to just log issues or fail the test.

### 2. GORILLA Mode (Chaos/Fuzz Testing)
Designed to test application stability under random interaction.
- **Scroll & Explore**: Automatically scrolls to the bottom of the page to trigger lazy-loading and reveal hidden elements before interaction.
- **Form Fuzzing**: Automatically detects visible form fields (`input`, `textarea`, `select`) and injects random data.
- **Network Chaos**: Simulates network instability (offline mode, latency, request failures) to test resilience against connectivity issues.
- **Cookie & LocalStorage Fuzzing**: Randomly clear or mutate cookies and local storage to test state persistence and session handling.
- **Random Interaction**: Automatically identifies interactive elements (buttons, links) and clicks one at random.
- **Resilience**: Warns rather than failing if no interactive elements are found.

### Visual Verification
- **Screenshot Capture**: Automatically capture screenshots on failure or success based on configuration. Screenshots are saved with timestamps and status indicators.

## Development Roadmap

The following features are planned for incremental development to enhance the capabilities of Primal Check:

### Phase 2: Enhanced Interactions
- **Smart Navigation**: Instead of a single click, perform a short "walk" through the application (e.g., click -> wait -> click).

### Phase 3: Visual Verification
- **Visual Regression**: Compare current state against a baseline to detect visual changes.
- **AI-Powered Analysis**: Analyze screenshots for potential UI issues or anomalies using AI models.

### Phase 4: Reporting & CLI
- **HTML Reports**: Generate a human-readable report summarizing the run, errors found, and interactions performed.
- **CLI Wrapper**: Allow running Primal Check directly from the command line without writing a test file manually (e.g., `npx primal-check --url https://example.com --mode GORILLA`).

### Phase 5: AI & Intelligent Automation
- **Exploratory Agent**: Autonomous agent that learns to navigate the site effectively using RL or LLM guidance, prioritizing critical user flows over random clicks.
- **Self-Healing Tests**: Using AI to automatically repair selectors or logic when the UI changes, reducing maintenance overhead.

### Phase 6: Performance Profiling
- **Tracing & Web Vitals Integration**: Analyze CDP traces automatically, emitting performance scores (LCP, CLS, FID) alongside test runs to catch degraded metrics early.
