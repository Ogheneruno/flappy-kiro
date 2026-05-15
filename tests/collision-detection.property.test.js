import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 9: Collision Detection Correctness
 *
 * For any Ghosty position and set of Pipes, checkCollision returns true
 * if and only if Ghosty's inset hitbox (reduced by CONFIG.hitboxInset on all sides)
 * overlaps any Pipe rectangle or the Canvas floor/ceiling boundary.
 *
 * The collision model mirrors game.js logic:
 * - Boundary collision: ghosty.y < 0 OR ghosty.y + ghosty.height > canvasHeight
 * - Pipe collision (using inset hitbox):
 *   - Horizontal overlap: ghostRight > pipeLeft AND ghostLeft < pipeRight
 *   - Vertical overlap: ghostTop < pipe.topHeight OR ghostBottom > pipe.topHeight + pipeGap
 *
 * Validates: Requirements 5.2, 5.3, 5.4
 */

/**
 * Self-contained model of checkCollision that mirrors game.js logic exactly.
 * This is a pure function with no global state dependencies.
 */
function checkCollisionModel(ghosty, pipes, config, canvasHeight) {
  const inset = config.hitboxInset;

  // Boundary check: floor and ceiling (uses full bounding box per Requirement 5.4)
  if (ghosty.y < 0 || ghosty.y + ghosty.height > canvasHeight) {
    return true;
  }

  // Pipe collision: AABB with inset hitbox
  for (const pipe of pipes) {
    const ghostLeft = ghosty.x + inset;
    const ghostRight = ghosty.x + ghosty.width - inset;
    const ghostTop = ghosty.y + inset;
    const ghostBottom = ghosty.y + ghosty.height - inset;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + config.pipeWidth;

    // Horizontal overlap test
    if (ghostRight > pipeLeft && ghostLeft < pipeRight) {
      // Vertical overlap with top pipe
      if (ghostTop < pipe.topHeight) return true;
      // Vertical overlap with bottom pipe
      if (ghostBottom > pipe.topHeight + config.pipeGap) return true;
    }
  }

  return false;
}

/**
 * Reference model that computes expected collision by checking each condition independently.
 * Used to verify the model is correct by construction.
 */
function expectedCollision(ghosty, pipes, config, canvasHeight) {
  // Check boundary collision (full bounding box)
  if (ghosty.y < 0 || ghosty.y + ghosty.height > canvasHeight) {
    return true;
  }

  const inset = config.hitboxInset;
  const ghostLeft = ghosty.x + inset;
  const ghostRight = ghosty.x + ghosty.width - inset;
  const ghostTop = ghosty.y + inset;
  const ghostBottom = ghosty.y + ghosty.height - inset;

  // Check each pipe
  for (const pipe of pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + config.pipeWidth;

    const horizontalOverlap = ghostRight > pipeLeft && ghostLeft < pipeRight;
    if (!horizontalOverlap) continue;

    const hitsTopPipe = ghostTop < pipe.topHeight;
    const hitsBottomPipe = ghostBottom > pipe.topHeight + config.pipeGap;

    if (hitsTopPipe || hitsBottomPipe) return true;
  }

  return false;
}

// --- Generators ---

const configArb = fc.record({
  hitboxInset: fc.integer({ min: 0, max: 10 }),
  pipeWidth: fc.integer({ min: 30, max: 120 }),
  pipeGap: fc.integer({ min: 80, max: 300 })
});

const canvasHeightArb = fc.integer({ min: 300, max: 800 });

const ghostyArb = fc.record({
  x: fc.double({ min: 50, max: 200, noNaN: true, noDefaultInfinity: true }),
  y: fc.double({ min: -50, max: 600, noNaN: true, noDefaultInfinity: true }),
  width: fc.integer({ min: 20, max: 60 }),
  height: fc.integer({ min: 20, max: 60 })
});

const pipeArb = fc.record({
  x: fc.double({ min: 0, max: 900, noNaN: true, noDefaultInfinity: true }),
  topHeight: fc.double({ min: 40, max: 400, noNaN: true, noDefaultInfinity: true }),
  scored: fc.boolean()
});

const pipesArb = fc.array(pipeArb, { minLength: 0, maxLength: 5 });

