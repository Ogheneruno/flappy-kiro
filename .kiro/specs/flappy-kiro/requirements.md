# Requirements Document

## Introduction

Flappy Kiro is an arcade-style endless-runner browser game built with vanilla HTML5 Canvas and JavaScript. The player controls Ghosty, a ghost character, navigating through pipe obstacles by tapping or clicking to flap upward against gravity. The game features a finite state machine for game flow, real-time physics simulation, collision detection, score tracking with persistence, sound effects, and a live-tuning settings panel. No external dependencies or build tools are required.

## Glossary

- **Game_Engine**: The core game logic module (game.js) responsible for the game loop, physics, entity management, rendering, and state transitions
- **Settings_Controller**: The module (settings.js) that connects the settings panel UI sliders to the CONFIG object for live tuning
- **CONFIG**: The centralized configuration object (config.js) storing all tunable game constants
- **Ghosty**: The player-controlled ghost character entity with position, dimensions, and velocity
- **Pipe**: A pair of top and bottom obstacles with a vertical gap that scrolls from right to left
- **Cloud**: A decorative background element that scrolls horizontally at varying speeds
- **Canvas**: The HTML5 Canvas element used for all game rendering
- **Score_Bar**: The DOM element displaying the current score and high score
- **Game_State**: The finite state machine value, one of 'waiting', 'playing', or 'gameover'
- **Hitbox_Inset**: The number of pixels by which Ghosty's collision rectangle is reduced on each side for forgiveness
- **High_Score**: The highest score achieved, persisted across sessions via localStorage

## Requirements

### Requirement 1: Game State Management

**User Story:** As a player, I want the game to have clear states (waiting, playing, game over), so that I always know what is happening and what input is expected.

#### Acceptance Criteria

1. THE Game_Engine SHALL maintain Game_State as exactly one of 'waiting', 'playing', or 'gameover' at all times
2. WHEN the player provides input (Spacebar, Arrow Up, mouse click on canvas, or touch on canvas) while Game_State is 'waiting', THE Game_Engine SHALL transition Game_State to 'playing' and apply jump force to Ghosty
3. WHEN a collision is detected while Game_State is 'playing', THE Game_Engine SHALL transition Game_State to 'gameover' and persist the high score to localStorage if the current score exceeds the stored high score
4. WHEN the player provides input (Spacebar, Arrow Up, mouse click on canvas, or touch on canvas) while Game_State is 'gameover', THE Game_Engine SHALL invoke the reset procedure and transition Game_State to 'waiting'
5. WHEN Game_State transitions to 'waiting' via reset, THE Game_Engine SHALL restore Ghosty vertical position to canvas height divided by 2, set Ghosty velocity to zero, clear all Pipes from the collection, reset score to zero, and reset frame count to zero
6. WHILE Game_State is any of 'waiting', 'playing', or 'gameover', THE Game_Engine SHALL continue executing the game loop via requestAnimationFrame so that background clouds remain animated and the canvas is redrawn each frame

### Requirement 2: Player Input Handling

**User Story:** As a player, I want to control Ghosty by clicking, pressing space, or tapping, so that I can play the game with any input method.

#### Acceptance Criteria

1. WHEN the player clicks the Canvas, THE Game_Engine SHALL invoke the jump action
2. WHEN the player presses the Space key, THE Game_Engine SHALL invoke the jump action
3. WHEN the player presses the Arrow Up key, THE Game_Engine SHALL invoke the jump action
4. WHEN the player taps the Canvas on a touch device, THE Game_Engine SHALL invoke the jump action and prevent the default browser touch behavior (scrolling, zooming)
5. WHEN the jump action is invoked while Game_State is 'waiting', THE Game_Engine SHALL transition Game_State to 'playing' and set Ghosty velocity to CONFIG.jumpForce
6. WHEN the jump action is invoked while Game_State is 'playing', THE Game_Engine SHALL set Ghosty velocity to CONFIG.jumpForce
7. WHEN the jump action is invoked while Game_State is 'gameover', THE Game_Engine SHALL reset the game to its initial state and transition Game_State to 'waiting'

