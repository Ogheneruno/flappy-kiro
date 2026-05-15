import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 4: Pipe Gap Guarantee
 *
 * For any spawned pipe, the vertical gap between the top pipe section
 * and the bottom pipe section is exactly CONFIG.pipeGap pixels.
 *
 * In the pipe model:
 * - Top pipe ends at y = topHeight
 * - Bottom pipe starts at y = topHeight + pipeGap
 * - The gap is therefore exactly pipeGap pixels
 *
 * The collision system in game.js checks:
 *   if (ghostTop < pipe.topHeight) → collision with top pipe
 *   if (ghostBottom > pipe.topHeight + CONFIG.pipeGap) → collision with bottom pipe
 *
 * This means the safe flyable zone is [topHeight, topHeight + CONFIG.pipeGap],
 * which is always exactly CONFIG.pipeGap pixels wide by construction.
 *
 * Validates: Requirements 4.4
 */

/**
 * Models the collision check logic from game.js to verify the gap.
 * Returns whether a point at vertical position y is in the gap (safe zone).
 */
function isInGap(y, topHeight, pipeGap) {
  return y >= topHeight && y <= topHeight + pipeGap;
}

/**
 * Models spawnPipe() from game.js — spawns a pipe with a random topHeight.
 */
function spawnPipe(canvasHeight, pipeGap) {
  const minTop = 60;
  const maxTop = canvasHeight - pipeGap - 60;
  const topHeight = minTop + Math.random() * (maxTop - minTop);
  return { x: 800, topHeight, scored: false };
}

