import { test, expect } from '@playwright/test';
import { HeuristicFuzzer } from '../src/HeuristicFuzzer';

test.describe('HeuristicFuzzer', () => {
  test('should generate mutated strings', () => {
    const original = 'base';
    const mutated = HeuristicFuzzer.mutateString(original);

    // As it returns a random strategy, we just ensure it returns a string
    // and is not equal to original (unless the strategy explicitly makes it same, which none strictly does, except empty string if original was empty, but original is 'base')
    expect(typeof mutated).toBe('string');
    expect(mutated).not.toBe(original);
  });

  test('should generate mutated numbers', () => {
    const mutated = HeuristicFuzzer.mutateNumber();
    expect(typeof mutated).toBe('string');
    // Ensure it's one of the expected variations (which includes string representation of Infinity, etc)
    const possibleValues = [
      '-1', '0',
      Number.MAX_SAFE_INTEGER.toString(),
      Number.MIN_SAFE_INTEGER.toString(),
      '99999999999999999999999',
      '0.0000000001',
      'NaN', 'Infinity', '-Infinity'
    ];
    expect(possibleValues).toContain(mutated);
  });

  test('should test all string heuristic strategies over multiple runs', () => {
    const original = 'test';
    const results = new Set<string>();

    // Run enough times to likely hit all strategies
    for (let i = 0; i < 500; i++) {
      results.add(HeuristicFuzzer.mutateString(original));
    }

    expect(results.size).toBeGreaterThan(5); // At least a few strategies should be hit
    // Check some specific payloads
    expect(results.has("<script>alert(1)</script>")).toBe(true);
    expect(results.has("")).toBe(true);
    expect(results.has("-1")).toBe(true);
  });
});