### Requirement 3: Physics Simulation

**User Story:** As a player, I want Ghosty to fall with gravity and rise when I flap, so that the game feels responsive and challenging.

#### Acceptance Criteria

1. WHILE Game_State is 'playing', THE Game_Engine SHALL increase Ghosty velocity by CONFIG.gravity (default 0.4 pixels/frame) each frame, up to a maximum downward velocity of 12 pixels per frame
2. WHILE Game_State is 'playing', THE Game_Engine SHALL update Ghosty vertical position by adding the current velocity (in pixels) each frame
3. THE Game_Engine SHALL use semi-implicit Euler integration where velocity is updated before position each frame
4. WHILE Game_State is 'playing', WHEN the jump action is invoked, THE Game_Engine SHALL override Ghosty velocity with CONFIG.jumpForce (default -7 pixels/frame, not additive)
5. WHEN Game_State transitions to 'playing' from 'waiting', THE Game_Engine SHALL set Ghosty velocity to 0 pixels per frame

### Requirement 4: Pipe Obstacles

**User Story:** As a player, I want pipe obstacles to appear at regular intervals with passable gaps, so that the game provides a fair challenge.

#### Acceptance Criteria

1. WHILE Game_State is 'playing', THE Game_Engine SHALL spawn a new Pipe every CONFIG.pipeSpawnInterval frames, where the frame count resets to zero at the start of each playing session
2. WHEN a Pipe is spawned, THE Game_Engine SHALL place it with its left edge at x = CONFIG.canvasWidth (the right edge of the Canvas) and a random topHeight uniformly distributed within the inclusive range [60, CONFIG.canvasHeight - CONFIG.pipeGap - 60]
3. WHILE Game_State is 'playing', THE Game_Engine SHALL move each Pipe leftward by CONFIG.pipeSpeed pixels per frame, rendering each Pipe with a width of CONFIG.pipeWidth pixels
4. THE Game_Engine SHALL maintain a vertical gap of exactly CONFIG.pipeGap pixels between the bottom edge of the top pipe section and the top edge of the bottom pipe section for each Pipe
5. WHEN a Pipe's trailing edge (pipe.x + CONFIG.pipeWidth) moves past -10 pixels on the x-axis, THE Game_Engine SHALL remove it from the active Pipes array
6. WHEN a Pipe's trailing edge (pipe.x + CONFIG.pipeWidth) crosses to the left of Ghosty's left edge (ghosty.x) and the Pipe has not been previously scored, THE Game_Engine SHALL increment the score by one and mark the Pipe as scored
7. WHEN Game_State transitions from 'playing' to 'gameover', THE Game_Engine SHALL stop spawning and moving Pipes, leaving them at their current positions

### Requirement 5: Collision Detection

**User Story:** As a player, I want collision detection to be fair and forgiving, so that near-misses feel rewarding rather than frustrating.

#### Acceptance Criteria

1. WHILE Game_State is 'playing', THE Game_Engine SHALL check for collisions between Ghosty and all Pipes each frame
2. THE Game_Engine SHALL derive Ghosty's collision rectangle from Ghosty's x, y position and CONFIG.ghostySize (width and height), then reduce it by CONFIG.hitboxInset pixels on all four sides to produce the inset hitbox used for pipe collision testing
3. WHEN Ghosty's inset hitbox horizontally overlaps a Pipe (inset hitbox right edge > pipe left edge AND inset hitbox left edge < pipe left edge + CONFIG.pipeWidth), AND Ghosty's inset hitbox top edge is above the pipe's gap top OR inset hitbox bottom edge is below the pipe's gap bottom, THE Game_Engine SHALL detect a collision
4. WHEN Ghosty's full bounding rectangle (without hitbox inset) extends beyond the Canvas top edge (y < 0) or Canvas bottom edge (y + height > CONFIG.canvasHeight), THE Game_Engine SHALL detect a collision
5. IF a collision is detected, THEN THE Game_Engine SHALL transition Game_State to 'gameover', update the high score in localStorage if the current score exceeds it, update the score bar display, and play the game over sound effect

