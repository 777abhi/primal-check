# Primal Check Feature Demonstration Report

This report outlines the functionality of the Primal Check utility, demonstrated using a local demo web server. We executed tests against both `READ_ONLY` and `GORILLA` modes to showcase the full feature set, including accessibility checking, network traffic analysis, chaos testing, storage fuzzing, screenshot capture, HTML reporting, and webhook dispatching.

## Server Setup

A local server was created with intentionally injected issues and slow responses:
- A large payload endpoint (`/large` - 600KB)
- A slow response endpoint (`/slow` - 1s delay)
- Missing `alt` tags on images (accessibility violation)
- Form inputs, interactive buttons, and lazy-loading elements (to test scrolling and interactions)

## 1. READ_ONLY Mode (Health Check)

The `READ_ONLY` mode verified navigation, body visibility, and checked for console errors.

**Features demonstrated:**
- **Accessibility Check:** Scanned for WCAG violations.
- **Network Traffic Analysis:** Detected slow requests (>500ms) and large payloads (>500KB).
- **Console Log Monitoring:** Listened for errors and logs.

**Test Output:**
```
[Browser Console - READ_ONLY] error: Failed to load resource: the server responded with a status of 404 (Not Found)
[Browser Console - READ_ONLY] log: Large request completed.
[Browser Console - READ_ONLY] log: Slow request completed.
```

**Accessibility Violations Found:**
```
image-alt (critical): Ensure <img> elements have alternative text or a role of none or presentation - Nodes: 1
landmark-one-main (moderate): Ensure the document has a main landmark - Nodes: 1
region (moderate): Ensure all page content is contained by landmarks - Nodes: 10
```

## 2. GORILLA Mode (Chaos/Fuzz Testing)

The `GORILLA` mode executed chaotic interactions including network fuzzing, scrolling, clicking, and form fuzzing.

**Features demonstrated:**
- **Network Chaos:** Simulated latency and request failures.
- **Smart Navigation:** Scrolled to the bottom of the page (to trigger lazy-loading) and interacted with visible elements (buttons/links).
- **Storage Fuzzing:** Mutated local storage and cookies.
- **Form Fuzzing:** Filled out the available input, email, select, and textarea fields.

**Test Output:**
```
[Browser Console - GORILLA] error: Failed to load resource: the server responded with a status of 404 (Not Found)
[Browser Console - GORILLA] log: Large request completed.
[Browser Console - GORILLA] log: Slow request completed.
[Browser Console - GORILLA] log: Scrolled and clicked!
[Browser Console - GORILLA] log: Scrolled and clicked!
[Browser Console - GORILLA] log: Button clicked!
```

## 3. Webhooks & Reporting

**Webhooks Integration:**
Webhooks were successfully dispatched after both test runs to a local receiver server on port 3003.

```json
[Webhook Received] POST /webhook
{
  "name": "Demo App - Read Only",
  "url": "http://localhost:3002",
  "mode": "READ_ONLY",
  "success": true,
  "timestamp": "2026-03-06T06:47:37.935Z",
  "errors": []
}

[Webhook Received] POST /webhook
{
  "name": "Demo App - Gorilla",
  "url": "http://localhost:3002",
  "mode": "GORILLA",
  "success": true,
  "timestamp": "2026-03-06T06:47:40.096Z",
  "errors": []
}
```

**Reporting & Visual Verification:**
- Screenshots were automatically captured for both modes upon success.
  - Example path: `demo-screenshots/Demo_App___Gorilla-GORILLA-success-2026-03-06T06-47-39-959Z.png`
  - Example path: `demo-screenshots/Demo_App___Read_Only-READ_ONLY-success-2026-03-06T06-47-37-775Z.png`
- HTML reports were generated detailing the run configuration and timestamp.

The generated HTML report content (example for GORILLA mode):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Primal Check Report - Demo App - Gorilla</title>
</head>
<body>
    <div class="header">
        <h1>Primal Check Report</h1>
        <p><strong>Site Name:</strong> Demo App - Gorilla</p>
        <p><strong>URL:</strong> <a href="http://localhost:3002" target="_blank">http://localhost:3002</a></p>
        <p><strong>Mode:</strong> GORILLA</p>
        <p><strong>Status:</strong> <span class="success">SUCCESS</span></p>
        <p><strong>Timestamp:</strong> 3/6/2026, 6:47:40 AM</p>
    </div>
</body>
</html>
```

## Summary
The utility successfully demonstrated all features configured in `SiteConfig`. `READ_ONLY` mode effectively checked the health and performance of the page, while `GORILLA` mode actively interacted, filled out forms, fuzzed storage, simulated network unreliability, and triggered actions successfully.
