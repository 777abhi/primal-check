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
