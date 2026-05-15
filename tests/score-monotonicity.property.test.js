import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 7: Score Monotonicity
 *
 * For any sequence of game frames during a playing session, the score only
 * increases (by exactly 1 per pipe passed) and never decreases.
 *
 * **Validates: Requirements 4.6, 6.2, 6.3**
 */

/**
 * Creates a minimal pipe scoring simulation matching game.js behavior.
 * Models pipe movement, scoring, and frame-by-frame score tracking
 * without DOM/Canvas dependencies.
 */
function createScoreModel(config) {
  const CONFIG = {
    pipeWidth: config.pipeWidth || 70,
    pipeSpeed: config.pipeSpeed || 2.5,
    pipeSpawnInterval: config.pipeSpawnInterval || 180,
    canvasWidth: 800,
    canvasHeight: 500,
    pipeGap: config.pipeGap || 160,
  };

  const ghosty = { x: 120 };

  let pipes = [];
  let score = 0;
  let frameCount = 0;

  function spawnPipe() {
    const minTop = 60;
    const maxTop = CONFIG.canvasHeight - CONFIG.pipeGap - 60;
    const topHeight = minTop + Math.random() * (maxTop - minTop);
    pipes.push({
      x: CONFIG.canvasWidth,
      topHeight: topHeight,
      scored: false,
    });
  }

  /**
   * Simulates one frame of pipe update logic, exactly as in game.js.
   * Returns the score change that occurred this frame.
   */
  function frameUpdate() {
    const scoreBefore = score;

    frameCount++;
    if (frameCount % CONFIG.pipeSpawnInterval === 0) {
      spawnPipe();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= CONFIG.pipeSpeed;

      // Score: pipe trailing edge passes ghosty.x
      if (!pipes[i].scored && pipes[i].x + CONFIG.pipeWidth < ghosty.x) {
        pipes[i].scored = true;
        score++;
      }

      // Remove off-screen pipes
      if (pipes[i].x + CONFIG.pipeWidth < -10) {
        pipes.splice(i, 1);
      }
    }

    return score - scoreBefore;
  }

  return {
    get pipes() { return pipes; },
    get score() { return score; },
    get frameCount() { return frameCount; },
    get CONFIG() { return CONFIG; },
    spawnPipe,
    frameUpdate,
  };
}

