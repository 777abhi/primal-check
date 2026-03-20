import { test, expect, Page } from '@playwright/test';
import { PrimalEngine } from '../src/PrimalEngine';
import { ExecutionMode, SiteConfig } from '../src/types';

test.describe('Stateful Chaos Modeling', () => {
  let engine: PrimalEngine;
  let page: Page;

  const config: SiteConfig = {
    name: 'Stateful Test Site',
    url: 'http://localhost:3000',
    smartNavigationConfig: {
      enabled: true,
      strategy: 'stateful',
      steps: 10
    }
  };

  test.beforeEach(async ({ page: p }) => {
    page = p;
    engine = new PrimalEngine(page);
  });

  test('should prioritize transitioning to unvisited states using Markov chain simulation', async () => {
    // We will track the transitions internally in the mock page
    // A simple app with 3 states (divs with ids stateA, stateB, stateC)
    // Buttons transition between them.
    await page.route(config.url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <div id="stateA" style="display: block;">
                <h1>State A</h1>
                <button onclick="document.getElementById('stateA').style.display='none'; document.getElementById('stateB').style.display='block'; window.lastTransition='A->B'; window.location.hash='#B';">Go to B</button>
                <button onclick="document.getElementById('stateA').style.display='none'; document.getElementById('stateC').style.display='block'; window.lastTransition='A->C'; window.location.hash='#C';">Go to C</button>
              </div>
              <div id="stateB" style="display: none;">
                <h1>State B</h1>
                <button onclick="document.getElementById('stateB').style.display='none'; document.getElementById('stateA').style.display='block'; window.lastTransition='B->A'; window.location.hash='#A';">Go to A</button>
                <button onclick="document.getElementById('stateB').style.display='none'; document.getElementById('stateC').style.display='block'; window.lastTransition='B->C'; window.location.hash='#C';">Go to C</button>
              </div>
              <div id="stateC" style="display: none;">
                <h1>State C</h1>
                <button onclick="document.getElementById('stateC').style.display='none'; document.getElementById('stateA').style.display='block'; window.lastTransition='C->A'; window.location.hash='#A';">Go to A</button>
                <button onclick="document.getElementById('stateC').style.display='none'; document.getElementById('stateB').style.display='block'; window.lastTransition='C->B'; window.location.hash='#B';">Go to B</button>
              </div>
              <script>
                 window.transitions = [];
                 const originalLog = window.lastTransition;
                 Object.defineProperty(window, 'lastTransition', {
                   set: function(val) {
                     window.transitions.push(val);
                   }
                 });
                 window.location.hash='#A';
              </script>
            </body>
          </html>
        `,
      });
    });

    await engine.run(config, ExecutionMode.GORILLA);

    // Get transitions recorded
    const transitions: string[] = await page.evaluate(() => (window as any).transitions || []);

    // We expect some transitions to happen
    expect(transitions.length).toBeGreaterThan(0);

    // A purely random clicker might click "Go to B" multiple times while on State A (if it fails to transition immediately or redraws).
    // Our stateful navigator tracks specific locators clicked from a given state and biases towards the unclicked ones.
    // In our setup, from State A, there are two choices (B or C). Over 10 steps, the stateful logic
    // ensures we don't just keep clicking the exact same button from the same state if other choices exist.
    // We expect it to explore at least 3 distinct transitions across the system because it actively avoids repeating edges.
    const uniqueTransitions = new Set(transitions);
    expect(uniqueTransitions.size).toBeGreaterThanOrEqual(3);

    // We can also verify it visits all 3 states by inspecting the transitions
    const visitedStates = new Set<string>();
    transitions.forEach(t => {
      visitedStates.add(t.split('->')[0]);
      visitedStates.add(t.split('->')[1]);
    });
    expect(visitedStates.size).toBe(3);
  });

  test('should detect state changes based on structural DOM hashing even when URL remains constant', async () => {
    let loggedStates = 0;

    // We capture the log directly.
    // The console logs in Node might be slightly delayed, so let's use a global counter
    // attached to the page's log interceptor.
    page.on('console', msg => {
      const text = msg.text();
      const match = text.match(/Transition matrix summary: (\d+) states visited/);
      if (match) {
        loggedStates = parseInt(match[1], 10);
      }
    });

    // We override console.log in the Node.js context because the output comes from `src/PrimalEngine.ts`,
    // which runs in Node, NOT in the browser page evaluation.
    const originalLog = console.log;
    console.log = function(...args) {
      const msg = args.join(' ');
      const match = msg.match(/Transition matrix summary: (\d+) states visited/);
      if (match) {
        loggedStates = parseInt(match[1], 10);
      }
      originalLog.apply(console, args);
    };

    await page.route(config.url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <div id="main-view">
                <h1>Main View</h1>
                <button id="open-modal" onclick="document.getElementById('modal').style.display='block'; window.lastTransition='OpenModal';">Open Modal</button>
              </div>
              <div id="modal" style="display: none;">
                <h1>Modal</h1>
                <button id="close-modal" onclick="document.getElementById('modal').style.display='none'; window.lastTransition='CloseModal';">Close Modal</button>
              </div>
              <script>
                 window.transitions = [];
                 Object.defineProperty(window, 'lastTransition', {
                   set: function(val) {
                     window.transitions.push(val);
                   }
                 });
              </script>
            </body>
          </html>
        `,
      });
    });

    await engine.run(config, ExecutionMode.GORILLA);

    // Wait a brief moment to ensure all async console events from Playwright are processed
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ensure the engine made at least one successful transition in the mock app
    const transitions = await page.evaluate(() => (window as any).transitions || []);
    expect(transitions.length).toBeGreaterThan(0);

    // Restore original console.log
    console.log = originalLog;

    // We expect the matrix to show multiple distinct states visited, even without URL changes
    // This asserts that the DOM hashing logic successfully identified the modal open/close as distinct views.
    expect(loggedStates).toBeGreaterThan(1);
  });
});