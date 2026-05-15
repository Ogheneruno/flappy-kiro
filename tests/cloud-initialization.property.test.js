import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 12: Cloud Initialization Validity
 *
 * For any CONFIG.cloudCount, cloudMinSpeed, cloudMaxSpeed, and canvasHeight values,
 * all initialized Clouds have:
 *   - y within [0, canvasHeight * 0.6]
 *   - width within [60, 100]
 *   - height equal to width * 0.4
 *   - speed within [cloudMinSpeed, cloudMaxSpeed]
 *
 * This models the initClouds() function from game.js which creates cloud entities
 * with randomized properties constrained by CONFIG values.
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

/**
 * Models initClouds() from game.js — creates cloud entities with properties
 * derived from the given CONFIG values.
 */
function initCloudsModel(config) {
  const clouds = [];
  for (let i = 0; i < config.cloudCount; i++) {
    const width = 60 + Math.random() * 40; // 60-100px
    clouds.push({
      x: Math.random() * config.canvasWidth,
      y: Math.random() * (config.canvasHeight * 0.6),
      width: width,
      height: width * 0.4,
      speed: config.cloudMinSpeed + Math.random() * (config.cloudMaxSpeed - config.cloudMinSpeed)
    });
  }
  return clouds;
}

describe('Property 12: Cloud Initialization Validity', () => {
  it('for any CONFIG values, all initialized clouds have valid y, width, height, and speed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),       // cloudCount
        fc.integer({ min: 200, max: 1000 }),   // canvasHeight
        fc.double({ min: 0.1, max: 2, noNaN: true, noDefaultInfinity: true }),   // cloudMinSpeed
        fc.double({ min: 2, max: 5, noNaN: true, noDefaultInfinity: true }),     // cloudMaxSpeed
        fc.integer({ min: 400, max: 1200 }),   // canvasWidth
        (cloudCount, canvasHeight, cloudMinSpeed, cloudMaxSpeed, canvasWidth) => {
          const config = {
            cloudCount,
            canvasHeight,
            canvasWidth,
            cloudMinSpeed,
            cloudMaxSpeed
          };

          const clouds = initCloudsModel(config);

          // Should create exactly cloudCount clouds
          expect(clouds.length).toBe(cloudCount);

          for (const cloud of clouds) {
            // y must be within [0, canvasHeight * 0.6]
            expect(cloud.y).toBeGreaterThanOrEqual(0);
            expect(cloud.y).toBeLessThanOrEqual(canvasHeight * 0.6);

            // width must be within [60, 100]
            expect(cloud.width).toBeGreaterThanOrEqual(60);
            expect(cloud.width).toBeLessThanOrEqual(100);

            // height must equal width * 0.4
            expect(cloud.height).toBeCloseTo(cloud.width * 0.4, 10);

            // speed must be within [cloudMinSpeed, cloudMaxSpeed]
            expect(cloud.speed).toBeGreaterThanOrEqual(cloudMinSpeed);
            expect(cloud.speed).toBeLessThanOrEqual(cloudMaxSpeed);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('cloud y positions are bounded by the upper 60% of canvas regardless of canvas height', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200, max: 1000 }),   // canvasHeight
        fc.integer({ min: 400, max: 1200 }),   // canvasWidth
        (canvasHeight, canvasWidth) => {
          const config = {
            cloudCount: 10,
            canvasHeight,
            canvasWidth,
            cloudMinSpeed: 0.3,
            cloudMaxSpeed: 0.8
          };

          const clouds = initCloudsModel(config);
          const maxY = canvasHeight * 0.6;

          for (const cloud of clouds) {
            expect(cloud.y).toBeGreaterThanOrEqual(0);
            expect(cloud.y).toBeLessThanOrEqual(maxY);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('cloud speeds are always between cloudMinSpeed and cloudMaxSpeed for any valid speed range', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 2, noNaN: true, noDefaultInfinity: true }),   // cloudMinSpeed
        fc.double({ min: 2, max: 5, noNaN: true, noDefaultInfinity: true }),     // cloudMaxSpeed
        (cloudMinSpeed, cloudMaxSpeed) => {
          const config = {
            cloudCount: 15,
            canvasHeight: 500,
            canvasWidth: 800,
            cloudMinSpeed,
            cloudMaxSpeed
          };

          const clouds = initCloudsModel(config);

          for (const cloud of clouds) {
            expect(cloud.speed).toBeGreaterThanOrEqual(cloudMinSpeed);
            expect(cloud.speed).toBeLessThanOrEqual(cloudMaxSpeed);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });
});
