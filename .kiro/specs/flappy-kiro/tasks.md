# Implementation Plan: Flappy Kiro

## Overview

Implement a complete Flappy Kiro arcade game using vanilla HTML5 Canvas and JavaScript. The implementation covers configuration setup, HTML structure with canvas/score bar/settings panel, core game engine with game loop/physics/collision/rendering/state management, settings controller, and property-based tests using fast-check. The existing project files (config.js, game.js, settings.js, index.html) will be updated to fully satisfy all 12 requirements and validate the 16 correctness properties from the design.

## Tasks

- [x] 1. Set up configuration and project structure
  - [x] 1.1 Implement CONFIG object in config.js
    - Define the centralized CONFIG object with all default values: gravity=0.4, jumpForce=-7, pipeWidth=70, pipeGap=160, pipeSpeed=2.5, pipeSpawnInterval=180, ghostySize=36, hitboxInset=4, cloudCount=5, cloudMinSpeed=0.3, cloudMaxSpeed=0.8, canvasWidth=800, canvasHeight=500
    - Ensure CONFIG is a mutable global object that can be reassigned via direct property assignment
    - _Requirements: 11.1, 11.2_

  - [x] 1.2 Implement HTML structure in index.html
    - Create the full HTML page with Canvas element, Score Bar DOM, Settings Panel with 8 sliders (gravity, jumpForce, pipeGap, pipeSpeed, pipeWidth, pipeSpawnInterval, ghostySize, hitboxInset), settings toggle button, and reset defaults button
    - Include all CSS styling for game container, canvas wrapper, score bar, settings panel, and slider controls
    - Load scripts in order: config.js, game.js, settings.js
    - _Requirements: 7.1, 10.1, 10.6_

- [x] 2. Implement core game engine - state management and input
  - [x] 2.1 Implement game state machine and input handling in game.js
    - Initialize game state variables: ghosty entity, pipes array, clouds array, score, highScore (from localStorage), gameState='waiting', frameCount
    - Implement jump() function with state transitions: waiting→playing, playing→apply jumpForce, gameover→resetGame
    - Implement resetGame() to restore all state to initial values (ghosty at center, velocity=0, pipes cleared, score=0, frameCount=0, gameState='waiting')
    - Bind event listeners for keyboard (Space, ArrowUp), mouse click on canvas, and touchstart on canvas with preventDefault
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.2 Write property test for state machine integrity
    - **Property 1: State Machine Integrity**
    - Test that for any sequence of game actions (jumps, frame updates, collisions), Game_State is always exactly one of 'waiting', 'playing', or 'gameover' and transitions only follow valid paths
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [x] 2.3 Write property test for jump velocity override
    - **Property 3: Jump Velocity Override**
    - Test that for any prior velocity and any CONFIG.jumpForce value, invoking jump while playing sets velocity to exactly CONFIG.jumpForce (not additive)
    - **Validates: Requirements 2.4, 3.4**

  - [x] 2.4 Write property test for reset completeness
    - **Property 14: Reset Completeness**
    - Test that for any game state (regardless of score, pipe positions, ghosty position, or frame count), after resetGame() the state is indistinguishable from initial load
    - **Validates: Requirements 1.5, 10.4**

