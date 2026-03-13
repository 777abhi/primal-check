# Forge's Architecture Journal

2024-05-22 - [Architecture Initialization]
Decision: Established `.jules/forge.md` for architectural tracking.
Reasoning: To maintain a clear history of architectural decisions and constraints.
Constraint: All architectural changes must be recorded here.

2024-05-22 - [Form Fuzzing Integration]
Decision: Integrate Form Fuzzing into `GORILLA` mode within `PrimalEngine`.
Reasoning: Form fuzzing is a form of chaos testing, fitting the `GORILLA` mode's purpose. It enhances the random interaction capabilities.
Constraint: Ensure form inputs are filled with valid-ish data to avoid immediate validation errors, but still random enough to stress test.

2026-02-23 - [Visual Verification: Screenshot Capture]
Decision: Implemented `captureScreenshot` in `PrimalEngine` to run after execution.
Reasoning: Visual evidence is crucial for debugging failures and verifying success in automated environments.
Constraint: Filenames must be sanitized to avoid filesystem issues. Screenshots are saved to a configurable directory.

2026-02-23 - [Unified Exports]
Decision: Export `SiteConfig`, `ExecutionMode`, and `ScreenshotConfig` from `src/PrimalEngine.ts`.
Reasoning: Simplifies imports for the user, allowing them to import everything from a single module.
Constraint: Maintain `types.ts` as the source of truth for interfaces, but re-export them.

2026-02-24 - [Scroll & Explore]
Decision: Implement `scrollAndExplore` in `PrimalEngine` and integrate it into `GORILLA` mode.
Reasoning: Many modern applications use lazy loading. Scrolling is essential to discover and interact with elements that are not initially in the viewport or DOM.
Constraint: Implement a safety limit on scrolling (max iterations or timeout) to prevent infinite loops on infinite scroll pages.

2026-02-24 - [Network Chaos]
Decision: Implemented `NetworkChaosConfig` and applied it via `page.route` and `context.setOffline`.
Reasoning: To simulate real-world network instability and test application resilience in `GORILLA` mode.
Constraint: Network chaos settings (latency, failure rate) must be configurable to avoid flaky tests in non-chaos scenarios. Cleanup of routes is implicitly handled by Playwright context closure, but `PrimalEngine` applies them per run.

2026-02-25 - [Accessibility & Compliance]
Decision: Integrate `axe-core` via `@axe-core/playwright` into `READ_ONLY` mode.
Reasoning: To provide automated WCAG compliance checks as part of the health check.
Constraint: Accessibility checks can be heavy, so they should be optional (configured via `AccessibilityConfig`). Violations are logged, and can optionally fail the test based on configuration.

2026-02-25 - [Cookie & LocalStorage Fuzzing]
Decision: Implemented `StorageFuzzer` to randomly clear or mutate cookies and LocalStorage in `GORILLA` mode.
Reasoning: To test application resilience against state corruption or session loss, simulating user tampering or browser issues.
Constraint: Fuzzing is destructive. It should only be enabled via explicit configuration (`StorageFuzzingConfig`) and is restricted to `GORILLA` mode.

2026-02-28 - [Network Traffic Analysis]
Decision: Isolated network traffic monitoring into a separate `NetworkTrafficAnalyzer` class and injected it conditionally via `NetworkTrafficConfig`.
Reasoning: Keeps `PrimalEngine` from becoming a monolithic "god class". Analyzing timing and payloads demands its own local state (like `requestStartTimes`), validating the need for encapsulation.
Constraint: Playwright's `request.timing()` metrics vary based on interceptors (e.g., `page.route()`). Always fallback gracefully to manual `Date.now()` differences when native timings are unreliable or missing.

2026-03-01 - [Smart Navigation Integration]
Decision: Introduced `SmartNavigationConfig` in `PrimalEngine` to optionally loop the random interaction logic in `GORILLA` mode.
Reasoning: A single interaction rarely covers enough of the deep state required for chaos testing. Allowing a configurable series of interactions ("walk") deepens coverage.
Constraint: Between steps, we must wait for network idle to avoid missing dynamically loaded elements, handling potential timeouts safely.

2026-03-02 - [HTML Reporting]
Decision: Implemented `Reporter.ts` to encapsulate HTML report generation, separated from the `PrimalEngine` core.
Reasoning: Separation of concerns. Writing to the filesystem and generating markup is a distinct responsibility from orchestration and chaos testing.
Constraint: Ensure the reporting directory is dynamically configurable and falls back gracefully to a default `./reports`.

2026-03-03 - [CLI Wrapper]
Decision: Created a CLI wrapper in `src/cli.ts` exposed via `bin` in `package.json`.
Reasoning: To allow execution of Primal Check as a standalone utility without requiring a user-written test file. This enhances accessibility and CI integration.
Constraint: The CLI should use process.exit to communicate success (0) or failure (1) cleanly back to the operating system.

