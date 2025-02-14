import { Grid } from "../App";
import type { PathfindingResult } from "./types.ts";

/** Benchmark results for an algorithm. */
export type BenchmarkResult = {
  averageTime: number;
  bestTime: number;
  worstTime: number;
  runs: number[];
};

/**
 * Runs the provided algorithm several times on a cloned grid and returns benchmarking statistics.
 */
export function benchmarkAlgorithm(
  algorithm: (grid: Grid) => PathfindingResult | undefined,
  grid: Grid,
  iterations: number = 10
): BenchmarkResult {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    // Clone grid to avoid residual state between runs.
    const gridClone = grid.clone();
    // (Optional) Reset each node’s pathfinding properties here if needed.
    const startTime = performance.now();
    algorithm(gridClone);
    const endTime = performance.now();
    times.push(endTime - startTime);
  }
  const total = times.reduce((sum, t) => sum + t, 0);
  return {
    averageTime: total / iterations,
    bestTime: Math.min(...times),
    worstTime: Math.max(...times),
    runs: times,
  };
}
