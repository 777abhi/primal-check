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
- **Smart Navigation**: Performs a configurable series of interactions ("walk") by identifying and interacting with random visible elements instead of a single interaction.
- **Resilience**: Warns rather than failing if no interactive elements are found.

### Visual Verification
- **Screenshot Capture**: Automatically capture screenshots on failure or success based on configuration. Screenshots are saved with timestamps and status indicators.
- **Visual Regression**: Compares current page state against a baseline image, logging a diff and optionally failing the run if visual changes exceed a defined threshold. Powered by `pixelmatch` and `pngjs`. Configured via `visualRegressionConfig`.

## Development Roadmap

The following features are planned for incremental development to enhance the capabilities of Primal Check:

### 6. Webhooks Integration
- **Webhooks**: Automatically dispatch test run results and JSON payloads to external CI/CD platforms or messaging services (like Slack/Discord) upon completion. Configure via `webhookConfig` (enabled, url, method, headers).

### 7. Performance Profiling
- **Tracing Integration**: Automatically analyze Playwright CDP traces by emitting trace zip files alongside test runs to catch degraded metrics early. Configured via `tracingConfig` (enabled, directory).

### 3. Reporting
- **HTML Reports**: Generates a human-readable HTML report summarizing the run, including the URL, mode, timestamp, success status, and any errors recorded. Configured via `reportConfig` (enabled, directory).

### 4. CLI Wrapper
- **Standalone Execution**: Run Primal Check directly from the command line without writing a test file manually (e.g., `npx primal-check --url https://example.com --mode GORILLA`).

### 5. API Server Integration
- **REST API**: Expose PrimalEngine capabilities over a lightweight HTTP server, allowing non-Node.js systems to trigger chaos tests and retrieve results via API calls. Start the server using the CLI: `npx primal-check --serve --port 3000`. Send a POST request to `/run` with `{ "config": { "name": "Site", "url": "..." }, "mode": "GORILLA" }` to execute tests dynamically.

### Phase 6: AI & Intelligent Automation
- **Exploratory Agent**: Autonomous agent that learns to navigate the site effectively using RL or LLM guidance, prioritizing critical user flows over random clicks.
- **Self-Healing Tests**: Using AI to automatically repair selectors or logic when the UI changes, reducing maintenance overhead.

### Phase 3: Visual Verification
- **AI-Powered Analysis**: Analyze screenshots for potential UI issues or anomalies using AI models.

### Phase 7: Cloud Integration
- **Distributed Chaos**: Support running multiple Primal Check instances concurrently in cloud environments (e.g., AWS Fargate, GCP Cloud Run) to perform distributed load and chaos testing.

### Phase 8: AI-Driven Auto-Repair
- **Self-Healing Locators**: Use LLMs to dynamically suggest and apply new robust locators when UI elements change, reducing the brittleness of test automation.

### Phase 11: Real-time Dashboard
- **Telemetry & Visualization**: Create a lightweight web dashboard to aggregate webhook payloads and visualize test history, success rates, and performance trends over time.

### Phase 12: Distributed Load Generation
- **Serverless Swarm**: Automatically provision and coordinate thousands of ephemeral Playwright instances across serverless providers (AWS Lambda, Google Cloud Run) to perform massive-scale, synchronized load and chaos testing from multiple global regions.

### Phase 13: Auto-Generated Chaos Plugins
- **Dynamic Extensibility**: Dynamically download, verify, and execute community-driven chaos testing modules at runtime, allowing users to extend the GORILLA mode interactively without updating the core package.
