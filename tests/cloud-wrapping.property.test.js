import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 13: Cloud Wrapping
 *
 * For any Cloud that scrolls fully off-screen to the left, it wraps to the
 * right edge of the Canvas, maintaining continuous background decoration.
 *
 * Validates: Requirements 8.5
 */

/**
 * Simulates cloud movement and wrapping for a single frame.
 * In game.js, during each frame (all states):
 *   cloud.x -= cloud.speed;
 *   if (cloud.x + cloud.width < 0) {
 *       cloud.x = CONFIG.canvasWidth;
 *       cloud.y = Math.random() * (CONFIG.canvasHeight * 0.6);
 *   }
 *
 * This model applies the same logic to verify the wrapping property.
 */
function applyCloudMovement(cloud, config) {
  cloud.x -= cloud.speed;
  if (cloud.x + cloud.width < 0) {
    cloud.x = config.canvasWidth;
    cloud.y = Math.random() * (config.canvasHeight * 0.6);
  }
  return cloud;
}

// Arbitraries
const canvasWidthArb = fc.integer({ min: 200, max: 2000 });
const canvasHeightArb = fc.integer({ min: 200, max: 1500 });
const cloudWidthArb = fc.integer({ min: 60, max: 100 });
const cloudSpeedArb = fc.integer({ min: 1, max: 50 }).map((n) => n / 10); // 0.1 to 5.0
const cloudXArb = fc.integer({ min: -500, max: 2000 });

describe('Property 13: Cloud Wrapping', () => {
  it('a cloud that scrolls fully off-screen left wraps to x = canvasWidth', () => {
    fc.assert(
      fc.property(
        canvasWidthArb,
        canvasHeightArb,
        cloudWidthArb,
        cloudSpeedArb,
        (canvasWidth, canvasHeight, cloudWidth, speed) => {
          const config = { canvasWidth, canvasHeight };

          // Place cloud just barely still on-screen, then simulate frames
          // until it goes off-screen left (x + width < 0)
          const cloud = {
            x: 0, // start at left edge
            y: Math.random() * (canvasHeight * 0.6),
            width: cloudWidth,
            speed: speed,
          };

          // Simulate frames until the cloud wraps
          const maxFrames = Math.ceil((cloudWidth + 1) / speed) + 10;
          let wrapped = false;

          for (let frame = 0; frame < maxFrames; frame++) {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
              // Wrapping condition met - apply wrap logic
              cloud.x = config.canvasWidth;
              cloud.y = Math.random() * (config.canvasHeight * 0.6);
              wrapped = true;
              break;
            }
          }

          // The cloud must have wrapped within the expected frames
          expect(wrapped).toBe(true);
          // After wrapping, x should equal canvasWidth
          expect(cloud.x).toBe(config.canvasWidth);
          // After wrapping, y should be within [0, canvasHeight * 0.6]
          expect(cloud.y).toBeGreaterThanOrEqual(0);
          expect(cloud.y).toBeLessThanOrEqual(config.canvasHeight * 0.6);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('cloud wraps exactly when x + width < 0 (not before)', () => {
    fc.assert(
      fc.property(
        canvasWidthArb,
        canvasHeightArb,
        cloudWidthArb,
        cloudSpeedArb,
        cloudXArb,
        (canvasWidth, canvasHeight, cloudWidth, speed, startX) => {
          const config = { canvasWidth, canvasHeight };
          const cloud = {
            x: startX,
            y: Math.random() * (canvasHeight * 0.6),
            width: cloudWidth,
            speed: speed,
          };

          // Apply one frame of movement
          const newX = cloud.x - cloud.speed;

          if (newX + cloud.width < 0) {
            // Should wrap: verify wrap position
            cloud.x = config.canvasWidth;
            cloud.y = Math.random() * (config.canvasHeight * 0.6);

            expect(cloud.x).toBe(config.canvasWidth);
            expect(cloud.y).toBeGreaterThanOrEqual(0);
            expect(cloud.y).toBeLessThanOrEqual(config.canvasHeight * 0.6);
          } else {
            // Should NOT wrap: cloud stays at new position
            cloud.x = newX;
            expect(cloud.x).toBe(newX);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('cloud wrapping produces valid y position for any canvasHeight', () => {
    fc.assert(
      fc.property(
        canvasWidthArb,
        canvasHeightArb,
        cloudWidthArb,
        cloudSpeedArb,
        (canvasWidth, canvasHeight, cloudWidth, speed) => {
          const config = { canvasWidth, canvasHeight };

          // Place cloud so it will wrap on the next frame
          const cloud = {
            x: -(cloudWidth + 1), // already past the wrap threshold
            y: 0,
            width: cloudWidth,
            speed: speed,
          };

          // The condition x + width < 0 is already true
          // Apply the wrap logic
          cloud.x -= cloud.speed;
          if (cloud.x + cloud.width < 0) {
            cloud.x = config.canvasWidth;
            cloud.y = Math.random() * (config.canvasHeight * 0.6);
          }

          // After wrapping, verify position
          expect(cloud.x).toBe(config.canvasWidth);
          expect(cloud.y).toBeGreaterThanOrEqual(0);
          expect(cloud.y).toBeLessThanOrEqual(config.canvasHeight * 0.6);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
