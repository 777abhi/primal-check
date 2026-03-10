export class HeuristicFuzzer {
  static mutateString(original: string): string {
    const strategies = [
      () => original + "' OR 1=1 --", // SQLi
      () => "<script>alert(1)</script>", // XSS
      () => "A".repeat(10000), // Massive blob
      () => "", // Empty string
      () => "../../../etc/passwd", // Path traversal
      () => original + "\0", // Null byte
      () => "undefined",
      () => "null",
      () => "NaN",
      () => "-1", // Negative ID heuristic
      () => "\u202E" + original, // Right-to-Left Override
      () => original.repeat(100), // Repetition
      () => '{"__proto__": {"isAdmin": true}}' // Prototype pollution
    ];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return strategy();
  }

  static mutateNumber(): string {
    const strategies = [
      () => "-1",
      () => "0",
      () => Number.MAX_SAFE_INTEGER.toString(),
      () => Number.MIN_SAFE_INTEGER.toString(),
      () => "99999999999999999999999", // Overflow
      () => "0.0000000001", // Underflow / Precision
      () => "NaN",
      () => "Infinity",
      () => "-Infinity"
    ];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return strategy();
  }
}
