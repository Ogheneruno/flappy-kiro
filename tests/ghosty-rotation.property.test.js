import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 11: Ghosty Rotation Clamping
 *
 * For any Ghosty velocity value, the rendered rotation angle is clamped
 * between -30 degrees (rising) and +45 degrees (falling).
 *
 * The rotation formula from game.js drawGhosty():
 *   angle = Math.min(Math.max(ghosty.velocity * 3, -30), 45) * (Math.PI / 180)
 *
 * This is equivalent to: clamp(velocity * 3, -30, 45) converted to radians.
 *
 * Validates: Requirements 7.3
 */

/**
 * Models the rotation calculation from drawGhosty() in game.js.
 * Returns the angle in degrees (before radian conversion).
 */
function computeRotationDegrees(velocity) {
  return Math.min(Math.max(velocity * 3, -30), 45);
}

describe('Property 11: Ghosty Rotation Clamping', () => {
  it('for any velocity value, the rotation angle in degrees is always between -30 and +45', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (velocity) => {
          const angleDegrees = computeRotationDegrees(velocity);

          expect(angleDegrees).toBeGreaterThanOrEqual(-30);
          expect(angleDegrees).toBeLessThanOrEqual(45);
        }
      ),
      { numRuns: 10000 }
    );
  });

  it('for any velocity where velocity * 3 is within [-30, 45], angle equals velocity * 3 exactly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10, max: 15, noNaN: true, noDefaultInfinity: true }),
        (velocity) => {
          const raw = velocity * 3;

          // Only test when the raw value is within the clamp range
          fc.pre(raw >= -30 && raw <= 45);

          const angleDegrees = computeRotationDegrees(velocity);
          expect(angleDegrees).toBeCloseTo(raw, 10);
        }
      ),
      { numRuns: 10000 }
    );
  });

  it('for any very negative velocity (strong upward), angle is clamped to -30 degrees', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: -11, noNaN: true, noDefaultInfinity: true }),
        (velocity) => {
          // velocity * 3 < -30 when velocity < -10
          const angleDegrees = computeRotationDegrees(velocity);
          expect(angleDegrees).toBe(-30);
        }
      ),
      { numRuns: 5000 }
    );
  });

  it('for any very positive velocity (strong downward), angle is clamped to +45 degrees', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 16, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (velocity) => {
          // velocity * 3 > 45 when velocity > 15
          const angleDegrees = computeRotationDegrees(velocity);
          expect(angleDegrees).toBe(45);
        }
      ),
      { numRuns: 5000 }
    );
  });

  it('the radian conversion preserves the clamped range [-30°, +45°]', () => {
    const minRadians = -30 * (Math.PI / 180);
    const maxRadians = 45 * (Math.PI / 180);

    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (velocity) => {
          const angleDegrees = computeRotationDegrees(velocity);
          const angleRadians = angleDegrees * (Math.PI / 180);

          expect(angleRadians).toBeGreaterThanOrEqual(minRadians - 1e-10);
          expect(angleRadians).toBeLessThanOrEqual(maxRadians + 1e-10);
        }
      ),
      { numRuns: 10000 }
    );
  });
});
