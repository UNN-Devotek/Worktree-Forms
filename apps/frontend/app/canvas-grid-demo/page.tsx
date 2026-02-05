'use client';

import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { CanvasGrid, CanvasGridRef, useBenchmark } from '@/features/sheets/components/canvas-grid';

export default function CanvasGridDemoPage() {
  const [yjsDoc, setYjsDoc] = useState<Y.Doc | null>(null);
  const [testDataSize, setTestDataSize] = useState<number>(100);
  const gridRef = useRef<CanvasGridRef>(null);
  const { isRunning, renderResult, scrollResult, runFullBenchmark } = useBenchmark();

  useEffect(() => {
    // Create a new Yjs document
    const doc = new Y.Doc();
    setYjsDoc(doc);

    return () => {
      doc.destroy();
    };
  }, []);

  const handleBenchmark = () => {
    if (!gridRef.current) return;

    runFullBenchmark(
      () => gridRef.current?.forceRender(),
      (scrollY) => gridRef.current?.setViewportScroll(scrollY)
    );
  };

  const loadLargeDataset = () => {
    setTestDataSize(10000);
  };

  if (!yjsDoc) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading canvas grid...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Canvas Grid - Phase 3 Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Formula engine with HyperFormula, keyboard navigation, cell editing, copy/paste, accessibility, and theme awareness.
          </p>
        </div>

        {/* Features info */}
        <div className="mb-6 grid grid-cols-6 gap-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-700">
            <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">🧮 Formulas</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">SUM, AVERAGE, IF, math ops</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">⌨️ Keyboard Nav</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Arrows, Tab, Enter, typing</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">✏️ Cell Editing</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Inline editor with focus</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">📋 Copy/Paste</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Ctrl+C/V TSV format</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">♿ Accessible</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Screen reader support</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">🎨 Theme Aware</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Light/dark adaptive</div>
          </div>
        </div>

        {/* Performance Benchmark */}
        <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">
            ⚡ Performance Benchmark
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={loadLargeDataset}
              disabled={testDataSize === 10000}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {testDataSize === 10000 ? '✅ 10,000 Rows Loaded' : 'Load 10,000 Rows'}
            </button>
            <button
              onClick={handleBenchmark}
              disabled={isRunning || !gridRef.current}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isRunning ? '⏳ Running...' : '🏁 Run Benchmark'}
            </button>
            <span className="text-xs text-purple-700 dark:text-purple-300">
              Current: {testDataSize.toLocaleString()} rows
            </span>
          </div>
          {(renderResult || scrollResult) && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {renderResult && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700">
                  <div className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Render Performance
                  </div>
                  <div className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                    <div>FPS: <span className={renderResult.passed ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{renderResult.averageFps.toFixed(2)}</span></div>
                    <div>Min: {renderResult.minFps.toFixed(2)} fps</div>
                    <div>Max: {renderResult.maxFps.toFixed(2)} fps</div>
                    <div>Status: {renderResult.passed ? '✅ PASSED' : '❌ FAILED'}</div>
                  </div>
                </div>
              )}
              {scrollResult && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700">
                  <div className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Scroll Performance
                  </div>
                  <div className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                    <div>FPS: <span className={scrollResult.passed ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{scrollResult.averageFps.toFixed(2)}</span></div>
                    <div>Min: {scrollResult.minFps.toFixed(2)} fps</div>
                    <div>Max: {scrollResult.maxFps.toFixed(2)} fps</div>
                    <div>Status: {scrollResult.passed ? '✅ PASSED' : '❌ FAILED'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Canvas Grid */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <CanvasGrid
            ref={gridRef}
            yjsDoc={yjsDoc}
            sheetId="demo-sheet-1"
            width={1200}
            height={600}
            testDataRows={testDataSize}
          />
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🎯 Phase 3 Success Criteria
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>✅ Formula evaluation with HyperFormula (SUM, AVERAGE, IF, math ops)</li>
            <li>✅ Display computed values in cells, formulas in editor</li>
            <li>✅ Error codes shown for invalid formulas (#DIV/0!, #REF!, #NAME?)</li>
            <li>✅ Formulas update reactively when dependencies change</li>
            <li>✅ Arrow keys navigate cells (up/down/left/right)</li>
            <li>✅ Tab moves to next cell, Shift+Tab moves back</li>
            <li>✅ Enter starts editing, Escape cancels</li>
            <li>✅ Instant typing replaces cell value</li>
            <li>✅ Ctrl+C copies selection, Ctrl+V pastes</li>
            <li>✅ Screen reader accessible with ARIA labels</li>
            <li>✅ Theme-aware canvas rendering (light/dark mode)</li>
          </ul>
        </div>

        {/* How to test */}
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            🧪 How to Test
          </h3>
          <div className="text-xs text-green-800 dark:text-green-200 space-y-2">
            <div>
              <strong>Formula Examples:</strong> Scroll to rows 1-25 to see pre-loaded formula examples (SUM, AVERAGE, IF, math ops, errors).
            </div>
            <div>
              <strong>Create Formula:</strong> Type =SUM(C3:C5) in any cell and press Enter to see computed result. Edit the cell to see the formula string.
            </div>
            <div>
              <strong>Navigation:</strong> Click a cell, then use arrow keys to move around. Try Tab and Shift+Tab.
            </div>
            <div>
              <strong>Editing:</strong> Press Enter on a cell, or just start typing. Press Enter/Tab to commit, Escape to cancel.
            </div>
            <div>
              <strong>Copy/Paste:</strong> Select a cell or range (Shift+arrows), press Ctrl+C, move to another cell, press Ctrl+V.
            </div>
            <div>
              <strong>Delete:</strong> Press Delete or Backspace to clear a cell.
            </div>
            <div>
              <strong>Theme:</strong> Toggle between light/dark mode to see the canvas grid adapt its colors automatically.
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            📋 Next: Phase 4 - Rich Formatting
          </h3>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Font styling (bold, italic, font family, size)</li>
            <li>• Cell colors (text color, background color)</li>
            <li>• Borders (top, right, bottom, left)</li>
            <li>• Merged cells with spanning logic</li>
            <li>• Column resize handles</li>
            <li>• Insert/delete rows and columns</li>
            <li>• Undo/redo with Yjs UndoManager</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