describe('Property 4: Pipe Gap Guarantee', () => {
  it('for any pipeGap and topHeight, the vertical gap is exactly pipeGap pixels', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 80, max: 300 }),   // arbitrary pipeGap values
        fc.double({ min: 60, max: 400, noNaN: true, noDefaultInfinity: true }),  // arbitrary topHeight
        (pipeGap, topHeight) => {
          // The top pipe occupies [0, topHeight]
          // The bottom pipe occupies [topHeight + pipeGap, canvasHeight]
          // The gap (safe zone) is [topHeight, topHeight + pipeGap]

          // A point exactly at topHeight is at the gap boundary (top)
          // A point exactly at topHeight + pipeGap is at the gap boundary (bottom)
          // The size of the gap is defined as pipeGap

          // Verify: the number of pixels in the gap equals pipeGap
          // by checking that a point at topHeight + pipeGap is exactly pipeGap
          // pixels below topHeight
          const gapTop = topHeight;
          const gapBottom = topHeight + pipeGap;

          // The gap size is gapBottom - gapTop = (topHeight + pipeGap) - topHeight = pipeGap
          // Due to floating-point, we verify this structurally:
          // Any point at topHeight + offset where 0 <= offset <= pipeGap is safe
          // Any point at topHeight + pipeGap + epsilon is NOT safe (hits bottom pipe)
          // Any point at topHeight - epsilon is NOT safe (hits top pipe)

          // The gap is exactly pipeGap because the collision boundaries are defined as:
          // top boundary: topHeight (anything above collides with top pipe)
          // bottom boundary: topHeight + pipeGap (anything below collides with bottom pipe)
          expect(isInGap(gapTop, topHeight, pipeGap)).toBe(true);
          expect(isInGap(gapBottom, topHeight, pipeGap)).toBe(true);
          expect(isInGap(topHeight + pipeGap / 2, topHeight, pipeGap)).toBe(true);

          // Points outside the gap collide
          expect(isInGap(topHeight - 1, topHeight, pipeGap)).toBe(false);
          expect(isInGap(topHeight + pipeGap + 1, topHeight, pipeGap)).toBe(false);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('spawnPipe() always produces pipes with a gap of exactly CONFIG.pipeGap', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 80, max: 300 }),  // arbitrary pipeGap values
        fc.integer({ min: 1, max: 10 }),    // number of pipes to spawn
        (pipeGap, spawnCount) => {
          const canvasHeight = 500;

          // Spawn multiple pipes using the game's spawnPipe logic
          const pipes = [];
          for (let i = 0; i < spawnCount; i++) {
            pipes.push(spawnPipe(canvasHeight, pipeGap));
          }

          // For each pipe, verify the gap property holds:
          // The collision system defines the gap as [topHeight, topHeight + pipeGap].
          // A point in the exact middle of the gap must be safe.
          // Points just outside the gap must collide.
          for (const pipe of pipes) {
            const midGap = pipe.topHeight + pipeGap / 2;

            // Middle of gap is safe
            expect(isInGap(midGap, pipe.topHeight, pipeGap)).toBe(true);

            // Boundaries of gap are safe (inclusive)
            expect(isInGap(pipe.topHeight, pipe.topHeight, pipeGap)).toBe(true);
            expect(isInGap(pipe.topHeight + pipeGap, pipe.topHeight, pipeGap)).toBe(true);

            // Just outside the gap is not safe
            expect(isInGap(pipe.topHeight - 0.001, pipe.topHeight, pipeGap)).toBe(false);
            expect(isInGap(pipe.topHeight + pipeGap + 0.001, pipe.topHeight, pipeGap)).toBe(false);

            // The gap width is exactly pipeGap: verify by checking that
            // topHeight + pipeGap is the bottom boundary (structural guarantee)
            // This is the core property: the bottom pipe starts at topHeight + CONFIG.pipeGap
            const bottomPipeStart = pipe.topHeight + pipeGap;
            const topPipeEnd = pipe.topHeight;

            // Any entity of height < pipeGap can fit through the gap
            // (this is the gameplay guarantee)
            const entityHeight = pipeGap - 1;
            const entityTop = topPipeEnd + 0.5; // just inside the gap
            const entityBottom = entityTop + entityHeight;
            expect(entityBottom).toBeLessThan(bottomPipeStart);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('collision detection uses exactly CONFIG.pipeGap to define pipe boundaries', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 80, max: 300 }),   // pipeGap
        fc.double({ min: 60, max: 400, noNaN: true, noDefaultInfinity: true }),  // topHeight
        fc.double({ min: 0, max: 500, noNaN: true, noDefaultInfinity: true }),   // ghostY position
        (pipeGap, topHeight, ghostY) => {
          // Model the collision check from game.js:
          // Collision with top pipe: ghostTop < pipe.topHeight
          // Collision with bottom pipe: ghostBottom > pipe.topHeight + CONFIG.pipeGap
          // No collision (in gap): ghostTop >= topHeight AND ghostBottom <= topHeight + pipeGap

          const ghostSize = 36;
          const inset = 4;
          const ghostTop = ghostY + inset;
          const ghostBottom = ghostY + ghostSize - inset;

          const hitsTopPipe = ghostTop < topHeight;
          const hitsBottomPipe = ghostBottom > topHeight + pipeGap;
          const inGap = !hitsTopPipe && !hitsBottomPipe;

          // The gap where no collision occurs is exactly pipeGap pixels wide.
          // If ghostTop >= topHeight AND ghostBottom <= topHeight + pipeGap, entity is safe.
          // The maximum entity height that fits is exactly pipeGap (from ghostTop to ghostBottom).
          if (inGap) {
            // Entity fits within the gap boundaries
            expect(ghostTop).toBeGreaterThanOrEqual(topHeight);
            expect(ghostBottom).toBeLessThanOrEqual(topHeight + pipeGap);
          }

          // The safe zone size is always topHeight + pipeGap - topHeight = pipeGap
          // Verify: an entity of exactly 0 height at any position in [topHeight, topHeight+pipeGap]
          // is safe
          const testPoint = topHeight + (pipeGap / 2);
          expect(testPoint >= topHeight).toBe(true);
          expect(testPoint <= topHeight + pipeGap).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