### Requirement 6: Scoring and High Score

**User Story:** As a player, I want to see my current score and highest score, so that I can track my progress and try to beat my record.

#### Acceptance Criteria

1. THE Score_Bar SHALL display the current score and High_Score in the format "Score: {current} | High: {high}" at all times during all Game_States
2. WHILE Game_State is 'playing', THE Game_Engine SHALL increment the score by exactly one when a Pipe's trailing edge (pipe.x + pipe width) moves past Ghosty's left edge (ghosty.x), and SHALL mark that Pipe as scored to prevent double-counting
3. THE Game_Engine SHALL ensure the score only increases while Game_State is 'playing' and resets to zero when resetGame is invoked
4. WHEN Game_State transitions to 'gameover' and the current score is strictly greater than High_Score, THE Game_Engine SHALL update High_Score to the current score
5. WHEN High_Score is updated, THE Game_Engine SHALL persist the new High_Score to localStorage under the key "flappyKiroHigh"
6. WHEN the game loads, THE Game_Engine SHALL retrieve High_Score from localStorage under the key "flappyKiroHigh", defaulting to zero if the key is missing or the stored value is not a valid integer
7. IF Game_State transitions to 'gameover' and the current score is less than or equal to High_Score, THEN THE Game_Engine SHALL retain the existing High_Score unchanged

### Requirement 7: Rendering

**User Story:** As a player, I want smooth visual rendering of all game elements, so that the game feels polished and enjoyable.

#### Acceptance Criteria

1. THE Game_Engine SHALL render all game elements on a single HTML5 Canvas using the 2D rendering context
2. THE Game_Engine SHALL run the game loop via requestAnimationFrame targeting approximately 60 frames per second
3. WHEN rendering Ghosty, THE Game_Engine SHALL rotate the sprite based on velocity using the formula angle = velocity × 3, clamped between -30 and +45 degrees
4. WHEN rendering a Pipe, THE Game_Engine SHALL draw a top pipe body, top pipe cap with 8px overhang on each side, bottom pipe body, and bottom pipe cap with 8px overhang on each side
5. WHEN the Ghosty image fails to load, THE Game_Engine SHALL render a fallback ghost shape using canvas primitives (ellipse and quadratic curves)
6. WHILE Game_State is 'waiting', THE Game_Engine SHALL display an overlay with the game title and a prompt instructing the player to click or press space to start
7. WHILE Game_State is 'gameover', THE Game_Engine SHALL display a game over overlay showing the text "Game Over" and a prompt to click or press space to restart
8. THE Game_Engine SHALL render elements in the following layer order from back to front: sky background, clouds, pipes, Ghosty, overlay text

### Requirement 8: Background Clouds

**User Story:** As a player, I want decorative clouds scrolling in the background, so that the game has visual depth and atmosphere.

#### Acceptance Criteria

1. WHEN the game initializes, THE Game_Engine SHALL create CONFIG.cloudCount Cloud entities with random x-positions distributed across the full Canvas width (0 to CONFIG.canvasWidth) and random y-positions within the upper 60% of the Canvas (0 to CONFIG.canvasHeight × 0.6)
2. THE Game_Engine SHALL assign each Cloud a width between 60 and 100 pixels and a height equal to 40% of its assigned width
3. THE Game_Engine SHALL assign each Cloud a scroll speed between CONFIG.cloudMinSpeed and CONFIG.cloudMaxSpeed pixels per frame, moving from right to left
4. WHILE the game is in any state (waiting, playing, or gameover), THE Game_Engine SHALL update Cloud positions by subtracting each Cloud's speed from its x-position on every frame
5. WHEN a Cloud's right edge (x + width) is less than 0, THE Game_Engine SHALL reposition it so that its x-position equals CONFIG.canvasWidth and assign it a new random y-position within the upper 60% of the Canvas

