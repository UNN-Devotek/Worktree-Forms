/**
 * Performance Benchmark Utilities for Canvas Grid
 *
 * Tests rendering performance with large datasets to ensure 60fps target
 */

export interface BenchmarkResult {
  averageFps: number;
  minFps: number;
  maxFps: number;
  averageRenderTime: number;
  totalFrames: number;
  duration: number;
  passed: boolean; // true if >= 60fps
}

/**
 * Benchmark canvas rendering performance
 *
 * @param renderFn - Function that triggers a full canvas redraw
 * @param iterations - Number of render cycles to test (default: 1000)
 * @returns BenchmarkResult with FPS and timing metrics
 */
export function benchmarkRendering(
  renderFn: () => void,
  iterations: number = 1000
): BenchmarkResult {
  const frameTimes: number[] = [];
  const fps: number[] = [];

  let lastTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    // Execute render
    renderFn();

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    const currentFps = 1000 / (endTime - lastTime);

    frameTimes.push(renderTime);
    fps.push(currentFps);

    lastTime = endTime;
  }

  // Calculate metrics
  const totalDuration = frameTimes.reduce((sum, time) => sum + time, 0);
  const averageRenderTime = totalDuration / iterations;
  const averageFps = fps.reduce((sum, f) => sum + f, 0) / fps.length;
  const minFps = Math.min(...fps);
  const maxFps = Math.max(...fps);

  return {
    averageFps,
    minFps,
    maxFps,
    averageRenderTime,
    totalFrames: iterations,
    duration: totalDuration,
    passed: averageFps >= 60,
  };
}

/**
 * Benchmark scroll performance by simulating continuous scrolling
 *
 * @param scrollFn - Function that updates viewport scroll position
 * @param scrollDistance - Total pixels to scroll
 * @param scrollStep - Pixels per frame
 * @returns BenchmarkResult
 */
export function benchmarkScrolling(
  scrollFn: (scrollY: number) => void,
  scrollDistance: number = 10000,
  scrollStep: number = 50
): BenchmarkResult {
  const frameTimes: number[] = [];
  const fps: number[] = [];

  let currentScroll = 0;
  let lastTime = performance.now();

  while (currentScroll < scrollDistance) {
    const startTime = performance.now();

    scrollFn(currentScroll);
    currentScroll += scrollStep;

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    const currentFps = 1000 / (endTime - lastTime);

    frameTimes.push(renderTime);
    fps.push(currentFps);

    lastTime = endTime;
  }

  const iterations = frameTimes.length;
  const totalDuration = frameTimes.reduce((sum, time) => sum + time, 0);
  const averageRenderTime = totalDuration / iterations;
  const averageFps = fps.reduce((sum, f) => sum + f, 0) / fps.length;
  const minFps = Math.min(...fps);
  const maxFps = Math.max(...fps);

  return {
    averageFps,
    minFps,
    maxFps,
    averageRenderTime,
    totalFrames: iterations,
    duration: totalDuration,
    passed: averageFps >= 60,
  };
}

/**
 * Format benchmark results for console logging
 */
export function formatBenchmarkResults(result: BenchmarkResult): string {
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';

  return `
Canvas Grid Performance Benchmark ${status}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FPS Metrics:
  Average: ${result.averageFps.toFixed(2)} fps
  Min:     ${result.minFps.toFixed(2)} fps
  Max:     ${result.maxFps.toFixed(2)} fps
  Target:  60 fps (${result.passed ? 'met' : 'not met'})

Render Times:
  Average: ${result.averageRenderTime.toFixed(2)} ms
  Total:   ${result.duration.toFixed(2)} ms
  Frames:  ${result.totalFrames}

Performance Rating: ${getPerformanceRating(result.averageFps)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

function getPerformanceRating(fps: number): string {
  if (fps >= 60) return 'Excellent (60+ fps)';
  if (fps >= 45) return 'Good (45-60 fps)';
  if (fps >= 30) return 'Acceptable (30-45 fps)';
  return 'Poor (<30 fps)';
}
