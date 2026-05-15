import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 1: State Machine Integrity
 *
 * For any sequence of game actions (jumps, frame updates, collisions),
 * Game_State is always exactly one of 'waiting', 'playing', or 'gameover'
 * and transitions only follow valid paths:
 *   waiting → playing (via jump)
 *   playing → gameover (via collision)
 *   gameover → waiting (via jump which calls resetGame)
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

// Valid game states
const VALID_STATES = ['waiting', 'playing', 'gameover'];

// Valid transitions map: from → [allowed next states]
const VALID_TRANSITIONS = {
  waiting: ['playing'],
  playing: ['gameover'],
  gameover: ['waiting'],
};

/**
 * Simulates the game state machine exactly as implemented in game.js.
 * This models the core state transitions without DOM/Canvas dependencies.
 */
function createGameStateMachine() {
  let gameState = 'waiting';
  let ghosty = { y: 250, velocity: 0, width: 36, height: 36, x: 120 };
  let pipes = [];
  let score = 0;
  let frameCount = 0;

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

  function checkCollision() {
    const inset = CONFIG.hitboxInset;

    // Floor and ceiling
    if (ghosty.y + ghosty.height > CONFIG.canvasHeight || ghosty.y < 0) {
      return true;
    }

    // Pipes
    for (let pipe of pipes) {
      const ghostLeft = ghosty.x + inset;
      const ghostRight = ghosty.x + ghosty.width - inset;
      const ghostTop = ghosty.y + inset;
      const ghostBottom = ghosty.y + ghosty.height - inset;

      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + CONFIG.pipeWidth;

      if (ghostRight > pipeLeft && ghostLeft < pipeRight) {
        if (ghostTop < pipe.topHeight) return true;
        if (ghostBottom > pipe.topHeight + CONFIG.pipeGap) return true;
      }
    }

    return false;
  }

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

  function jump() {
    if (gameState === 'waiting') {
      gameState = 'playing';
    }

    if (gameState === 'playing') {
      ghosty.velocity = CONFIG.jumpForce;
    }

    if (gameState === 'gameover') {
      resetGame();
    }
  }

  function gameOver() {
    gameState = 'gameover';
  }

  function spawnPipe() {
    const minTop = 60;
    const maxTop = CONFIG.canvasHeight - CONFIG.pipeGap - 60;
    const topHeight = minTop + Math.random() * (maxTop - minTop);
    pipes.push({ x: CONFIG.canvasWidth, topHeight, scored: false });
  }

  function frameUpdate() {
    if (gameState === 'playing') {
      // Physics
      ghosty.velocity += CONFIG.gravity;
      ghosty.y += ghosty.velocity;

      // Spawn pipes
      frameCount++;
      if (frameCount % CONFIG.pipeSpawnInterval === 0) {
        spawnPipe();
      }

      // Update pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= CONFIG.pipeSpeed;

        if (!pipes[i].scored && pipes[i].x + CONFIG.pipeWidth < ghosty.x) {
          pipes[i].scored = true;
          score++;
        }

        if (pipes[i].x + CONFIG.pipeWidth < -10) {
          pipes.splice(i, 1);
        }
      }

      // Check collision
      if (checkCollision()) {
        gameOver();
      }
    }
  }

  return {
    get state() { return gameState; },
    jump,
    frameUpdate,
  };
}

// Arbitrary for game actions
const gameActionArb = fc.oneof(
  fc.constant('jump'),
  fc.constant('frame'),
  // Multiple frames to simulate time passing and potential collisions
  fc.constant('frames_10'),
  fc.constant('frames_50'),
);

describe('Property 1: State Machine Integrity', () => {
  it('gameState is always one of the three valid states for any action sequence', () => {
    fc.assert(
      fc.property(
        fc.array(gameActionArb, { minLength: 1, maxLength: 200 }),
        (actions) => {
          const game = createGameStateMachine();

          // Initial state must be valid
          expect(VALID_STATES).toContain(game.state);

          for (const action of actions) {
            switch (action) {
              case 'jump':
                game.jump();
                break;
              case 'frame':
                game.frameUpdate();
                break;
              case 'frames_10':
                for (let i = 0; i < 10; i++) game.frameUpdate();
                break;
              case 'frames_50':
                for (let i = 0; i < 50; i++) game.frameUpdate();
                break;
            }

            // After every action, state must be one of the valid states
            expect(VALID_STATES).toContain(game.state);
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  it('state transitions only follow valid paths', () => {
    fc.assert(
      fc.property(
        fc.array(gameActionArb, { minLength: 1, maxLength: 200 }),
        (actions) => {
          const game = createGameStateMachine();
          let previousState = game.state;

          for (const action of actions) {
            switch (action) {
              case 'jump':
                game.jump();
                break;
              case 'frame':
                game.frameUpdate();
                break;
              case 'frames_10':
                for (let i = 0; i < 10; i++) {
                  const before = game.state;
                  game.frameUpdate();
                  const after = game.state;
                  if (before !== after) {
                    // Validate each individual transition within multi-frame
                    expect(VALID_TRANSITIONS[before]).toContain(after);
                  }
                }
                // Update previousState tracking after multi-frame block
                previousState = game.state;
                continue;
              case 'frames_50':
                for (let i = 0; i < 50; i++) {
                  const before = game.state;
                  game.frameUpdate();
                  const after = game.state;
                  if (before !== after) {
                    expect(VALID_TRANSITIONS[before]).toContain(after);
                  }
                }
                previousState = game.state;
                continue;
            }

            const currentState = game.state;
            if (previousState !== currentState) {
              // A transition occurred — verify it's valid
              expect(VALID_TRANSITIONS[previousState]).toContain(currentState);
            }
            previousState = currentState;
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  it('no invalid state is ever reachable from any starting configuration', () => {
    // Use a more targeted arbitrary that starts from different states
    const initialStateArb = fc.constantFrom('waiting', 'playing', 'gameover');

    fc.assert(
      fc.property(
        initialStateArb,
        fc.array(gameActionArb, { minLength: 1, maxLength: 100 }),
        (startState, actions) => {
          const game = createGameStateMachine();

          // Drive the game to the desired starting state
          if (startState === 'playing') {
            game.jump(); // waiting → playing
          } else if (startState === 'gameover') {
            game.jump(); // waiting → playing
            // Run frames until collision occurs (ghosty falls off screen)
            for (let i = 0; i < 200; i++) {
              game.frameUpdate();
              if (game.state === 'gameover') break;
            }
            // If still not gameover, skip this test case
            if (game.state !== 'gameover') return;
          }

          expect(game.state).toBe(startState);

          // Now apply random actions
          for (const action of actions) {
            switch (action) {
              case 'jump':
                game.jump();
                break;
              case 'frame':
                game.frameUpdate();
                break;
              case 'frames_10':
                for (let i = 0; i < 10; i++) game.frameUpdate();
                break;
              case 'frames_50':
                for (let i = 0; i < 50; i++) game.frameUpdate();
                break;
            }

            // State must always be valid
            expect(VALID_STATES).toContain(game.state);
          }
        }
      ),
      { numRuns: 500 }
    );
  });
});
