# Flappy Kiro — Design Document

## 1. Architecture Overview

Flappy Kiro is a single-page browser game built with vanilla HTML5, CSS, and JavaScript. There are no build tools, bundlers, or external dependencies. The entire game runs client-side using the Canvas 2D rendering API and `requestAnimationFrame` for the game loop.

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │           index.html                  │  │
│  │  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │   Canvas    │  │  Score Bar    │  │  │
│  │  │  (800×500)  │  │  (HTML div)   │  │  │
│  │  └─────────────┘  └───────────────┘  │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  Settings Panel (⚙ toggle)     │  │  │
│  │  │  Sliders → CONFIG live binding  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│                     │                        │
│          ┌──────────┼──────────┐             │
│          ▼          ▼          ▼             │
│  ┌────────────┐ ┌────────┐ ┌──────────┐    │
│  │ config.js  │ │game.js │ │settings.js│    │
│  │ (defaults) │ │(logic) │ │ (UI bind) │    │
│  └────────────┘ └────────┘ └──────────┘    │
│                     │                        │
│                     ▼                        │
│  ┌───────────────────────────────────────┐  │
│  │             game.js                   │  │
│  │                                       │  │
│  │  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │  State   │  │   Game Loop      │  │  │
│  │  │ Machine  │  │ (requestAnimFrame)│  │  │
│  │  └──────────┘  └──────────────────┘  │  │
│  │                                       │  │
│  │  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │ Physics  │  │   Renderer       │  │  │
│  │  │ Engine   │  │  (Canvas 2D)     │  │  │
│  │  └──────────┘  └──────────────────┘  │  │
│  │                                       │  │
│  │  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │Collision │  │  Input Handler   │  │  │
│  │  │Detection │  │(keys/click/touch)│  │  │
│  │  └──────────┘  └──────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│                     │                        │
│                     ▼                        │
│  ┌───────────────────────────────────────┐  │
│  │             assets/                   │  │
│  │  ghosty.png │ jump.wav │ game_over.wav│  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 2. Game Loop Design

The game uses a single `requestAnimationFrame` loop that handles all updates and rendering in one pass:

```
gameLoop()
  ├── Clear canvas
  ├── Update & draw clouds (background layer)
  ├── If playing:
  │     ├── Apply gravity to Ghosty
  │     ├── Update Ghosty position
  │     ├── Spawn pipes (on interval)
  │     ├── Move pipes left
  │     ├── Check scoring
  │     ├── Remove off-screen pipes
  │     └── Check collisions → gameOver()
  ├── Draw pipes (middle layer)
  ├── Draw Ghosty (foreground layer)
  ├── Draw state overlays (waiting/gameover)
  └── requestAnimationFrame(gameLoop)
```

The loop runs continuously regardless of game state. Only the physics/spawning logic is gated behind the `playing` state check.

---

## 3. State Machine

The game has three discrete states:

```
         click/space           collision
[WAITING] ──────────► [PLAYING] ──────────► [GAMEOVER]
    ▲                                            │
    └────────────── click/space ─────────────────┘
```

| State      | Behavior                                                        |
|------------|-----------------------------------------------------------------|
| `waiting`  | Ghosty visible but static. Clouds animate. Title overlay shown. |
| `playing`  | Full physics, pipe spawning, scoring, collision detection.       |
| `gameover` | Everything frozen. Score overlay shown. Awaiting restart input.  |

---

## 4. Entity Design

### 4.1 Ghosty (Player)

```javascript
ghosty = {
    x: 120,          // Fixed horizontal position
    y: 250,          // Vertical position (updated by physics)
    width: 36,       // Hitbox & render width
    height: 36,      // Hitbox & render height
    velocity: 0,     // Current vertical velocity
    rotation: 0      // Visual rotation (derived from velocity)
}
```

**Physics model:**
- Each frame: `velocity += GRAVITY` then `y += velocity`
- On jump: `velocity = JUMP_FORCE` (negative = upward)
- Rotation is purely visual: clamped between -30° and +45° based on velocity

### 4.2 Pipes

```javascript
pipe = {
    x: Number,         // Horizontal position (decreases each frame)
    topHeight: Number,  // Height of the top pipe (randomized)
    scored: Boolean     // Whether the player has passed this pipe
}
```

**Pipe geometry (derived):**
- Top pipe: from `y=0` to `y=topHeight`
- Gap: from `y=topHeight` to `y=topHeight + PIPE_GAP`
- Bottom pipe: from `y=topHeight + PIPE_GAP` to `y=canvas.height`
- Cap overhang: 8px on each side beyond pipe width

### 4.3 Clouds (Background)

```javascript
cloud = {
    x: Number,      // Horizontal position
    y: Number,      // Vertical position (upper 60% of canvas)
    width: Number,  // Size (60–100px, randomized)
    speed: Number   // Drift speed (0.3–0.8 px/frame)
}
```