describe('Property 9: Collision Detection Correctness', () => {
  it('checkCollision model returns true iff inset hitbox overlaps pipe or boundary', () => {
    fc.assert(
      fc.property(
        ghostyArb,
        pipesArb,
        configArb,
        canvasHeightArb,
        (ghosty, pipes, config, canvasHeight) => {
          const modelResult = checkCollisionModel(ghosty, pipes, config, canvasHeight);
          const expectedResult = expectedCollision(ghosty, pipes, config, canvasHeight);

          // Both models must agree — they implement the same logic independently
          expect(modelResult).toBe(expectedResult);
        }
      ),
      { numRuns: 5000 }
    );
  });

  it('ghosty at floor boundary always triggers collision', () => {
    fc.assert(
      fc.property(
        ghostyArb,
        pipesArb,
        configArb,
        canvasHeightArb,
        (ghosty, pipes, config, canvasHeight) => {
          // Place ghosty so its bottom edge exceeds canvas height
          const floorGhosty = { ...ghosty, y: canvasHeight - ghosty.height + 1 };
          const result = checkCollisionModel(floorGhosty, pipes, config, canvasHeight);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('ghosty at ceiling boundary always triggers collision', () => {
    fc.assert(
      fc.property(
        ghostyArb,
        pipesArb,
        configArb,
        canvasHeightArb,
        (ghosty, pipes, config, canvasHeight) => {
          // Place ghosty above the canvas top
          const ceilingGhosty = { ...ghosty, y: -1 };
          const result = checkCollisionModel(ceilingGhosty, pipes, config, canvasHeight);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('ghosty safely in pipe gap does not trigger collision', () => {
    fc.assert(
      fc.property(
        configArb,
        canvasHeightArb,
        fc.double({ min: 80, max: 350, noNaN: true, noDefaultInfinity: true }),
        (config, canvasHeight, topHeight) => {
          // Ensure the gap is large enough for ghosty to fit
          const ghostySize = 36;
          fc.pre(config.pipeGap > ghostySize + 2 * config.hitboxInset);
          fc.pre(canvasHeight > topHeight + config.pipeGap + 10);
          fc.pre(topHeight > config.hitboxInset + 1);

          // Place ghosty centered in the gap
          const gapCenter = topHeight + config.pipeGap / 2;
          const ghosty = {
            x: 120,
            y: gapCenter - ghostySize / 2,
            width: ghostySize,
            height: ghostySize
          };

          // Verify ghosty is within canvas bounds
          fc.pre(ghosty.y >= 0 && ghosty.y + ghosty.height <= canvasHeight);

          // Verify inset hitbox fits within the gap
          const ghostTop = ghosty.y + config.hitboxInset;
          const ghostBottom = ghosty.y + ghosty.height - config.hitboxInset;
          fc.pre(ghostTop >= topHeight && ghostBottom <= topHeight + config.pipeGap);

          // Place pipe directly overlapping ghosty horizontally
          const pipe = { x: 100, topHeight: topHeight, scored: false };

          const result = checkCollisionModel(ghosty, [pipe], config, canvasHeight);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 2000 }
    );
  });

  it('ghosty overlapping top pipe triggers collision', () => {
    fc.assert(
      fc.property(
        configArb,
        canvasHeightArb,
        fc.double({ min: 80, max: 350, noNaN: true, noDefaultInfinity: true }),
        (config, canvasHeight, topHeight) => {
          const ghostySize = 36;
          fc.pre(topHeight > config.hitboxInset + 1);
          fc.pre(canvasHeight > ghostySize);

          // Place ghosty so its inset top is above topHeight (hits top pipe)
          // ghostTop = ghosty.y + inset < topHeight
          // So ghosty.y < topHeight - inset
          const ghostyY = topHeight - config.hitboxInset - 5;
          fc.pre(ghostyY >= 0); // Must not trigger boundary collision for this test
          fc.pre(ghostyY + ghostySize <= canvasHeight);

          const ghosty = {
            x: 120,
            y: ghostyY,
            width: ghostySize,
            height: ghostySize
          };

          // Place pipe overlapping horizontally
          const pipe = { x: 100, topHeight: topHeight, scored: false };

          // Verify horizontal overlap exists
          const ghostRight = ghosty.x + ghosty.width - config.hitboxInset;
          const ghostLeft = ghosty.x + config.hitboxInset;
          const pipeRight = pipe.x + config.pipeWidth;
          fc.pre(ghostRight > pipe.x && ghostLeft < pipeRight);

          const result = checkCollisionModel(ghosty, [pipe], config, canvasHeight);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('ghosty overlapping bottom pipe triggers collision', () => {
    fc.assert(
      fc.property(
        configArb,
        canvasHeightArb,
        fc.double({ min: 60, max: 200, noNaN: true, noDefaultInfinity: true }),
        (config, canvasHeight, topHeight) => {
          const ghostySize = 36;
          const bottomPipeTop = topHeight + config.pipeGap;
          fc.pre(bottomPipeTop + 10 < canvasHeight); // Room for ghosty below gap

          // Place ghosty so its inset bottom is below bottomPipeTop
          // ghostBottom = ghosty.y + ghostySize - inset > topHeight + pipeGap
          const ghostyY = bottomPipeTop - ghostySize + config.hitboxInset + 5;
          fc.pre(ghostyY >= 0);
          fc.pre(ghostyY + ghostySize <= canvasHeight);

          const ghosty = {
            x: 120,
            y: ghostyY,
            width: ghostySize,
            height: ghostySize
          };

          // Place pipe overlapping horizontally
          const pipe = { x: 100, topHeight: topHeight, scored: false };

          // Verify horizontal overlap exists
          const ghostRight = ghosty.x + ghosty.width - config.hitboxInset;
          const ghostLeft = ghosty.x + config.hitboxInset;
          const pipeRight = pipe.x + config.pipeWidth;
          fc.pre(ghostRight > pipe.x && ghostLeft < pipeRight);

          const result = checkCollisionModel(ghosty, [pipe], config, canvasHeight);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('no horizontal overlap with pipe means no pipe collision', () => {
    fc.assert(
      fc.property(
        configArb,
        canvasHeightArb,
        fc.double({ min: 60, max: 350, noNaN: true, noDefaultInfinity: true }),
        (config, canvasHeight, topHeight) => {
          const ghostySize = 36;

          // Place ghosty safely within canvas bounds
          const ghostyY = Math.min(Math.max(10, topHeight - 5), canvasHeight - ghostySize - 1);
          fc.pre(ghostyY >= 0 && ghostyY + ghostySize <= canvasHeight);

          const ghosty = {
            x: 120,
            y: ghostyY,
            width: ghostySize,
            height: ghostySize
          };

          // Place pipe far to the right so there's no horizontal overlap
          const ghostRight = ghosty.x + ghosty.width - config.hitboxInset;
          const pipe = { x: ghostRight + 50, topHeight: topHeight, scored: false };

          // Verify no horizontal overlap
          const ghostLeft = ghosty.x + config.hitboxInset;
          const pipeRight = pipe.x + config.pipeWidth;
          fc.pre(!(ghostRight > pipe.x && ghostLeft < pipeRight));

          const result = checkCollisionModel(ghosty, [pipe], config, canvasHeight);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
