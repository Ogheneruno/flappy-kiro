# Flappy Kiro

An arcade-style endless-runner browser game where you guide Ghosty, a friendly ghost, through challenging pipe obstacles. Built with vanilla HTML5 Canvas — no frameworks, no build tools.

## Example UI

![Flappy Kiro UI](img/example-ui.png)

## How to Play

1. Open `index.html` in any modern browser.
2. Click, tap, or press **Space** / **Arrow Up** to flap.
3. Navigate Ghosty through the gaps between pipes.
4. Each pipe passed = 1 point. High score is saved automatically.

## Project Structure

```
├── index.html          # Game page with canvas, styling, and settings panel
├── config.js           # All tunable game constants (edit for permanent changes)
├── game.js             # Core game logic (rendering, physics, state machine)
├── settings.js         # Live settings panel controller (slider ↔ CONFIG binding)
├── assets/
│   ├── ghosty.png      # Ghost character sprite
│   ├── jump.wav        # Jump sound effect
│   └── game_over.wav   # Game over sound effect
├── img/
│   └── example-ui.png  # Screenshot reference
├── tests/              # Property-based and integration tests (Vitest + fast-check)
├── vitest.config.js    # Vitest configuration
├── requirements.md     # Functional & non-functional requirements
├── design.md           # Technical design document
└── README.md           # This file
```

## Configuration

All game constants live in `config.js`. Edit this file to permanently change defaults:

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
    ...
};
```

### Live Settings Panel

Click the ⚙ gear icon next to the game to open a settings panel with sliders for real-time tuning. Changes apply instantly — no reload needed. Use "Reset to Defaults" to snap back to `config.js` values.

**Workflow:** experiment with sliders → find values you like → update `config.js` to make them permanent.

## Testing

```bash
npm test            # Run all tests (single pass)
npm run test:watch  # Run tests in watch mode
```

Tests use [Vitest](https://vitest.dev/) with [fast-check](https://github.com/dubzzz/fast-check) for property-based testing. They live in the `tests/` directory and validate physics, collision, scoring, state machine, and configuration invariants.

## Resources

- `assets/` — Game audio and sprites
- `img/` — Screenshots and reference images
- `requirements.md` — Full game requirements
- `design.md` — Architecture and technical design
