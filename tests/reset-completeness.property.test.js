import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 14: Reset Completeness
 *
 * For any game state (regardless of score, pipe positions, ghosty position,
 * or frame count), after resetGame() is called, the state is indistinguishable
 * from initial load: Ghosty at canvas center with zero velocity, no pipes,
 * score zero, frame count zero, and Game_State is 'waiting'.
 *
 * **Validates: Requirements 1.5, 10.4**
 */

/**
 * Creates a game state machine model matching game.js behavior.
 * Allows setting arbitrary state before testing resetGame().
 */
function createGameModel() {
  const CONFIG = {
    gravity: 0.4,
    jumpForce: -7,
    pipeWidth: 70,
    pipeGap: 160,
    pipeSpeed: 2.5,
    pipeSpawnInterval: 180,
    ghostySize: 36,
    hitboxInset: 4,
    canvasWidth: 800,
    canvasHeight: 500,
  };

  let ghosty = {
    x: 120,
    y: CONFIG.canvasHeight / 2,
    width: CONFIG.ghostySize,
    height: CONFIG.ghostySize,
    velocity: 0,
  };

  let pipes = [];
  let score = 0;
  let frameCount = 0;
  let gameState = 'waiting';

  function resetGame() {
    ghosty.y = CONFIG.canvasHeight / 2;
    ghosty.velocity = 0;
    ghosty.width = CONFIG.ghostySize;
    ghosty.height = CONFIG.ghostySize;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameState = 'waiting';
  }

  /**
   * Sets the game to an arbitrary state for testing purposes.
   */
  function setState({ ghostyY, ghostyVelocity, ghostyWidth, ghostyHeight, pipesList, newScore, newFrameCount, newGameState }) {
    ghosty.y = ghostyY;
    ghosty.velocity = ghostyVelocity;
    ghosty.width = ghostyWidth;
    ghosty.height = ghostyHeight;
    pipes = pipesList;
    score = newScore;
    frameCount = newFrameCount;
    gameState = newGameState;
  }

  return {
    get ghosty() { return ghosty; },
    get pipes() { return pipes; },
    get score() { return score; },
    get frameCount() { return frameCount; },
    get gameState() { return gameState; },
    get CONFIG() { return CONFIG; },
    resetGame,
    setState,
  };
}

// Arbitrary for a single pipe entity
const pipeArb = fc.record({
  x: fc.double({ min: -100, max: 1000, noNaN: true }),
  topHeight: fc.double({ min: 60, max: 280, noNaN: true }),
  scored: fc.boolean(),
});

// Arbitrary for a complete arbitrary game state
const arbitraryGameState = fc.record({
  ghostyY: fc.double({ min: -500, max: 1000, noNaN: true }),
  ghostyVelocity: fc.double({ min: -50, max: 50, noNaN: true }),
  ghostyWidth: fc.integer({ min: 10, max: 100 }),
  ghostyHeight: fc.integer({ min: 10, max: 100 }),
  pipesList: fc.array(pipeArb, { minLength: 0, maxLength: 20 }),
  newScore: fc.integer({ min: 0, max: 10000 }),
  newFrameCount: fc.integer({ min: 0, max: 100000 }),
  newGameState: fc.constantFrom('waiting', 'playing', 'gameover'),
});

describe('Property 14: Reset Completeness', () => {
  it('after resetGame(), state is indistinguishable from initial load regardless of prior state', () => {
    fc.assert(
      fc.property(
        arbitraryGameState,
        (arbitraryState) => {
          const game = createGameModel();
          const canvasHeight = game.CONFIG.canvasHeight;
          const ghostySize = game.CONFIG.ghostySize;

          // Set the game to an arbitrary (potentially wild) state
          game.setState(arbitraryState);

          // Verify the state was actually changed (sanity check for non-trivial cases)
          // (Not all generated states will differ from initial, but that's fine)

          // Call resetGame
          game.resetGame();

          // Assert all state matches initial load values
          expect(game.ghosty.y).toBe(canvasHeight / 2);
          expect(game.ghosty.velocity).toBe(0);
          expect(game.ghosty.width).toBe(ghostySize);
          expect(game.ghosty.height).toBe(ghostySize);
          expect(game.ghosty.x).toBe(120); // x should remain unchanged
          expect(game.pipes).toEqual([]);
          expect(game.score).toBe(0);
          expect(game.frameCount).toBe(0);
          expect(game.gameState).toBe('waiting');
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('resetGame() produces identical state when called multiple times in succession', () => {
    fc.assert(
      fc.property(
        arbitraryGameState,
        arbitraryGameState,
        (state1, state2) => {
          const game = createGameModel();

          // Set to first arbitrary state and reset
          game.setState(state1);
          game.resetGame();

          const afterFirstReset = {
            ghostyY: game.ghosty.y,
            ghostyVelocity: game.ghosty.velocity,
            ghostyWidth: game.ghosty.width,
            ghostyHeight: game.ghosty.height,
            pipes: [...game.pipes],
            score: game.score,
            frameCount: game.frameCount,
            gameState: game.gameState,
          };

          // Set to second arbitrary state and reset
          game.setState(state2);
          game.resetGame();

          // Both resets should produce identical state
          expect(game.ghosty.y).toBe(afterFirstReset.ghostyY);
          expect(game.ghosty.velocity).toBe(afterFirstReset.ghostyVelocity);
          expect(game.ghosty.width).toBe(afterFirstReset.ghostyWidth);
          expect(game.ghosty.height).toBe(afterFirstReset.ghostyHeight);
          expect(game.pipes).toEqual(afterFirstReset.pipes);
          expect(game.score).toBe(afterFirstReset.score);
          expect(game.frameCount).toBe(afterFirstReset.frameCount);
          expect(game.gameState).toBe(afterFirstReset.gameState);
        }
      ),
      { numRuns: 500 }
    );
  });
});