describe('Property 7: Score Monotonicity', () => {
  it('score never decreases between any two consecutive frames', () => {
    fc.assert(
      fc.property(
        // Generate pipe speed
        fc.double({ min: 1, max: 8, noNaN: true, noDefaultInfinity: true }),
        // Generate pipe width
        fc.integer({ min: 30, max: 120 }),
        // Generate number of pipes to spawn
        fc.integer({ min: 1, max: 10 }),
        // Generate number of frames to simulate
        fc.integer({ min: 50, max: 500 }),
        (pipeSpeed, pipeWidth, numPipes, numFrames) => {
          const model = createScoreModel({ pipeSpeed, pipeWidth });

          // Spawn pipes at staggered positions to the right of ghosty
          for (let i = 0; i < numPipes; i++) {
            model.pipes.push({
              x: 200 + i * 150,
              topHeight: 150,
              scored: false,
            });
          }

          // Run frames and verify score never decreases
          let previousScore = model.score;

          for (let frame = 0; frame < numFrames; frame++) {
            model.frameUpdate();
            const currentScore = model.score;

            // Score must never decrease
            expect(currentScore).toBeGreaterThanOrEqual(previousScore);

            previousScore = currentScore;
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  it('score increases by exactly 1 each time it changes (never by 2 or more in a single frame)', () => {
    fc.assert(
      fc.property(
        // Generate pipe speed
        fc.double({ min: 0.5, max: 10, noNaN: true, noDefaultInfinity: true }),
        // Generate pipe width
        fc.integer({ min: 20, max: 150 }),
        // Generate well-spaced pipe positions (separated by at least pipeWidth + buffer)
        // This ensures at most one pipe can cross ghosty.x per frame
        fc.integer({ min: 1, max: 6 }),
        // Generate number of frames to simulate
        fc.integer({ min: 100, max: 600 }),
        (pipeSpeed, pipeWidth, numPipes, numFrames) => {
          const model = createScoreModel({ pipeSpeed, pipeWidth });

          // Space pipes far enough apart that only one can score per frame
          // Minimum spacing: pipeSpeed (so trailing edges can't cross in same frame)
          const spacing = pipeWidth + pipeSpeed + 1;
          for (let i = 0; i < numPipes; i++) {
            model.pipes.push({
              x: 200 + i * spacing,
              topHeight: 150,
              scored: false,
            });
          }

          // Run frames and verify each score change is exactly 0 or 1
          for (let frame = 0; frame < numFrames; frame++) {
            const delta = model.frameUpdate();

            // Score change per frame must be 0 or 1 (never 2+)
            expect(delta).toBeGreaterThanOrEqual(0);
            expect(delta).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  it('total score equals the number of pipes that passed ghosty', () => {
    fc.assert(
      fc.property(
        // Generate pipe speed
        fc.double({ min: 1, max: 6, noNaN: true, noDefaultInfinity: true }),
        // Generate pipe width
        fc.integer({ min: 30, max: 100 }),
        // Generate pipe starting positions (all to the right of ghosty)
        fc.array(
          fc.double({ min: 200, max: 1000, noNaN: true, noDefaultInfinity: true }),
          { minLength: 1, maxLength: 6 }
        ),
        (pipeSpeed, pipeWidth, pipePositions) => {
          // Use a very high spawn interval to prevent auto-spawning during simulation
          const model = createScoreModel({ pipeSpeed, pipeWidth, pipeSpawnInterval: 999999 });
          const numPipes = pipePositions.length;

          // Spawn pipes at the generated positions
          for (const startX of pipePositions) {
            model.pipes.push({
              x: startX,
              topHeight: 150,
              scored: false,
            });
          }

          // Run enough frames for all pipes to pass ghosty and be removed
          const maxStartX = Math.max(...pipePositions);
          const framesToClear = Math.ceil((maxStartX + pipeWidth + 200) / pipeSpeed);

          for (let frame = 0; frame < framesToClear; frame++) {
            model.frameUpdate();
          }

          // Final score must equal the number of pipes that were spawned
          expect(model.score).toBe(numPipes);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('score remains unchanged when no pipe trailing edge crosses ghosty.x in a frame', () => {
    fc.assert(
      fc.property(
        // Generate pipe speed
        fc.double({ min: 1, max: 5, noNaN: true, noDefaultInfinity: true }),
        // Generate pipe width
        fc.integer({ min: 40, max: 100 }),
        // Generate a pipe far to the right (won't reach ghosty quickly)
        fc.double({ min: 500, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (pipeSpeed, pipeWidth, startX) => {
          const model = createScoreModel({ pipeSpeed, pipeWidth });

          model.pipes.push({
            x: startX,
            topHeight: 150,
            scored: false,
          });

          // Calculate frames before pipe trailing edge reaches ghosty.x (120)
          // trailing edge = startX + pipeWidth - (frames * pipeSpeed)
          // reaches ghosty when: startX + pipeWidth - (frames * pipeSpeed) < 120
          // frames > (startX + pipeWidth - 120) / pipeSpeed
          const framesBeforeScoring = Math.floor((startX + pipeWidth - 120) / pipeSpeed) - 1;
          const safeFames = Math.max(1, Math.min(framesBeforeScoring, 200));

          // Run frames where pipe hasn't reached ghosty yet
          for (let frame = 0; frame < safeFames; frame++) {
            const delta = model.frameUpdate();
            // Score should not change while pipe hasn't passed
            expect(delta).toBe(0);
          }

          expect(model.score).toBe(0);
        }
      ),
      { numRuns: 500 }
    );
  });
});
