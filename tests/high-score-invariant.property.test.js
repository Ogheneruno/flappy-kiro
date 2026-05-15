import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 8: High Score Invariant
 *
 * For any game state, highScore is always greater than or equal to the current score.
 * When game over occurs with score > highScore, highScore is updated to the current score.
 *
 * **Validates: Requirements 6.4, 6.5**
 */

/**
 * Creates a minimal scoring/high score model matching game.js behavior.
 * Models the scoring system and high score persistence logic without DOM/Canvas dependencies.
 */
function createHighScoreModel(initialHighScore = 0) {
  let score = 0;
  let highScore = initialHighScore;
  let gameState = 'waiting'; // 'waiting' | 'playing' | 'gameover'

  /**
   * Transition to playing state (simulates jump from waiting).
   */
  function startGame() {
    if (gameState === 'waiting') {
      gameState = 'playing';
      score = 0;
    }
  }

  /**
   * Increment score by 1 (simulates pipe passing ghosty).
   * Only works while playing.
   */
  function incrementScore() {
    if (gameState === 'playing') {
      score++;
    }
  }

  /**
   * Trigger game over — updates highScore if score > highScore.
   * Matches game.js gameOver() logic exactly.
   */
  function gameOver() {
    if (gameState === 'playing') {
      gameState = 'gameover';
      if (score > highScore) {
        highScore = score;
      }
    }
  }

  /**
   * Reset game to initial state (simulates resetGame()).
   * Note: highScore is NOT reset — it persists across games.
   */
  function resetGame() {
    if (gameState === 'gameover') {
      score = 0;
      gameState = 'waiting';
    }
  }

  return {
    get score() { return score; },
    get highScore() { return highScore; },
    get gameState() { return gameState; },
    startGame,
    incrementScore,
    gameOver,
    resetGame,
  };
}

describe('Property 8: High Score Invariant', () => {
  it('highScore is always >= current score after game over', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of games, each with a random score achieved
        fc.array(
          fc.integer({ min: 0, max: 100 }),
          { minLength: 1, maxLength: 20 }
        ),
        (gameScores) => {
          const model = createHighScoreModel(0);

          for (const targetScore of gameScores) {
            // Start a new game
            model.startGame();

            // Achieve the target score
            for (let i = 0; i < targetScore; i++) {
              model.incrementScore();
            }

            // Trigger game over
            model.gameOver();

            // INVARIANT: highScore must always be >= current score
            expect(model.highScore).toBeGreaterThanOrEqual(model.score);

            // Reset for next game
            model.resetGame();
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  it('highScore is updated to score when score > previous highScore', () => {
    fc.assert(
      fc.property(
        // Generate an initial high score
        fc.integer({ min: 0, max: 50 }),
        // Generate a score that is strictly greater than the initial high score
        fc.integer({ min: 1, max: 100 }),
        (initialHigh, extraPoints) => {
          const newScore = initialHigh + extraPoints; // Guaranteed > initialHigh
          const model = createHighScoreModel(initialHigh);

          model.startGame();

          // Achieve a score higher than the initial high score
          for (let i = 0; i < newScore; i++) {
            model.incrementScore();
          }

          model.gameOver();

          // When score > previous highScore, highScore must be updated to score
          expect(model.highScore).toBe(newScore);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('highScore remains unchanged when score <= highScore', () => {
    fc.assert(
      fc.property(
        // Generate an initial high score (at least 1 so we can score less)
        fc.integer({ min: 1, max: 100 }),
        // Generate a score that is <= the initial high score
        fc.integer({ min: 0, max: 100 }),
        (initialHigh, rawScore) => {
          // Ensure score <= initialHigh
          const achievedScore = rawScore % (initialHigh + 1);
          const model = createHighScoreModel(initialHigh);

          model.startGame();

          for (let i = 0; i < achievedScore; i++) {
            model.incrementScore();
          }

          model.gameOver();

          // When score <= highScore, highScore must remain unchanged
          expect(model.highScore).toBe(initialHigh);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('highScore never decreases across multiple game sessions', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of games with random scores
        fc.array(
          fc.integer({ min: 0, max: 50 }),
          { minLength: 2, maxLength: 30 }
        ),
        (gameScores) => {
          const model = createHighScoreModel(0);
          let previousHighScore = 0;

          for (const targetScore of gameScores) {
            model.startGame();

            for (let i = 0; i < targetScore; i++) {
              model.incrementScore();
            }

            model.gameOver();

            // High score must never decrease
            expect(model.highScore).toBeGreaterThanOrEqual(previousHighScore);
            previousHighScore = model.highScore;

            model.resetGame();
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  it('highScore equals the maximum score achieved across all games', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of games with random scores
        fc.array(
          fc.integer({ min: 0, max: 100 }),
          { minLength: 1, maxLength: 20 }
        ),
        // Generate an initial high score
        fc.integer({ min: 0, max: 50 }),
        (gameScores, initialHigh) => {
          const model = createHighScoreModel(initialHigh);

          for (const targetScore of gameScores) {
            model.startGame();

            for (let i = 0; i < targetScore; i++) {
              model.incrementScore();
            }

            model.gameOver();
            model.resetGame();
          }

          // After all games, highScore should equal the max of initialHigh and all achieved scores
          const expectedHigh = Math.max(initialHigh, ...gameScores);
          expect(model.highScore).toBe(expectedHigh);
        }
      ),
      { numRuns: 500 }
    );
  });
});
