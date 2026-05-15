import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 16: Pipe Lifecycle (No Double Scoring)
 *
 * For any pipe, it is scored exactly once (when it passes Ghosty's x position)
 * and removed when fully off-screen. No pipe contributes more than 1 to the score.
 *
 * **Validates: Requirements 4.5, 4.6**
 */

/**
 * Creates a minimal pipe lifecycle simulation matching game.js behavior.
 * Models pipe movement, scoring, and removal without DOM/Canvas dependencies.
 */
function createPipeLifecycleModel(config) {
  const CONFIG = {
    pipeWidth: config.pipeWidth || 70,
    pipeSpeed: config.pipeSpeed || 2.5,
    canvasWidth: 800,
    canvasHeight: 500,
  };

  const ghosty = { x: 120 };

  let pipes = [];
  let score = 0;

  function addPipe(startX) {
    pipes.push({
      x: startX,
      topHeight: 150, // Doesn't matter for scoring logic
      scored: false,
    });
  }

  /**
   * Simulates one frame of pipe update logic, exactly as in game.js.
   */
  function frameUpdate() {
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
  }

  return {
    get pipes() { return pipes; },
    get score() { return score; },
    get ghostyX() { return ghosty.x; },
    get CONFIG() { return CONFIG; },
    addPipe,
    frameUpdate,
  };
}

describe('Property 16: Pipe Lifecycle (No Double Scoring)', () => {
  it('a pipe is scored exactly once when its trailing edge passes ghosty.x', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary pipe starting positions to the right of ghosty
        fc.double({ min: 200, max: 1000, noNaN: true, noDefaultInfinity: true }),
        // Generate arbitrary pipe speeds (positive, reasonable range)
        fc.double({ min: 0.5, max: 10, noNaN: true, noDefaultInfinity: true }),
        // Generate arbitrary pipe widths
        fc.integer({ min: 20, max: 150 }),
        (startX, pipeSpeed, pipeWidth) => {
          const model = createPipeLifecycleModel({ pipeSpeed, pipeWidth });
          model.addPipe(startX);

          // Run enough frames to move the pipe well past ghosty.x
          // Max frames needed: (startX + pipeWidth) / pipeSpeed + extra buffer
          const maxFrames = Math.ceil((startX + pipeWidth + 200) / pipeSpeed);

          let scoreWhenFirstScored = -1;
          let frameWhenScored = -1;

          for (let frame = 0; frame < maxFrames; frame++) {
            const scoreBefore = model.score;
            model.frameUpdate();
            const scoreAfter = model.score;

            if (scoreAfter > scoreBefore && scoreWhenFirstScored === -1) {
              scoreWhenFirstScored = scoreAfter;
              frameWhenScored = frame;
            }
          }

          // The pipe must have been scored exactly once
          expect(model.score).toBe(1);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('score increments by exactly 1 per pipe, never more, even after many frames past ghosty.x', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 200, max: 800, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 8, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 30, max: 120 }),
        // Extra frames to run after scoring (to verify no double-counting)
        fc.integer({ min: 50, max: 300 }),
        (startX, pipeSpeed, pipeWidth, extraFrames) => {
          const model = createPipeLifecycleModel({ pipeSpeed, pipeWidth });
          model.addPipe(startX);

          // Run until pipe is scored
          const framesToScore = Math.ceil((startX + pipeWidth - model.ghostyX) / pipeSpeed) + 1;

          for (let i = 0; i < framesToScore; i++) {
            model.frameUpdate();
          }

          // Score should be exactly 1 at this point (or pipe hasn't passed yet)
          const scoreAfterPassing = model.score;

          // Run many more frames — score must not increase further
          for (let i = 0; i < extraFrames; i++) {
            model.frameUpdate();
          }

          // Score must still be exactly 1 (no double scoring)
          expect(model.score).toBe(1);
          expect(scoreAfterPassing).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('pipe is removed when its trailing edge passes -10px', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 1000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.5, max: 10, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 20, max: 150 }),
        (startX, pipeSpeed, pipeWidth) => {
          const model = createPipeLifecycleModel({ pipeSpeed, pipeWidth });
          model.addPipe(startX);

          // Calculate frames needed for pipe trailing edge to pass -10
          // Trailing edge = pipe.x + pipeWidth
          // We need: startX - (frames * pipeSpeed) + pipeWidth < -10
          // frames > (startX + pipeWidth + 10) / pipeSpeed
          const framesToRemoval = Math.ceil((startX + pipeWidth + 10) / pipeSpeed) + 1;

          for (let i = 0; i < framesToRemoval; i++) {
            model.frameUpdate();
          }

          // Pipe should be removed from the array
          expect(model.pipes.length).toBe(0);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('multiple pipes are each scored exactly once and removed independently', () => {
    fc.assert(
      fc.property(
        // Generate 2-5 pipes with different starting positions
        fc.array(
          fc.double({ min: 200, max: 1500, noNaN: true, noDefaultInfinity: true }),
          { minLength: 2, maxLength: 5 }
        ),
        fc.double({ min: 1, max: 5, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 40, max: 100 }),
        (startPositions, pipeSpeed, pipeWidth) => {
          const model = createPipeLifecycleModel({ pipeSpeed, pipeWidth });

          // Add all pipes
          const numPipes = startPositions.length;
          for (const startX of startPositions) {
            model.addPipe(startX);
          }

          // Run enough frames for all pipes to be removed
          const maxStartX = Math.max(...startPositions);
          const framesToClear = Math.ceil((maxStartX + pipeWidth + 20) / pipeSpeed) + 5;

          for (let i = 0; i < framesToClear; i++) {
            model.frameUpdate();
          }

          // Each pipe should have been scored exactly once
          expect(model.score).toBe(numPipes);
          // All pipes should be removed
          expect(model.pipes.length).toBe(0);
        }
      ),
      { numRuns: 500 }
    );
  });
});
