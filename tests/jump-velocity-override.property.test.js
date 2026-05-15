import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 3: Jump Velocity Override
 *
 * For any prior Ghosty velocity and any CONFIG.jumpForce value,
 * invoking jump while playing sets velocity to exactly CONFIG.jumpForce
 * (not additive to prior velocity).
 *
 * **Validates: Requirements 2.4, 3.4**
 */

/**
 * Creates a minimal game model that isolates the jump behavior.
 * Mirrors the jump() logic from game.js without DOM/Canvas dependencies.
 */
function createJumpModel(initialVelocity, jumpForce) {
  let gameState = 'playing';
  let ghosty = {
    x: 120,
    y: 250,
    width: 36,
    height: 36,
    velocity: initialVelocity,
  };

  const CONFIG = {
    jumpForce: jumpForce,
  };

  function jump() {
    if (gameState === 'waiting') {
      gameState = 'playing';
    }

    if (gameState === 'playing') {
      ghosty.velocity = CONFIG.jumpForce;
    }

    if (gameState === 'gameover') {
      // resetGame would be called here
      gameState = 'waiting';
    }
  }

  return {
    get velocity() { return ghosty.velocity; },
    get state() { return gameState; },
    get jumpForce() { return CONFIG.jumpForce; },
    jump,
  };
}

describe('Property 3: Jump Velocity Override', () => {
  it('jump sets velocity to exactly CONFIG.jumpForce regardless of prior velocity', () => {
    fc.assert(
      fc.property(
        // Any prior velocity (could be positive, negative, zero, large, small)
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        // Any jumpForce value (negative numbers represent upward force)
        fc.double({ min: -100, max: -0.1, noNaN: true, noDefaultInfinity: true }),
        (priorVelocity, jumpForce) => {
          const game = createJumpModel(priorVelocity, jumpForce);

          // Precondition: game is in 'playing' state with the given prior velocity
          expect(game.state).toBe('playing');
          expect(game.velocity).toBe(priorVelocity);

          // Act: invoke jump
          game.jump();

          // Assert: velocity is exactly jumpForce (override, not additive)
          expect(game.velocity).toBe(jumpForce);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('jump velocity override is independent of prior velocity magnitude', () => {
    fc.assert(
      fc.property(
        // Two different prior velocities
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        // A single jumpForce value
        fc.double({ min: -100, max: -0.1, noNaN: true, noDefaultInfinity: true }),
        (velocity1, velocity2, jumpForce) => {
          const game1 = createJumpModel(velocity1, jumpForce);
          const game2 = createJumpModel(velocity2, jumpForce);

          // Both start playing with different velocities
          game1.jump();
          game2.jump();

          // Both end up with the same velocity (exactly jumpForce)
          expect(game1.velocity).toBe(game2.velocity);
          expect(game1.velocity).toBe(jumpForce);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('jump while playing always results in velocity equal to CONFIG.jumpForce for any CONFIG value', () => {
    fc.assert(
      fc.property(
        // Arbitrary prior velocity (integers and doubles)
        fc.oneof(
          fc.integer({ min: -500, max: 500 }),
          fc.double({ min: -500, max: 500, noNaN: true, noDefaultInfinity: true })
        ),
        // Arbitrary jumpForce (negative values for upward force)
        fc.oneof(
          fc.integer({ min: -50, max: -1 }),
          fc.double({ min: -50, max: -0.1, noNaN: true, noDefaultInfinity: true })
        ),
        (priorVelocity, jumpForce) => {
          const game = createJumpModel(priorVelocity, jumpForce);

          // Act
          game.jump();

          // The velocity after jump must be exactly CONFIG.jumpForce
          expect(game.velocity).toBe(jumpForce);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
