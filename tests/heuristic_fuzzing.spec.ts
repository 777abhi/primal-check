import { test, expect } from '@playwright/test';
import { HeuristicFuzzer } from '../src/HeuristicFuzzer';

test.describe('HeuristicFuzzer', () => {
  test('should generate mutated strings', () => {
    const original = 'base';
    const fuzzer = new HeuristicFuzzer();
    const result = fuzzer.mutateString(original);

    expect(typeof result.value).toBe('string');
    expect(typeof result.strategy).toBe('string');
    expect(result.value).not.toBe(original);
  });

  test('should generate mutated numbers', () => {
    const fuzzer = new HeuristicFuzzer();
    const result = fuzzer.mutateNumber();
    const mutated = result.value;
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
    const fuzzer = new HeuristicFuzzer();

    // Run enough times to likely hit all strategies
    for (let i = 0; i < 500; i++) {
      results.add(fuzzer.mutateString(original).value);
    }

    expect(results.size).toBeGreaterThan(5); // At least a few strategies should be hit
    // Check some specific payloads
    expect(results.has("<script>alert(1)</script>")).toBe(true);
    expect(results.has("")).toBe(true);
    expect(results.has("-1")).toBe(true);
  });

  test('should dynamically adjust weights when recordFailure is called', () => {
    const fuzzer = new HeuristicFuzzer();

    // Get initial weight of 'NullByte' strategy
    const initialWeight = fuzzer.getWeight('NullByte');
    expect(initialWeight).toBe(1.0);

    // Record multiple failures
    fuzzer.recordFailure('NullByte');
    fuzzer.recordFailure('NullByte');

    const newWeight = fuzzer.getWeight('NullByte');
    expect(newWeight).toBeLessThan(initialWeight);
    expect(newWeight).toBeGreaterThanOrEqual(0);

    // Ensure that it's statistically less likely to be chosen now.
    // Instead of complex statistical checks, we can just ensure the weight updated correctly.
    expect(fuzzer.getWeight('NullByte')).toBeCloseTo(0.25, 2); // 1.0 -> 0.5 -> 0.25
  });
});
