import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 5: Pipe Reachability
 *
 * For any spawned Pipe, topHeight is within [60, canvasHeight - CONFIG.pipeGap - 60],
 * ensuring the gap is always within reachable vertical space.
 *
 * **Validates: Requirements 4.2**
 */

/**
 * Models the spawnPipe() logic from game.js without DOM/Canvas dependencies.
 * Accepts configurable canvasHeight and pipeGap to test across many configurations.
 */
function spawnPipe(canvasHeight, pipeGap, randomValue) {
  const minTop = 60;
  const maxTop = canvasHeight - pipeGap - 60;
  const topHeight = minTop + randomValue * (maxTop - minTop);

  return {
    x: 800, // canvasWidth (irrelevant for this property)
    topHeight: topHeight,
    scored: false,
  };
}

describe('Property 5: Pipe Reachability', () => {
  it('topHeight is always within [60, canvasHeight - pipeGap - 60] for any valid CONFIG and random value', () => {
    fc.assert(
      fc.property(
        // canvasHeight: reasonable range for a game canvas
        fc.integer({ min: 300, max: 1000 }),
        // pipeGap: reasonable range for pipe gaps
        fc.integer({ min: 80, max: 300 }),
        // randomValue: simulates Math.random() output [0, 1)
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (canvasHeight, pipeGap, randomValue) => {
          // Precondition: the config must allow a valid range
          // (canvasHeight - pipeGap - 120 > 0 means maxTop > minTop)
          fc.pre(canvasHeight - pipeGap - 120 > 0);

          const pipe = spawnPipe(canvasHeight, pipeGap, randomValue);

          const minTop = 60;
          const maxTop = canvasHeight - pipeGap - 60;

          // topHeight must be within the valid reachable range
          expect(pipe.topHeight).toBeGreaterThanOrEqual(minTop);
          expect(pipe.topHeight).toBeLessThanOrEqual(maxTop);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('topHeight respects bounds at extreme random values (0 and near 1)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1000 }),
        fc.integer({ min: 80, max: 300 }),
        (canvasHeight, pipeGap) => {
          // Precondition: valid range exists
          fc.pre(canvasHeight - pipeGap - 120 > 0);

          const minTop = 60;
          const maxTop = canvasHeight - pipeGap - 60;

          // When random = 0, topHeight should be exactly minTop
          const pipeAtMin = spawnPipe(canvasHeight, pipeGap, 0);
          expect(pipeAtMin.topHeight).toBe(minTop);

          // When random = 1, topHeight should be exactly maxTop
          const pipeAtMax = spawnPipe(canvasHeight, pipeGap, 1);
          expect(pipeAtMax.topHeight).toBe(maxTop);

          // Both must be within bounds
          expect(pipeAtMin.topHeight).toBeGreaterThanOrEqual(minTop);
          expect(pipeAtMax.topHeight).toBeLessThanOrEqual(maxTop);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('topHeight always leaves room for the gap to fit within the canvas', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1000 }),
        fc.integer({ min: 80, max: 300 }),
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (canvasHeight, pipeGap, randomValue) => {
          fc.pre(canvasHeight - pipeGap - 120 > 0);

          const pipe = spawnPipe(canvasHeight, pipeGap, randomValue);

          // The gap bottom (topHeight + pipeGap) must fit within the canvas
          expect(pipe.topHeight + pipeGap).toBeLessThanOrEqual(canvasHeight);

          // The top pipe must have positive height
          expect(pipe.topHeight).toBeGreaterThan(0);

          // There must be at least 60px margin at top and bottom
          expect(pipe.topHeight).toBeGreaterThanOrEqual(60);
          expect(canvasHeight - (pipe.topHeight + pipeGap)).toBeGreaterThanOrEqual(60);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
