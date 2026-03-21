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
- **Cookie & LocalStorage Fuzzing**: Randomly clear or use heuristic-based mutations (SQLi, XSS, overflow) on cookies and local storage to test state persistence and session handling.
- **Viewport Chaos**: Dynamically randomizes the browser viewport to stress-test responsive breakpoints and uncover hidden element bugs during execution. Configured via `viewportChaosConfig`.
- **Smart Navigation**: Performs a configurable series of interactions ("walk") by identifying and interacting with random visible elements instead of a single interaction. Configurable with an `exploratory` strategy to act as an **Exploratory Agent**, prioritizing unvisited elements and critical user flows over purely random clicks.
- **Plugin System**: Dynamically load and execute custom `PrimalPlugin` objects directly into the GORILLA mode engine without altering the core library.
- **Cross-Browser Chaos Matrix**: Run configurations concurrently across Chromium, WebKit, and Firefox using the `--matrix` CLI flag or `matrix: true` via API.
- **Multi-Device Swarm**: Orchestrate concurrent chaos tests across multiple emulated Playwright device profiles (e.g., 'iPhone 12', 'Pixel 5') with randomized geolocation and permissions fuzzing. Configured via `deviceSwarmConfig`.
- **Exclude Selectors**: Pass an array of CSS selectors via `excludeSelectors` in `SiteConfig` to prevent GORILLA mode from interacting with dangerous or out-of-scope elements (like "Delete Account" buttons).
- **DOM State Checkpointing**: Checkpoints the DOM state before destructive actions and restores it seamlessly if the interaction yields an unrecoverable crash, enabling longer continuous chaos sessions. Configured via `domCheckpointConfig`.
- **Resilience**: Warns rather than failing if no interactive elements are found.
- **Fuzzing Payload Minimization**: When a fuzzing payload causes an interaction error (e.g., input rejection), Primal Check automatically attempts to shrink the size of the payload to find the minimal reproducible string for easier debugging.
- **Stateful Chaos Modeling**: Beyond simple random clicks, implements a basic state machine (Markov Chain approach) that learns the probability of moving from one view to another and dynamically tracks transitions, simulating real user session flows and providing a mechanism to bias interactions. Configurable via `smartNavigationConfig.strategy = 'stateful'`. Uses lightweight structural DOM hashing to detect sub-states (e.g., modals) even when URLs do not change.
- **Real-time Threat Intelligence**: Dynamically download and inject known vulnerability payloads from external JSON feeds into chaos runs, allowing tests to stay updated with current exploits without package updates. Configured via `threatIntelligenceConfig`.

### Integrations and Analytics
- **Webhooks**: Automatically dispatch test run results and JSON payloads to external CI/CD platforms or messaging services. Configured via `webhookConfig`.
- **Tracing Integration**: Emits Playwright CDP trace zip files alongside test runs to catch degraded metrics early. Configured via `tracingConfig`.
- **HTML Reports**: Generates a human-readable HTML report summarizing the run. Configured via `reportConfig`.
- **CLI Wrapper**: Run Primal Check directly from the command line (e.g., `npx primal-check --url https://example.com --mode GORILLA`).
- **API Server Integration**: Expose PrimalEngine capabilities over a lightweight REST API via `npx primal-check --serve --port 3000`. Send a POST to `/run` to execute tests dynamically.

### Visual Verification
- **Screenshot Capture**: Automatically capture screenshots on failure or success based on configuration. Screenshots are saved with timestamps and status indicators.
- **Visual Regression**: Compares current page state against a baseline image, logging a diff and optionally failing the run if visual changes exceed a defined threshold. Powered by `pixelmatch` and `pngjs`. Configured via `visualRegressionConfig`.

## Development Roadmap

The following features are planned for incremental development to enhance the capabilities of Primal Check:

### Phase 6: AI & Intelligent Automation
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

### Phase 16: Intelligent Exploit Generation
- **Automated Exploit chaining**: Beyond heuristics, use a local LLM to string together discovered vulnerabilities (e.g., finding an XSS via HeuristicFuzzer and attempting to weaponize it to steal the session token).

### Phase 20: Heuristic Self-Correction
- **Dynamic Mutation Adjustments**: Implement an AI mechanism to track failing heuristics (like protocol errors on invalid cookie values) and adaptively adjust subsequent fuzzing payloads in real time, preventing repeated failures for the same root cause.

### Phase 21: Auto-Generated Chaos Strategies
- **Dynamic AI Prompting**: Utilize LLMs to automatically generate custom plugin strategies per-run by reading the site's initial DOM structure and suggesting tailored chaos actions.

### Phase 24: Intelligent DOM Snapshot Diffing
- **Semantic State Comparison**: Beyond simple pixel matching, implement an intelligent comparison of DOM state checkpoints to understand if two visual views are structurally the same but populated with different data, reducing false positives in chaos reporting.

### Phase 27: Self-Updating Exploit Kits (Future Improvement)
- **Zero-Day Auto-Generation**: Hook into a local LLM or API to read CVE descriptions and automatically synthesize functional Playwright interactions to test for those exact vulnerabilities within hours of disclosure, moving beyond static payloads.
