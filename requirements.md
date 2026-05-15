# Flappy Kiro — Requirements

## Overview

Flappy Kiro is an arcade-style endless-runner browser game where players control Ghosty, a friendly ghost character, navigating through challenging pipe obstacles. The game is inspired by Flappy Bird and runs entirely in the browser using HTML5 Canvas.

---

## Functional Requirements

### FR-1: Game Canvas & Layout
- The game renders on an HTML5 `<canvas>` element (800×500 pixels).
- A dark score bar sits below the canvas displaying the current score and high score.
- The entire game is wrapped in a styled container with a purple/dark border and rounded corners.

### FR-2: Player Character (Ghosty)
- The player controls Ghosty, a small ghost sprite loaded from `assets/ghosty.png`.
- Ghosty is affected by gravity, constantly falling downward.
- Ghosty rotates slightly based on vertical velocity to give visual feedback.
- A fallback ghost shape is drawn if the image fails to load.

### FR-3: Controls
- **Click** on the canvas to jump/flap.
- **Spacebar** or **Arrow Up** key to jump/flap.
- **Touch** support for mobile devices.
- Each input applies an upward force (jump) to Ghosty.

### FR-4: Pipes (Obstacles)
- Green pipes scroll from right to left at a constant speed.
- Each pipe pair consists of a top pipe and a bottom pipe with a gap between them.
- Pipes have a darker green cap at their open ends.
- New pipes spawn at regular intervals with randomized gap positions.
- Pipes are removed from memory once they scroll off-screen.

### FR-5: Collision Detection
- The game detects collisions between Ghosty and:
  - Top/bottom pipes
  - The top edge of the canvas (ceiling)
  - The bottom edge of the canvas (floor)
- A small hitbox inset (4px) provides forgiving collision detection.

### FR-6: Scoring
- The player earns 1 point each time Ghosty passes through a pipe pair.
- The current score is displayed in the score bar below the canvas.
- The high score persists across sessions using `localStorage`.

### FR-7: Game States
- **Waiting**: Initial state showing title, instructions, and idle Ghosty. Clouds animate in the background.
- **Playing**: Active gameplay with gravity, pipe spawning, scoring, and collision detection.
- **Game Over**: Overlay showing final score with a prompt to restart. Sound effect plays.

### FR-8: Audio
- A jump sound (`assets/jump.wav`) plays on each flap.
- A game over sound (`assets/game_over.wav`) plays when the player collides.
- Audio errors are caught gracefully (no crashes if audio fails).

### FR-9: Background & Atmosphere
- Light blue sky background (`#87CEEB`).
- Animated white clouds drift slowly from right to left.
- Clouds respawn on the right side once they exit the left edge.

### FR-10: Configuration System
- All game constants are defined in a dedicated `config.js` file for easy editing.
- A live settings panel (toggled via a ⚙ gear icon) allows runtime adjustment of:
  - Gravity, Jump Force
  - Pipe Gap, Pipe Speed, Pipe Width, Spawn Interval
  - Ghosty Size, Hitbox Inset
- Slider changes apply immediately without reloading or restarting the game.
- A "Reset to Defaults" button restores all values to the `config.js` defaults.
- Workflow: experiment with sliders → find desired values → update `config.js` to persist.

---

## Non-Functional Requirements

### NFR-1: Performance
- The game runs at 60fps using `requestAnimationFrame`.
- No external libraries or frameworks — pure vanilla JavaScript and Canvas API.

### NFR-2: Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge).
- Touch events supported for mobile play.

### NFR-3: File Structure
```
├── index.html          # Game page with canvas, styling, and settings panel
├── config.js           # All tunable game constants (single source of truth)
├── game.js             # Game logic (rendering, physics, state)
├── settings.js         # Live settings panel controller (slider ↔ CONFIG binding)
├── assets/
│   ├── ghosty.png      # Ghost character sprite
│   ├── jump.wav        # Jump sound effect
│   └── game_over.wav   # Game over sound effect
├── tests/              # Property-based and integration tests
├── vitest.config.js    # Vitest test runner configuration
├── requirements.md     # This file
├── design.md           # Technical design document
└── README.md           # Project overview
```

### NFR-4: Accessibility
- Keyboard controls (Space, Arrow Up) as alternatives to mouse/touch.
- High contrast score text on dark background.
- Canvas element is focusable for keyboard interaction.

---

## Game Constants (defined in `config.js`)

All values below are defaults and can be adjusted at runtime via the settings panel.

| Constant            | Value | Description                        | Live Tunable |
|---------------------|-------|------------------------------------|:------------:|
| Gravity             | 0.4   | Downward acceleration per frame    | ✓            |
| Jump Force          | -7    | Upward velocity on flap            | ✓            |
| Pipe Width          | 70px  | Width of each pipe                 | ✓            |
| Pipe Gap            | 160px | Vertical gap between pipe pairs    | ✓            |
| Pipe Speed          | 2.5   | Horizontal scroll speed (px/frame) | ✓            |
| Pipe Spawn Interval | 180   | Frames between new pipe spawns     | ✓            |
| Ghosty Size         | 36px  | Character width and height         | ✓            |
| Hitbox Inset        | 4px   | Collision forgiveness per side     | ✓            |
| Cloud Count         | 5     | Number of background clouds        |              |
| Cloud Min Speed     | 0.3   | Slowest cloud drift (px/frame)     |              |
| Cloud Max Speed     | 0.8   | Fastest cloud drift (px/frame)     |              |
| Canvas Width        | 800   | Game canvas width in pixels        |              |
| Canvas Height       | 500   | Game canvas height in pixels       |              |

---

## Visual Style

- **Background**: Light blue sky with soft white clouds
- **Pipes**: Green (`#4CAF50`) with darker caps (`#388E3C`)
- **Frame**: Dark purple border (`#2d2b55` / `#3d3b65`)
- **Score Bar**: Dark navy (`#1a1a2e`) with white bold text
- **Character**: White ghost with small dark eyes (or loaded sprite)