- [x] 3. Implement core game engine - physics and pipe systems
  - [x] 3.1 Implement physics simulation
    - Apply semi-implicit Euler integration: velocity updated before position each frame
    - Each frame while playing: ghosty.velocity += CONFIG.gravity, then ghosty.y += ghosty.velocity
    - Cap maximum downward velocity at 12 pixels per frame
    - On jump: override velocity with CONFIG.jumpForce (not additive)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Write property test for semi-implicit Euler physics
    - **Property 2: Semi-Implicit Euler Physics**
    - Test that for any velocity v and position y, after one physics frame with gravity g, new velocity is v+g and new position is y+(v+g)
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 3.3 Implement pipe spawning and movement
    - Spawn pipes every CONFIG.pipeSpawnInterval frames with topHeight in [60, canvasHeight - pipeGap - 60]
    - Move pipes leftward by CONFIG.pipeSpeed each frame
    - Score when pipe trailing edge passes ghosty.x (mark as scored to prevent double-counting)
    - Remove pipes when trailing edge passes -10px
    - Stop spawning/moving when gameover
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 3.4 Write property test for pipe gap guarantee
    - **Property 4: Pipe Gap Guarantee**
    - Test that for any spawned pipe, the vertical gap is exactly CONFIG.pipeGap pixels
    - **Validates: Requirements 4.4**

  - [x] 3.5 Write property test for pipe reachability
    - **Property 5: Pipe Reachability**
    - Test that for any spawned pipe, topHeight is within [60, canvasHeight - CONFIG.pipeGap - 60]
    - **Validates: Requirements 4.2**

  - [x] 3.6 Write property test for pipe movement
    - **Property 6: Pipe Movement**
    - Test that for any pipe at position x with pipeSpeed s, after one frame update the pipe's new x is x - s
    - **Validates: Requirements 4.3**

  - [x] 3.7 Write property test for pipe lifecycle (no double scoring)
    - **Property 16: Pipe Lifecycle (No Double Scoring)**
    - Test that for any pipe, it is scored exactly once when it passes Ghosty's x position and removed when fully off-screen
    - **Validates: Requirements 4.5, 4.6**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement collision detection and scoring
  - [x] 5.1 Implement collision detection
    - Check floor/ceiling boundaries (ghosty.y < 0 or ghosty.y + height > canvasHeight)
    - Check pipe collisions using AABB with hitbox inset on all four sides
    - Horizontal overlap: ghostRight > pipeLeft AND ghostLeft < pipeRight
    - Vertical overlap: ghostTop < pipe.topHeight OR ghostBottom > pipe.topHeight + pipeGap
    - Early return on first collision found
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.2 Write property test for collision detection correctness
    - **Property 9: Collision Detection Correctness**
    - Test that for any ghosty position and set of pipes, checkCollision returns true iff the inset hitbox overlaps any pipe rectangle or canvas boundary
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [x] 5.3 Implement scoring and high score persistence
    - Display score in format "Score: {current} | High: {high}" in Score Bar
    - Increment score by 1 when pipe trailing edge passes ghosty.x
    - Update highScore and persist to localStorage on gameover if score > highScore
    - Load highScore from localStorage on init, defaulting to 0
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 5.4 Write property test for score monotonicity
    - **Property 7: Score Monotonicity**
    - Test that for any sequence of game frames during playing, score only increases (by exactly 1 per pipe passed) and never decreases
    - **Validates: Requirements 4.6, 6.2, 6.3**

  - [x] 5.5 Write property test for high score invariant
    - **Property 8: High Score Invariant**
    - Test that highScore is always >= current score, and when gameover occurs with score > highScore, highScore is updated
    - **Validates: Requirements 6.4, 6.5**

- [x] 6. Implement rendering system
  - [x] 6.1 Implement canvas rendering and game loop
    - Set up requestAnimationFrame-based game loop targeting ~60fps
    - Clear canvas with sky blue background each frame
    - Render in layer order: sky background → clouds → pipes → Ghosty → overlay text
    - Continue game loop in all states (waiting, playing, gameover) for cloud animation
    - _Requirements: 7.1, 7.2, 7.8, 1.6_

  - [x] 6.2 Write property test for frame independence
    - **Property 10: Frame Independence**
    - Test that for any invocation of the game loop, exactly one requestAnimationFrame call is produced
    - **Validates: Requirements 7.2**

  - [x] 6.3 Implement Ghosty rendering with rotation and fallback
    - Render ghosty sprite with rotation based on velocity: angle = clamp(velocity * 3, -30, +45) degrees
    - Use canvas save/restore for transform state
    - Implement fallback ghost shape using canvas primitives if image fails to load
    - _Requirements: 7.3, 7.5, 12.1_

  - [x] 6.4 Write property test for Ghosty rotation clamping
    - **Property 11: Ghosty Rotation Clamping**
    - Test that for any velocity value, the rendered rotation angle is clamped between -30 and +45 degrees
    - **Validates: Requirements 7.3**

  - [x] 6.5 Implement pipe rendering with caps
    - Draw top pipe body, top pipe cap with 8px overhang, bottom pipe body, bottom pipe cap with 8px overhang
    - _Requirements: 7.4_

  - [x] 6.6 Implement game overlays
    - Waiting state: semi-transparent overlay with title "Flappy Kiro" and start prompt
    - Gameover state: overlay with "Game Over", score display, and restart prompt
    - _Requirements: 7.6, 7.7_

