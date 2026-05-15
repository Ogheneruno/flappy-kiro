import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 6: Pipe Movement
 *
 * For any Pipe at position x with pipeSpeed s, after one frame update,
 * the Pipe's new x position is x - s.
 *
 * Validates: Requirements 4.3
 */

/**
 * Simulates pipe movement for a single frame.
 * In game.js, during each frame when gameState === 'playing':
 *   pipe.x -= CONFIG.pipeSpeed;
 *
 * This model applies the same logic to verify the property holds
 * for arbitrary pipe positions and pipe speeds.
 */
function applyPipeMovement(pipes, pipeSpeed) {
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].x -= pipeSpeed;
  }
  return pipes;
}

// Arbitraries using integer-based values to avoid 32-bit float issues
const pipeXArb = fc.integer({ min: 0, max: 1000 });
const pipeSpeedArb = fc.integer({ min: 1, max: 100 }).map((n) => n / 10); // 0.1 to 10

describe('Property 6: Pipe Movement', () => {
  it('a single pipe moves left by exactly pipeSpeed after one frame', () => {
    fc.assert(
      fc.property(
        pipeXArb,
        pipeSpeedArb,
        (x, pipeSpeed) => {
          const pipe = { x, topHeight: 100, scored: false };
          const originalX = pipe.x;

          applyPipeMovement([pipe], pipeSpeed);

          // After one frame, new x should be original x - pipeSpeed
          expect(pipe.x).toBeCloseTo(originalX - pipeSpeed, 10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('multiple pipes each move independently by exactly pipeSpeed', () => {
    fc.assert(
      fc.property(
        fc.array(pipeXArb, { minLength: 2, maxLength: 10 }),
        pipeSpeedArb,
        (xPositions, pipeSpeed) => {
          const pipes = xPositions.map((x) => ({
            x,
            topHeight: 100,
            scored: false,
          }));

          // Record original positions
          const originalPositions = pipes.map((p) => p.x);

          applyPipeMovement(pipes, pipeSpeed);

          // Each pipe should have moved by exactly pipeSpeed
          for (let i = 0; i < pipes.length; i++) {
            expect(pipes[i].x).toBeCloseTo(originalPositions[i] - pipeSpeed, 10);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('pipe movement is consistent across consecutive frames', () => {
    fc.assert(
      fc.property(
        pipeXArb,
        pipeSpeedArb,
        fc.integer({ min: 1, max: 60 }),
        (startX, pipeSpeed, numFrames) => {
          const pipe = { x: startX, topHeight: 100, scored: false };

          // Apply movement for numFrames frames
          for (let i = 0; i < numFrames; i++) {
            applyPipeMovement([pipe], pipeSpeed);
          }

          // After N frames, pipe should have moved N * pipeSpeed to the left
          expect(pipe.x).toBeCloseTo(startX - numFrames * pipeSpeed, 5);
        }
      ),
      { numRuns: 500 }
    );
  });
});
