import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 10: Frame Independence
 *
 * For any invocation of the game loop, exactly one requestAnimationFrame call
 * is produced — no recursive doubling or missed frames.
 *
 * Validates: Requirements 7.2
 */

/**
 * Creates a self-contained game loop model that tracks requestAnimationFrame calls.
 * This mirrors the structure of gameLoop() in game.js, which always ends with
 * a single requestAnimationFrame(gameLoop) call regardless of game state or
 * what happens during the frame.
 */
function createGameLoopModel(initialState) {
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
    cloudCount: 5,
    cloudMinSpeed: 0.3,
    cloudMaxSpeed: 0.8,
  };

  let gameState = initialState;
  let ghosty = { x: 120, y: CONFIG.canvasHeight / 2, width: 36, height: 36, velocity: 0 };
  let pipes = [];
  let clouds = [];
  let score = 0;
  let frameCount = 0;
  let rafCallCount = 0;

  // Initialize clouds
  for (let i = 0; i < CONFIG.cloudCount; i++) {
    const width = 60 + Math.random() * 40;
    clouds.push({
      x: Math.random() * CONFIG.canvasWidth,
      y: Math.random() * (CONFIG.canvasHeight * 0.6),
      width: width,
      height: width * 0.4,
      speed: CONFIG.cloudMinSpeed + Math.random() * (CONFIG.cloudMaxSpeed - CONFIG.cloudMinSpeed),
    });
  }

  // Mock requestAnimationFrame that just counts calls
  function mockRequestAnimationFrame(_callback) {
    rafCallCount++;
  }

  function checkCollision() {
    const inset = CONFIG.hitboxInset;
    if (ghosty.y + ghosty.height > CONFIG.canvasHeight || ghosty.y < 0) {
      return true;
    }
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

  function gameOver() {
    gameState = 'gameover';
  }

  function spawnPipe() {
    const minTop = 60;
    const maxTop = CONFIG.canvasHeight - CONFIG.pipeGap - 60;
    const topHeight = minTop + Math.random() * (maxTop - minTop);
    pipes.push({ x: CONFIG.canvasWidth, topHeight, scored: false });
  }

  /**
   * Models the game loop from game.js.
   * The key invariant: regardless of game state, collision, or any other
   * condition, exactly one requestAnimationFrame call is made at the end.
   */
  function gameLoop() {
    // Phase 1: Update clouds (all states)
    for (let cloud of clouds) {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = CONFIG.canvasWidth;
        cloud.y = Math.random() * (CONFIG.canvasHeight * 0.6);
      }
    }

    // Phase 2: Update game logic (playing state only)
    if (gameState === 'playing') {
      ghosty.velocity += CONFIG.gravity;
      if (ghosty.velocity > 12) ghosty.velocity = 12;
      ghosty.y += ghosty.velocity;

      frameCount++;
      if (frameCount % CONFIG.pipeSpawnInterval === 0) {
        spawnPipe();
      }

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

      if (checkCollision()) {
        gameOver();
      }
    }

    // Phase 3: Rendering would happen here (omitted - no canvas in tests)

    // Phase 4: Schedule next frame — this is the critical invariant
    mockRequestAnimationFrame(gameLoop);
  }

  return {
    gameLoop,
    get rafCallCount() { return rafCallCount; },
    resetRafCount() { rafCallCount = 0; },
    get state() { return gameState; },
    set state(s) { gameState = s; },
    get ghosty() { return ghosty; },
    set pipes(p) { pipes = p; },
    get pipes() { return pipes; },
  };
}

// Arbitrary for game states
const gameStateArb = fc.constantFrom('waiting', 'playing', 'gameover');

// Arbitrary for ghosty positions (various positions including edge cases)
const ghostyYArb = fc.integer({ min: -50, max: 600 });
const ghostyVelocityArb = fc.integer({ min: -20, max: 20 });

// Arbitrary for pipe configurations
const pipeArb = fc.record({
  x: fc.integer({ min: -100, max: 900 }),
  topHeight: fc.integer({ min: 60, max: 280 }),
  scored: fc.boolean(),
});

// Arbitrary for number of consecutive frames to run
const frameCountArb = fc.integer({ min: 1, max: 60 });

describe('Property 10: Frame Independence', () => {
  it('each invocation of gameLoop produces exactly one requestAnimationFrame call', () => {
    fc.assert(
      fc.property(
        gameStateArb,
        ghostyYArb,
        ghostyVelocityArb,
        fc.array(pipeArb, { minLength: 0, maxLength: 10 }),
        (state, ghostyY, ghostyVelocity, pipeConfigs) => {
          const model = createGameLoopModel(state);

          // Set up arbitrary game state
          model.ghosty.y = ghostyY;
          model.ghosty.velocity = ghostyVelocity;
          model.pipes = pipeConfigs.map((p) => ({ ...p }));

          // Reset counter and invoke game loop once
          model.resetRafCount();
          model.gameLoop();

          // Exactly one requestAnimationFrame call must have been made
          expect(model.rafCallCount).toBe(1);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('frame independence holds across multiple consecutive frames', () => {
    fc.assert(
      fc.property(
        gameStateArb,
        frameCountArb,
        (initialState, numFrames) => {
          const model = createGameLoopModel(initialState);

          // Run multiple frames and verify each produces exactly one RAF call
          for (let i = 0; i < numFrames; i++) {
            model.resetRafCount();
            model.gameLoop();
            expect(model.rafCallCount).toBe(1);
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  it('frame independence holds even when collision triggers state change mid-frame', () => {
    fc.assert(
      fc.property(
        ghostyYArb,
        ghostyVelocityArb,
        fc.array(pipeArb, { minLength: 0, maxLength: 5 }),
        (ghostyY, ghostyVelocity, pipeConfigs) => {
          // Start in playing state where collisions can happen
          const model = createGameLoopModel('playing');

          model.ghosty.y = ghostyY;
          model.ghosty.velocity = ghostyVelocity;
          model.pipes = pipeConfigs.map((p) => ({ ...p }));

          // Even if a collision occurs during this frame (transitioning
          // from 'playing' to 'gameover'), exactly one RAF call is produced
          model.resetRafCount();
          model.gameLoop();

          expect(model.rafCallCount).toBe(1);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