- [x] 7. Implement background clouds and audio
  - [x] 7.1 Implement cloud system
    - Initialize CONFIG.cloudCount clouds with random positions (x across canvas width, y in upper 60%)
    - Assign width 60-100px, height = 40% of width, speed between cloudMinSpeed and cloudMaxSpeed
    - Update cloud positions every frame (subtract speed from x)
    - Wrap clouds to right edge when fully off-screen left (x + width < 0)
    - Render clouds using ellipse primitives
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 7.2 Write property test for cloud initialization validity
    - **Property 12: Cloud Initialization Validity**
    - Test that for any CONFIG values, all initialized clouds have y within [0, canvasHeight*0.6], width within [60, 100], and speed within [cloudMinSpeed, cloudMaxSpeed]
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x] 7.3 Write property test for cloud wrapping
    - **Property 13: Cloud Wrapping**
    - Test that for any cloud that scrolls fully off-screen left, it wraps to the right edge
    - **Validates: Requirements 8.5**

  - [x] 7.4 Implement audio system
    - Load jump.wav and game_over.wav audio files
    - Play jump sound on jump (reset currentTime to 0 for rapid re-triggering)
    - Play game over sound on collision
    - Wrap all play() calls in try-catch for autoplay policy / load failure resilience
    - _Requirements: 9.1, 9.2, 9.3, 12.2_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement settings controller and error resilience
  - [x] 9.1 Implement settings controller in settings.js
    - Bind 8 sliders to CONFIG properties with appropriate transforms (gravity, jumpForce negation, pipeGap, pipeSpeed, pipeWidth, pipeSpawnInterval, ghostySize, hitboxInset)
    - Display current numeric value adjacent to each slider
    - Toggle settings panel visibility on toggle button click
    - Immediately update ghosty.width and ghosty.height when ghostySize changes
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

  - [x] 9.2 Implement reset defaults functionality
    - Store initial CONFIG values at page load
    - On reset button click, restore all CONFIG properties to defaults
    - Update all slider positions and displayed values to match defaults
    - Reset ghosty dimensions to default ghostySize
    - _Requirements: 10.4, 11.4_

  - [x] 9.3 Write property test for settings reset restores defaults
    - **Property 15: Settings Reset Restores Defaults**
    - Test that for any set of modified CONFIG values, clicking reset restores all CONFIG properties to their original defaults
    - **Validates: Requirements 10.4**

  - [x] 9.4 Implement error resilience
    - Handle ghosty image load failure with fallback rendering
    - Wrap audio play calls in try-catch
    - Handle localStorage unavailability (default highScore to 0, skip persistence)
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 10. Integration and wiring
  - [x] 10.1 Wire all components together
    - Ensure config.js loads before game.js and settings.js in index.html
    - Verify game loop reads CONFIG properties directly each frame (no caching)
    - Verify settings panel updates take effect on next animation frame
    - Connect gameOver() to update score bar and persist high score
    - Ensure all event listeners are properly attached
    - _Requirements: 11.2, 11.3, 10.2_

  - [x] 10.2 Write integration tests
    - Test full game loop simulation: run N frames programmatically, verify no crashes
    - Test input sequence replay: feed deterministic inputs, verify expected score
    - Test settings panel: change CONFIG values, verify game responds correctly
    - _Requirements: 1.1, 1.6, 10.2, 11.3_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The existing project files (config.js, game.js, settings.js, index.html) already contain partial implementations that should be updated/refined to meet all requirements
- All game logic uses vanilla JavaScript with no external dependencies (except fast-check for testing)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "7.1", "7.4"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "3.3"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.5", "3.6", "3.7", "5.1", "5.3"] },
    { "id": 4, "tasks": ["5.2", "5.4", "5.5", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.5", "6.6", "7.2", "7.3"] },
    { "id": 6, "tasks": ["6.4", "9.1", "9.4"] },
    { "id": 7, "tasks": ["9.2", "9.3"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2"] }
  ]
}
```
