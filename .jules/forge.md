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
