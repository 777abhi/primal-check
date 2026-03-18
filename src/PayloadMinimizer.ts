export class PayloadMinimizer {
  /**
   * Minimizes a string payload using a delta-debugging-like algorithm.
   * Finds a smaller substring that still causes `testFn` to return `true`.
   * @param payload The original string payload that caused a failure
   * @param testFn Async function that returns `true` if the payload fails, `false` otherwise
   * @returns The minimal failing string found
   */
  async minimize(payload: string, testFn: (payload: string) => Promise<boolean>): Promise<string> {
    // If the full payload doesn't fail, we can't minimize.
    if (!(await testFn(payload))) {
      return payload;
    }

    let minimal = payload;

    // Try a simple character-by-character reduction (O(N^2) worst case but fine for typical payloads)
    // We try removing one character from the start or end, or chunks.
    // Let's implement a binary splitting approach.

    // Delta Debugging (ddmin) inspired approach:
    // 1. Try testing chunks directly (if a subset alone triggers it).
    // 2. Try removing chunks (if removing it still triggers it).
    // 3. Repeat with smaller chunks.

    let n = 2; // initial number of chunks
    while (minimal.length >= 2 && n <= minimal.length) {
      let chunkLength = Math.max(1, Math.floor(minimal.length / n));
      let someChunkFailed = false;

      // First, try testing chunks directly
      for (let i = 0; i < n; i++) {
        let start = i * chunkLength;
        let end = (i === n - 1) ? minimal.length : start + chunkLength;
        let chunk = minimal.substring(start, end);

        if (chunk.length < minimal.length) {
          if (await testFn(chunk)) {
            minimal = chunk;
            n = 2; // Restart with the new smaller string
            someChunkFailed = true;
            break;
          }
        }
      }

      if (someChunkFailed) continue;

      // Next, try removing chunks
      for (let i = 0; i < n; i++) {
        let start = i * chunkLength;
        let end = (i === n - 1) ? minimal.length : start + chunkLength;

        let prefix = minimal.substring(0, start);
        let suffix = minimal.substring(end);
        let testString = prefix + suffix;

        if (testString.length < minimal.length) {
          if (await testFn(testString)) {
            minimal = testString;
            n = Math.max(2, n - 1); // Decrease n to explore larger chunks again
            someChunkFailed = true;
            break;
          }
        }
      }

      if (!someChunkFailed) {
        if (n === minimal.length) {
          break; // We've tried testing and removing every single character, none failed.
        }
        n = Math.min(n * 2, minimal.length); // Increase n (smaller chunks)
      }
    }

    return minimal;
  }
}