2026-03-04 - [API Server Integration]
Decision: Built a lightweight REST API server using Node's built-in `http` module in `src/server.ts`, exposed via `--serve` in the CLI.
Reasoning: To enable Primal Check as a standalone microservice, allowing non-Node systems to orchestrate chaos tests via HTTP calls. Using built-in `http` avoids external dependencies (like Express), adhering to the project's lightweight philosophy.
Constraint: Maintain strict adherence to zero-dependency APIs for core network operations unless absolutely necessary.

2026-03-05 - [Webhooks Integration]
Decision: Implemented `WebhookDispatcher` using Node's native `http` and `https` modules to dispatch run results.
Reasoning: To provide immediate, automated alerting and telemetry to external CI/CD platforms or messaging tools without requiring users to poll the system.
Constraint: Webhook dispatches must be fail-safe; network errors during dispatch should be caught and logged, not crash the entire PrimalEngine test run.

2026-03-06 - [Performance Profiling: Tracing Integration]
Decision: Implemented `TracingConfig` in `PrimalEngine` using Playwright's native `page.context().tracing` APIs.
Reasoning: Collecting Playwright CDP traces (DOM snapshots, network activity, screenshots) is a foundational necessity for debugging test failures and understanding application performance bottlenecks without manually instrumenting the page.
Constraint: The context tracing start/stop operations must be safely enclosed in try/catch to avoid halting the execution flow if stopping the trace file fails due to filesystem permissions or unexpected closure.

2026-03-07 - [Visual Regression Analyzer]
Decision: Built `VisualRegressionAnalyzer` utilizing `pixelmatch` and `pngjs` to compare screenshots.
Reasoning: To provide developers with an automated way to detect unintended visual changes directly within the Primal Check execution suite.
Constraint: Dependencies `pixelmatch` and `pngjs` added. Image resizing implemented to handle differing viewport dimensions safely.

2026-03-08 - [Plugin System Integration]
Decision: Implemented a Plugin System in `PrimalEngine`, allowing dynamic execution of custom chaos strategies via `config.plugins`.
Reasoning: The core engine cannot anticipate every possible chaos testing need. Decoupling chaos strategies into plugins adheres to the Open/Closed Principle, allowing future extensibility without modifying the core logic.
Constraint: Plugins are only executed in `GORILLA` mode and errors thrown within a plugin are safely caught and logged to prevent halting the entire orchestration flow.

2026-03-09 - [Cross-Browser Chaos Matrix]
Decision: Implemented `MatrixOrchestrator` to orchestrate execution across Chromium, Firefox, and WebKit simultaneously via `Promise.all`. Added a `--matrix` flag to CLI and a `matrix` boolean to the API server payload.
Reasoning: Validating application stability across different rendering engines is critical. By handling concurrency outside of `PrimalEngine`, we ensure the engine itself remains focused on a single `Page` execution context while achieving cross-browser chaos orchestration.
Constraint: Ensure all browser instances spawned in the matrix are properly closed in the `finally` block to prevent lingering detached browser processes, even if an individual engine run fails.

2026-03-10 - [Heuristic-based State Fuzzing]
Decision: Introduced `HeuristicFuzzer` and replaced simple random string generation in `ChaosFuzzer` and `StorageFuzzer` with heuristic-based mutations.
Reasoning: Simple random strings do not adequately stress-test boundary conditions or uncover security vulnerabilities (e.g., SQLi, XSS, numerical overflows) during chaos testing.
Constraint: Ensure all string and number fuzzing operations defer to `HeuristicFuzzer` to maintain consistency across the codebase.

2026-03-11 - [Viewport Chaos]
Decision: Implemented `ViewportFuzzer` and integrated `viewportChaosConfig` into `GORILLA` mode.
Reasoning: Modern web applications are highly responsive, and bugs frequently hide behind specific CSS breakpoints. Randomizing the viewport during chaos testing uncovers these hidden elements and layout shifts.
Constraint: Viewport fuzzing must occur early in the GORILLA run (before interaction logic like Smart Navigation) to ensure the DOM layout is settled before interaction attempts.

2026-03-12 - [Multi-Device Swarm Orchestration]
Decision: Implemented SwarmOrchestrator to launch Playwright contexts using mobile device descriptors, alongside geolocation and permission fuzzing, orchestrated via DeviceSwarmConfig.
Reasoning: Mobile usage comprises a massive proportion of web traffic, and many bugs are tied to mobile-specific capabilities like varying geolocation inputs or missing sensor permissions.
Constraint: Browser contexts created in the swarm must be rigorously closed in the finally block to prevent zombie contexts consuming memory.

2026-03-13 - [Exclude Selectors in GORILLA Mode]
Decision: Implemented `excludeSelectors` in `SiteConfig` to selectively ignore elements during random interaction and form fuzzing using Playwright's `:not()` pseudo-class.
Reasoning: GORILLA mode is destructive and unpredictable. Users require a foundational way to prevent the engine from interacting with explicitly dangerous UI elements (like a "Delete Production DB" button) or out-of-scope interactions (like "Logout" loops).
Constraint: When appending exclusions to existing locators, ensure the `:not()` syntax is safely constructed and applied to every part of a comma-separated selector list to guarantee elements are truly ignored.
