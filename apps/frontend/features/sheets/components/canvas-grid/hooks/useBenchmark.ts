/**
 * React hook for running canvas grid performance benchmarks
 */

import { useState, useCallback } from 'react';
import { benchmarkRendering, benchmarkScrolling, BenchmarkResult, formatBenchmarkResults } from '../utils/benchmark';

export interface UseBenchmarkReturn {
  isRunning: boolean;
  renderResult: BenchmarkResult | null;
  scrollResult: BenchmarkResult | null;
  runRenderBenchmark: (renderFn: () => void, iterations?: number) => void;
  runScrollBenchmark: (scrollFn: (scrollY: number) => void, distance?: number, step?: number) => void;
  runFullBenchmark: (renderFn: () => void, scrollFn: (scrollY: number) => void) => void;
}

export function useBenchmark(): UseBenchmarkReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [renderResult, setRenderResult] = useState<BenchmarkResult | null>(null);
  const [scrollResult, setScrollResult] = useState<BenchmarkResult | null>(null);

  const runRenderBenchmark = useCallback((renderFn: () => void, iterations: number = 1000) => {
    setIsRunning(true);
    setRenderResult(null);

    // Run benchmark on next frame to avoid blocking
    requestAnimationFrame(() => {
      const result = benchmarkRendering(renderFn, iterations);
      setRenderResult(result);
      setIsRunning(false);

      // Log results to console
      console.log(formatBenchmarkResults(result));
    });
  }, []);

  const runScrollBenchmark = useCallback((
    scrollFn: (scrollY: number) => void,
    distance: number = 10000,
    step: number = 50
  ) => {
    setIsRunning(true);
    setScrollResult(null);

    requestAnimationFrame(() => {
      const result = benchmarkScrolling(scrollFn, distance, step);
      setScrollResult(result);
      setIsRunning(false);

      console.log('Scroll Benchmark:');
      console.log(formatBenchmarkResults(result));
    });
  }, []);

  const runFullBenchmark = useCallback((
    renderFn: () => void,
    scrollFn: (scrollY: number) => void
  ) => {
    setIsRunning(true);
    setRenderResult(null);
    setScrollResult(null);

    console.log('🏁 Starting Full Canvas Grid Benchmark...');
    console.log('📊 Testing 10,000 rows with virtual scrolling\n');

    requestAnimationFrame(() => {
      // Render benchmark
      const renderRes = benchmarkRendering(renderFn, 1000);
      setRenderResult(renderRes);
      console.log('1️⃣ Render Benchmark:');
      console.log(formatBenchmarkResults(renderRes));
      console.log('\n');

      // Scroll benchmark
      requestAnimationFrame(() => {
        const scrollRes = benchmarkScrolling(scrollFn, 10000, 50);
        setScrollResult(scrollRes);
        console.log('2️⃣ Scroll Benchmark:');
        console.log(formatBenchmarkResults(scrollRes));
        console.log('\n');

        setIsRunning(false);

        // Overall summary
        const bothPassed = renderRes.passed && scrollRes.passed;
        console.log(bothPassed ? '✅ All benchmarks PASSED' : '⚠️ Some benchmarks FAILED');
        console.log(`Overall FPS: ${((renderRes.averageFps + scrollRes.averageFps) / 2).toFixed(2)} fps`);
      });
    });
  }, []);

  return {
    isRunning,
    renderResult,
    scrollResult,
    runRenderBenchmark,
    runScrollBenchmark,
    runFullBenchmark,
  };
}
