# Primal Check - User Guide for Exploratory Testers

Welcome to Primal Check! This guide is designed to help manual Exploratory Testers get up and running quickly with our lightweight, reliable QA automation utility. Primal Check will help you uncover hidden bugs and test the resilience of your web applications through structured chaos testing.

## Prerequisites

Before you begin testing, ensure you have the following installed and set up on your machine:

1. **Node.js**: Download and install Node.js from the [official website](https://nodejs.org/).
2. **Access to the Terminal/Command Prompt**: You will need to run a few commands to set up the tool.
3. **Primal Check Repository**: Ensure you have cloned or downloaded the Primal Check repository to your local machine.
4. **Initial Setup**: Open your terminal, navigate to the Primal Check repository directory, and run the following commands to install dependencies and browser binaries:
   ```bash
   npm install
   npx playwright install
   npm run build
   ```

---

## Core Features Overview

Primal Check offers several powerful modes to test your application:

*   **READ_ONLY Mode (Health Check)**: Best for smoke testing. It verifies navigation, checks for console errors, and performs basic accessibility scans without altering the state of your application.
*   **GORILLA Mode (Chaos/Fuzz Testing)**: The heavy hitter. It simulates chaotic user behavior by clicking randomly, fuzzing forms with weird data, testing under network latency, and randomizing the viewport.
*   **Matrix Mode**: Runs your tests across multiple browsers (Chromium, Firefox, WebKit) simultaneously.

---

## Step-by-Step Instructions

### 1. Running a Basic Health Check (READ_ONLY Mode)

Use this mode to quickly verify that a page loads correctly without any underlying console or accessibility errors.

1.  **Open** your terminal.
2.  **Navigate** to the Primal Check project directory.
3.  **Run** the following command, replacing the URL with the application you want to test:
    ```bash
    npx primal-check --url https://your-test-url.com --mode READ_ONLY
    ```
4.  **Review** the output in your terminal. You should see logs indicating navigation success, any console errors found, and accessibility warnings.

*[Screenshot Placeholder: Terminal window showing the successful execution of the READ_ONLY command, highlighting the "Primal Check completed successfully." message and any logged accessibility/console checks.]*

**Pro-Tip**: Use READ_ONLY mode after every major deployment to ensure the critical paths are still functioning before diving into deeper exploratory testing.

### 2. Unleashing Chaos (GORILLA Mode)

Use this mode to aggressively test form validation, layout stability, and state persistence under unpredictable conditions.

1.  **Open** your terminal.
2.  **Navigate** to the Primal Check project directory.
3.  **Run** the following command, replacing the URL with your target application:
    ```bash
    npx primal-check --url https://your-test-url.com --mode GORILLA
    ```
4.  **Observe** the terminal output. You will see logs detailing the actions taken, such as "Scrolling to bottom", "Fuzzing forms", "Network offline mode simulated", and "Random interaction triggered".
5.  **Check** the `screenshots/` directory (if configured) for visual captures of any failures or anomalies detected during the chaos run.

*[Screenshot Placeholder: Terminal window showing the GORILLA mode execution, highlighting logs of chaotic actions like form fuzzing or simulated network failures.]*

**Pro-Tip**: GORILLA mode is excellent for finding edge cases in form submissions. Let it run against complex forms to see how your backend and frontend handle unexpected inputs (like XSS payloads or excessively long strings).

### 3. Testing Across Browsers (Matrix Mode)

Ensure your application behaves consistently across Chrome, Firefox, and Safari.

1.  **Open** your terminal.
2.  **Navigate** to the Primal Check project directory.
3.  **Run** the following command to execute a GORILLA test across all supported browsers simultaneously:
    ```bash
    npx primal-check --url https://your-test-url.com --mode GORILLA --matrix
    ```
4.  **Review** the terminal summary at the end of the run. It will list the success or failure status for each browser independently.

*[Screenshot Placeholder: Terminal window showing the final output of a `--matrix` run, highlighting the summary section with results for Chromium, Firefox, and WebKit.]*

**Pro-Tip**: Run Matrix mode overnight or during a lunch break, as testing concurrently across three browsers consumes more system resources and takes slightly longer.

---

## Troubleshooting

Here are a few common issues you might encounter during your first setup or test run:

*   **Error: `playwright: command not found` or similar browser issues.**
    *   *Solution*: Ensure you ran `npx playwright install` during the prerequisites step. This downloads the necessary browser binaries (Chromium, Firefox, WebKit) required for testing.
*   **Error: `Cannot find module './dist/src/cli.js'`**
    *   *Solution*: You need to compile the TypeScript code. Run `npm run build` in the root directory before trying to execute `npx primal-check`.
*   **The test fails immediately with a "Navigation timeout" error.**
    *   *Solution*: Double-check the `--url` you provided. Ensure it includes the protocol (e.g., `http://` or `https://`) and that the application is currently reachable from your network.
*   **GORILLA mode fails on a specific, critical element (like a "Delete Account" button).**
    *   *Solution*: For advanced use, you can configure `excludeSelectors` in the underlying code to tell the chaos engine to ignore specific dangerous buttons. For manual CLI runs, ensure you are testing in a safe staging environment.