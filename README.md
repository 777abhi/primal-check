# Primal Check - Incremental Delivery Backlog

This backlog tracks the development of the Primal Check project. It is designed to be consumed by an AI agent or developer to ensure features are delivered incrementally using Test-Driven Development (TDD).

## Agent Instructions

When picking up a task from this backlog, please follow these guidelines:

1.  **Read the Backlog**: Review the items below to understand the current state of the project.
2.  **Pick an Item**: Select the next available item that is not yet marked as "Done" or "In Progress". Work on items sequentially (1 to 7).
3.  **Follow the Cycle**: Strictly adhere to the **Red-Green-Refactor** cycle as described in the "TDD Task".
    *   **Red**: Write a failing test first. Verify it fails.
    *   **Green**: Implement the minimum code to pass the test. Verify it passes.
    *   **Refactor**: Improve the code quality without changing behavior. Verify tests still pass.
4.  **Update Status**: Mark the item as "Done" in this backlog (change `[ ]` to `[x]`) after successful implementation and verification.

---

## Backlog Items

### Backlog 1: Infrastructure & Contract Definition
**Goal:** Establish the TypeScript "Source of Truth" to satisfy the Interface Segregation principle.
- [ ] **Status**: Todo
- **User Story**: As an Engineer, I need a strictly typed configuration schema so that the AI agent can validate site metadata before execution.
- **TDD Task**: Write a test that fails when an invalid SiteConfig (missing baseUrl or malformed pathMap) is passed to a validator.
- **Incremental Delivery**: A `types.ts` file and a `ConfigValidator` utility.

### Backlog 2: The Navigation & Smoke Foundation (Read-Only)
**Goal:** Implement the Single Responsibility principle for basic site crawling.
- [ ] **Status**: Todo
- **User Story**: As a QA Lead, I want to verify that all mapped paths return a 200 OK status without destructive actions.
- **TDD Task**: Create a mock browser context. Write a test asserting that SmokeEngine identifies a 404 error on a specific path.
- **Incremental Delivery**: `SmokeEngine.ts` capable of iterating through SiteConfig and verifying visibility.

### Backlog 3: Passive Heuristic Monitoring
**Goal:** Automate "observation" without manual assertions.
- [ ] **Status**: Todo
- **User Story**: As a Developer, I want the utility to automatically fail if a console error or a failed network request (4xx/500) occurs during navigation.
- **TDD Task**: Write a test that triggers a `page.emit('console', { type: 'error' })` and confirms the TestResult captures the message.
- **Incremental Delivery**: An updated `SmokeEngine` with global event listeners for `requestfailed` and `console`.

### Backlog 4: Session Persistence & Injection
**Goal:** Enable authenticated testing using Dependency Inversion.
- [ ] **Status**: Todo
- **User Story**: As a Tester, I want to use a pre-saved storageState so that I don't have to re-login for every site context.
- **TDD Task**: Mock the filesystem. Write a test that verifies SessionHandler correctly applies a JSON cookie set to a new Playwright BrowserContext.
- **Incremental Delivery**: `SessionHandler.ts` with methods for `saveState()` and `injectState()`.

### Backlog 5: Visual Regression Layer
**Goal:** Implement pixel-perfect validation with configurable thresholds.
- [ ] **Status**: Todo
- **User Story**: As a UI Designer, I want to compare the current page against a baseline image to detect layout shifts.
- **TDD Task**: Write a test that compares two identical buffers (Pass) and then two different buffers (Fail) based on a 0.5% threshold.
- **Incremental Delivery**: `VisualService.ts` integrated into the main execution flow.

### Backlog 6: The Gorilla Engine (Write-Mode)
**Goal:** Implement randomized mutation logic using Composition.
- [ ] **Status**: Todo
- **User Story**: As a QA Engineer, I want to run randomised UI interactions on Staging to stress-test data integrity.
- **TDD Task**: Write a test asserting that GorillaEngine throws an error if Write-Mode is triggered while the baseUrl contains "production".
- **Incremental Delivery**: `GorillaEngine.ts` featuring a RandomActionStrategy for clicks, fills, and selects.

### Backlog 7: Orchestration & Sample Implementation
**Goal:** The final "Glue" layer to provide a runnable utility.
- [ ] **Status**: Todo
- **User Story**: As a User, I want a single entry point to run multi-site, multi-mode tests via a simple config file.
- **TDD Task**: An integration test that initialises PrimalCheck with two mock sites and asserts that both Smoke and Visual results are returned in a single object.
- **Incremental Delivery**: `index.ts` (Core Orchestrator), `playwright.config.ts`, and a sample `.spec.ts` file.