### Requirement 9: Audio

**User Story:** As a player, I want sound effects for jumping and game over, so that the game provides audio feedback for key actions.

#### Acceptance Criteria

1. WHILE Game_State is 'playing', WHEN the jump action is invoked, THE Game_Engine SHALL reset the jump sound playback position to the beginning and play the jump sound effect, allowing rapid re-triggering on consecutive jumps without waiting for the previous playback to finish
2. WHEN Game_State transitions to 'gameover', THE Game_Engine SHALL reset the game over sound playback position to the beginning and play the game over sound effect
3. IF audio playback fails due to browser autoplay policy or file load error, THEN THE Game_Engine SHALL catch the error without displaying any message to the player and SHALL continue game execution with game state, scoring, and rendering unaffected

### Requirement 10: Settings Panel

**User Story:** As a player or developer, I want a settings panel with sliders to tune game parameters in real time, so that I can experiment with different difficulty levels without changing code.

#### Acceptance Criteria

1. THE Settings_Controller SHALL provide slider inputs for the following 8 CONFIG properties: gravity, jumpForce, pipeGap, pipeSpeed, pipeWidth, pipeSpawnInterval, ghostySize, and hitboxInset
2. WHEN a slider value changes via user input, THE Settings_Controller SHALL update the corresponding CONFIG property before the next animation frame
3. THE Settings_Controller SHALL display the current numeric value adjacent to each slider, updated on every slider input change
4. WHEN the reset button is clicked, THE Settings_Controller SHALL restore all 8 CONFIG properties to the values defined at initial page load and update all slider positions and displayed values to match
5. WHEN the ghostySize slider value changes, THE Settings_Controller SHALL update the live Ghosty entity width and height to the new ghostySize value before the next animation frame
6. WHEN the settings toggle button is clicked, THE Settings_Controller SHALL toggle the settings panel between visible and hidden states

### Requirement 11: Configuration

**User Story:** As a developer, I want all game constants centralized in a single configuration object, so that tuning and maintenance are straightforward.

#### Acceptance Criteria

1. THE CONFIG object SHALL provide the following default values: gravity = 0.4, jumpForce = -7, pipeWidth = 70, pipeGap = 160, pipeSpeed = 2.5, pipeSpawnInterval = 180, ghostySize = 36, hitboxInset = 4, cloudCount = 5, cloudMinSpeed = 0.3, cloudMaxSpeed = 0.8, canvasWidth = 800, and canvasHeight = 500
2. THE CONFIG object SHALL be a mutable global object whose properties can be reassigned via direct property assignment without requiring a page reload or game restart
3. WHEN a CONFIG property is updated, THE Game_Engine SHALL use the new value starting from the next animation frame by reading CONFIG properties directly on each frame iteration rather than caching them in local variables
4. WHEN the "Reset to Defaults" button is activated, THE Settings_Controller SHALL restore all CONFIG properties to their original default values and update all corresponding slider positions to reflect those defaults

### Requirement 12: Error Resilience

**User Story:** As a player, I want the game to continue working even if assets fail to load or storage is unavailable, so that I always have a playable experience.

#### Acceptance Criteria

1. IF the Ghosty image fails to load, THEN THE Game_Engine SHALL render a procedural fallback sprite using canvas drawing primitives (white ellipse body with dark circular eyes) and continue normal gameplay with identical physics and collision behavior
2. IF audio files fail to load or playback is blocked by browser autoplay policy, THEN THE Game_Engine SHALL wrap all audio play calls in try-catch blocks and continue gameplay without sound, with no error messages displayed to the player
3. IF localStorage is unavailable or throws an exception on read or write, THEN THE Game_Engine SHALL default High_Score to zero on load and skip persistence on game over, continuing all other gameplay functions normally
