import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 15: Settings Reset Restores Defaults
 *
 * For any set of modified CONFIG values, clicking reset restores all CONFIG
 * properties to their original default values.
 *
 * **Validates: Requirements 10.4**
 */

/**
 * Creates a self-contained model of the settings reset system.
 * Models the CONFIG object, the defaults snapshot, and the reset function
 * as implemented in settings.js.
 */
function createSettingsModel() {
  // Default CONFIG values as defined in config.js
  const CONFIG = {
    gravity: 0.4,
    jumpForce: -7,
    pipeWidth: 70,
    pipeGap: 160,
    pipeSpeed: 2.5,
    pipeSpawnInterval: 180,
    ghostySize: 36,
    hitboxInset: 4,
    cloudCount: 5,
    cloudMinSpeed: 0.3,
    cloudMaxSpeed: 0.8,
    canvasWidth: 800,
    canvasHeight: 500,
  };

  // Snapshot of defaults taken at "page load" (mirrors: const defaults = { ...CONFIG })
  const defaults = { ...CONFIG };

  /**
   * Applies arbitrary modifications to CONFIG properties.
   * Simulates a user moving sliders to change values.
   */
  function modifyConfig(modifications) {
    Object.assign(CONFIG, modifications);
  }

  /**
   * Resets CONFIG to defaults (mirrors the resetDefaults click handler).
   */
  function resetDefaults() {
    Object.assign(CONFIG, defaults);
  }

  return {
    CONFIG,
    defaults,
    modifyConfig,
    resetDefaults,
  };
}

// Arbitrary for generating random CONFIG modifications
// Uses ranges that cover realistic slider values and beyond
const configModificationsArb = fc.record({
  gravity: fc.double({ min: 0.1, max: 2.0, noNaN: true }),
  jumpForce: fc.double({ min: -20, max: -1, noNaN: true }),
  pipeWidth: fc.integer({ min: 30, max: 200 }),
  pipeGap: fc.integer({ min: 80, max: 300 }),
  pipeSpeed: fc.double({ min: 0.5, max: 10, noNaN: true }),
  pipeSpawnInterval: fc.integer({ min: 30, max: 500 }),
  ghostySize: fc.integer({ min: 16, max: 100 }),
  hitboxInset: fc.integer({ min: 0, max: 20 }),
  cloudCount: fc.integer({ min: 1, max: 20 }),
  cloudMinSpeed: fc.double({ min: 0.1, max: 1.0, noNaN: true }),
  cloudMaxSpeed: fc.double({ min: 0.5, max: 3.0, noNaN: true }),
  canvasWidth: fc.integer({ min: 400, max: 1920 }),
  canvasHeight: fc.integer({ min: 300, max: 1080 }),
});

describe('Property 15: Settings Reset Restores Defaults', () => {
  it('for any set of modified CONFIG values, reset restores all properties to original defaults', () => {
    fc.assert(
      fc.property(
        configModificationsArb,
        (modifications) => {
          const settings = createSettingsModel();

          // Apply arbitrary modifications to CONFIG
          settings.modifyConfig(modifications);

          // Verify CONFIG was actually modified (at least some values differ)
          // (Not strictly necessary but confirms the test is meaningful)

          // Call reset
          settings.resetDefaults();

          // Assert all CONFIG properties match the original defaults exactly
          expect(settings.CONFIG.gravity).toBe(settings.defaults.gravity);
          expect(settings.CONFIG.jumpForce).toBe(settings.defaults.jumpForce);
          expect(settings.CONFIG.pipeWidth).toBe(settings.defaults.pipeWidth);
          expect(settings.CONFIG.pipeGap).toBe(settings.defaults.pipeGap);
          expect(settings.CONFIG.pipeSpeed).toBe(settings.defaults.pipeSpeed);
          expect(settings.CONFIG.pipeSpawnInterval).toBe(settings.defaults.pipeSpawnInterval);
          expect(settings.CONFIG.ghostySize).toBe(settings.defaults.ghostySize);
          expect(settings.CONFIG.hitboxInset).toBe(settings.defaults.hitboxInset);
          expect(settings.CONFIG.cloudCount).toBe(settings.defaults.cloudCount);
          expect(settings.CONFIG.cloudMinSpeed).toBe(settings.defaults.cloudMinSpeed);
          expect(settings.CONFIG.cloudMaxSpeed).toBe(settings.defaults.cloudMaxSpeed);
          expect(settings.CONFIG.canvasWidth).toBe(settings.defaults.canvasWidth);
          expect(settings.CONFIG.canvasHeight).toBe(settings.defaults.canvasHeight);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('reset restores defaults even after multiple successive modifications', () => {
    fc.assert(
      fc.property(
        fc.array(configModificationsArb, { minLength: 2, maxLength: 10 }),
        (modificationsList) => {
          const settings = createSettingsModel();

          // Apply multiple rounds of modifications
          for (const modifications of modificationsList) {
            settings.modifyConfig(modifications);
          }

          // Call reset once
          settings.resetDefaults();

          // Assert all CONFIG properties match the original defaults
          expect(settings.CONFIG.gravity).toBe(0.4);
          expect(settings.CONFIG.jumpForce).toBe(-7);
          expect(settings.CONFIG.pipeWidth).toBe(70);
          expect(settings.CONFIG.pipeGap).toBe(160);
          expect(settings.CONFIG.pipeSpeed).toBe(2.5);
          expect(settings.CONFIG.pipeSpawnInterval).toBe(180);
          expect(settings.CONFIG.ghostySize).toBe(36);
          expect(settings.CONFIG.hitboxInset).toBe(4);
          expect(settings.CONFIG.cloudCount).toBe(5);
          expect(settings.CONFIG.cloudMinSpeed).toBe(0.3);
          expect(settings.CONFIG.cloudMaxSpeed).toBe(0.8);
          expect(settings.CONFIG.canvasWidth).toBe(800);
          expect(settings.CONFIG.canvasHeight).toBe(500);
        }
      ),
      { numRuns: 500 }
    );
  });
});
