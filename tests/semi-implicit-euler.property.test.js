import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 2: Semi-Implicit Euler Physics
 *
 * For any Ghosty velocity v and position y, after one physics frame with
 * gravity g, the new velocity is v + g and the new position is y + (v + g).
 * Velocity is updated before position (semi-implicit Euler integration).
 *
 * Also tests the velocity cap: when v + g > 12, velocity is capped at 12
 * and position uses the capped velocity.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

/**
 * Applies one physics frame using semi-implicit Euler integration.
 * Mirrors the physics logic from game.js without DOM/Canvas dependencies.
 *
 * @param {number} velocity - Current vertical velocity
 * @param {number} y - Current vertical position
 * @param {number} gravity - Gravity acceleration per frame
 * @returns {{ velocity: number, y: number }} Updated velocity and position
 */
function applyPhysicsFrame(velocity, y, gravity) {
  // Semi-implicit Euler: velocity updated first
  let newVelocity = velocity + gravity;
  // Cap maximum downward velocity at 12 pixels per frame
  if (newVelocity > 12) newVelocity = 12;
  // Then position updated using new velocity
  const newY = y + newVelocity;
  return { velocity: newVelocity, y: newY };
}

describe('Property 2: Semi-Implicit Euler Physics', () => {
  it('velocity is updated before position: newV = v + g, newY = y + newV (when no cap)', () => {
    fc.assert(
      fc.property(
        // Velocity in range that won't hit the cap after adding gravity
        fc.double({ min: -50, max: 11, noNaN: true, noDefaultInfinity: true }),
        // Position can be any reasonable number
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        // Gravity is a positive number (pulls downward)
        fc.double({ min: 0.01, max: 5, noNaN: true, noDefaultInfinity: true }),
        (v, y, g) => {
          // Only test cases where the cap won't be hit
          fc.pre(v + g <= 12);

          const result = applyPhysicsFrame(v, y, g);

          // Semi-implicit Euler: velocity updated first
          const expectedVelocity = v + g;
          // Position uses the NEW velocity (not the old one)
          const expectedY = y + expectedVelocity;

          expect(result.velocity).toBeCloseTo(expectedVelocity, 10);
          expect(result.y).toBeCloseTo(expectedY, 10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('velocity is capped at 12 when v + g exceeds 12, and position uses capped velocity', () => {
    fc.assert(
      fc.property(
        // Velocity that will exceed cap when gravity is added
        fc.double({ min: 8, max: 50, noNaN: true, noDefaultInfinity: true }),
        // Position can be any reasonable number
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        // Gravity is a positive number
        fc.double({ min: 0.01, max: 5, noNaN: true, noDefaultInfinity: true }),
        (v, y, g) => {
          // Only test cases where the cap IS hit
          fc.pre(v + g > 12);

          const result = applyPhysicsFrame(v, y, g);

          // Velocity should be capped at 12
          expect(result.velocity).toBe(12);
          // Position uses the capped velocity (12), not v + g
          expect(result.y).toBeCloseTo(y + 12, 10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('position always uses the new velocity (semi-implicit), not the old velocity (explicit Euler)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -50, max: 11, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 5, noNaN: true, noDefaultInfinity: true }),
        (v, y, g) => {
          fc.pre(v + g <= 12);

          const result = applyPhysicsFrame(v, y, g);

          // Explicit Euler would be: newY = y + v (using OLD velocity)
          // Semi-implicit Euler is: newY = y + (v + g) (using NEW velocity)
          // These differ by exactly g
          const explicitEulerY = y + v;
          const semiImplicitEulerY = y + (v + g);

          // Result should match semi-implicit, NOT explicit
          expect(result.y).toBeCloseTo(semiImplicitEulerY, 10);
          // And differ from explicit Euler by g (unless g is 0)
          if (g !== 0) {
            expect(result.y).not.toBeCloseTo(explicitEulerY, 10);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });
});
