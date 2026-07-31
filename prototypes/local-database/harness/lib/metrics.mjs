export function createMetrics() {
  const marks = new Map();
  return {
    mark(name) {
      marks.set(name, performance.now());
    },
    measure(name, startMark) {
      const start = marks.get(startMark);
      if (start === undefined) throw new Error(`Missing mark: ${startMark}`);
      return performance.now() - start;
    },
    async timed(name, fn) {
      const start = performance.now();
      const result = await fn();
      const durationMs = performance.now() - start;
      return { name, durationMs, result };
    },
  };
}

export function summarizeRuns(runs) {
  const durations = runs.map((r) => r.durationMs);
  durations.sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);
  return {
    count: durations.length,
    minMs: durations[0] ?? 0,
    maxMs: durations[durations.length - 1] ?? 0,
    avgMs: durations.length ? sum / durations.length : 0,
    p50Ms: durations[Math.floor(durations.length * 0.5)] ?? 0,
    p95Ms: durations[Math.floor(durations.length * 0.95)] ?? 0,
  };
}
