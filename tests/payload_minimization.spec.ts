import { test, expect } from '@playwright/test';
import { PayloadMinimizer } from '../src/PayloadMinimizer';

test.describe('Payload Minimizer', () => {

  test('should shrink a payload to the minimal failing state', async () => {
    const originalPayload = 'A'.repeat(100);
    // Our target "bug" triggers if the payload is length > 10
    const testFn = async (payload: string): Promise<boolean> => {
      if (payload.length > 10) {
         return true; // "Failed"
      }
      return false; // Did not fail
    };

    const minimizer = new PayloadMinimizer();
    const minimal = await minimizer.minimize(originalPayload, testFn);

    expect(minimal.length).toBe(11);
  });

  test('should shrink a payload to a specific substring that causes failure', async () => {
    const originalPayload = 'Some safe text with <script>alert(1)</script> embedded';
    // Our target "bug" triggers if the payload contains `<script>`
    const testFn = async (payload: string): Promise<boolean> => {
      if (payload.includes('<script>')) {
         return true; // "Failed"
      }
      return false; // Did not fail
    };

    const minimizer = new PayloadMinimizer();
    const minimal = await minimizer.minimize(originalPayload, testFn);

    // The exact minimal substring might vary depending on the minimization algorithm,
    // but it should definitely be shorter than the original and contain `<script>`.
    // The simplest algorithm would just return `<script>`.
    expect(minimal.length).toBeLessThan(originalPayload.length);
    expect(minimal).toContain('<script>');
  });

  test('should return original payload if no subset fails', async () => {
    const originalPayload = 'A'.repeat(100);
    // Our target "bug" triggers ONLY on the exact original payload
    const testFn = async (payload: string): Promise<boolean> => {
      if (payload === originalPayload) {
         return true; // "Failed"
      }
      return false; // Did not fail
    };

    const minimizer = new PayloadMinimizer();
    const minimal = await minimizer.minimize(originalPayload, testFn);

    expect(minimal).toBe(originalPayload);
  });

});