Clouds are purely decorative. They wrap around when exiting the left edge.

---

## 5. Collision Detection

Uses Axis-Aligned Bounding Box (AABB) with a 4px inset for forgiving gameplay:

```
Effective hitbox:
  left   = ghosty.x + 4
  right  = ghosty.x + width - 4
  top    = ghosty.y + 4
  bottom = ghosty.y + height - 4
```

**Collision checks (in order):**
1. Floor: `ghosty.y + height > canvas.height`
2. Ceiling: `ghosty.y < 0`
3. For each pipe: if horizontal overlap exists, check vertical overlap with top or bottom pipe

---

## 6. Rendering Layers

Drawing order (back to front):

1. **Sky** — solid fill `#87CEEB`
2. **Clouds** — semi-transparent white ellipses
3. **Pipes** — green rectangles with darker caps
4. **Ghosty** — sprite image (or fallback shape)
5. **Overlays** — semi-transparent dark backdrop + white text

---

## 7. Input Handling

| Input          | Event                | Action         |
|----------------|----------------------|----------------|
| Spacebar       | `keydown`            | `jump()`       |
| Arrow Up       | `keydown`            | `jump()`       |
| Mouse click    | `click` on canvas    | `jump()`       |
| Touch          | `touchstart` on canvas | `jump()`     |

All inputs route to the same `jump()` function, which checks the current game state to determine behavior (start game, flap, or restart).

---

## 8. Scoring & Persistence

- Score increments when a pipe's right edge passes Ghosty's left edge.
- Each pipe has a `scored` flag to prevent double-counting.
- High score is stored in `localStorage` under key `flappyKiroHigh`.
- The score bar DOM element is updated via `textContent` (no innerHTML for security).

---

## 9. Audio Design

| Sound       | File               | Trigger                  |
|-------------|--------------------|--------------------------|
| Jump        | `assets/jump.wav`  | Every flap input         |
| Game Over   | `assets/game_over.wav` | On collision detected |

Audio playback is wrapped in try/catch to handle browsers that block autoplay or missing files gracefully. `currentTime` is reset before each play to allow rapid re-triggering.

---

## 10. Visual Design Decisions

| Element       | Color/Style                          | Rationale                              |
|---------------|--------------------------------------|----------------------------------------|
| Sky           | `#87CEEB` (light blue)               | Matches classic Flappy Bird aesthetic  |
| Pipes         | `#4CAF50` body, `#388E3C` caps       | High contrast against sky              |
| Frame border  | `#3d3b65` (dark purple)              | Matches Kiro brand colors              |
| Page bg       | `#2d2b55` (deep purple)              | Kiro brand, frames the game nicely     |
| Score bar     | `#1a1a2e` (dark navy)                | Clear separation from game area        |
| Clouds        | White, 80% opacity                   | Subtle depth without distraction       |

---

## 11. Performance Considerations

- **No DOM manipulation during gameplay** — all rendering is canvas-based.
- **Object pooling not needed** — pipe array stays small (max ~5 on screen).
- **Single RAF loop** — no competing timers or intervals.
- **Image loaded once** — ghosty sprite cached in memory.
- **Minimal garbage collection** — pipes spliced only when off-screen.

---

## 12. Configuration & Settings System

### 12.1 Config File (`config.js`)

All tunable game constants live in a single `CONFIG` object loaded before `game.js`. This is the single source of truth for default values.

```javascript
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
    canvasHeight: 500
};
```

`game.js` reads from `CONFIG` every frame, so changes to the object take effect immediately without restart.

### 12.2 Settings Panel (`settings.js`)

A slide-out panel toggled by a ⚙ button provides range sliders for 8 key parameters. The panel:

- Binds each slider's `input` event to update `CONFIG[key]` in real time.
- Displays the current numeric value next to each label.
- Stores a snapshot of defaults on load for the "Reset to Defaults" button.
- Jump Force is displayed as a positive number but stored as negative internally.

**Data flow:**

```
Slider input → CONFIG[key] updated → next gameLoop() frame reads new value
```

No restart or state reset is needed — the game loop naturally picks up the new constants.

### 12.3 Script Load Order

```html
<script src="config.js"></script>    <!-- 1. Define CONFIG defaults -->
<script src="game.js"></script>      <!-- 2. Game reads CONFIG, starts loop -->
<script src="settings.js"></script>  <!-- 3. Panel binds sliders to CONFIG -->
```

---

## 13. Future Enhancements (Out of Scope)

- Difficulty scaling (increasing pipe speed over time)
- Animated ghosty sprite sheet
- Particle effects on collision
- Leaderboard with server-side storage
- Power-ups (slow motion, invincibility)
- Day/night cycle background transitions
