# Project Structure

```
/
├── index.html          # Entry point — loads canvas, UI, and scripts
├── config.js           # Global CONFIG object (physics, pipe, canvas constants)
├── game.js             # Core game loop, rendering, collision, state management
├── settings.js         # Settings panel controller — binds sliders to CONFIG
├── assets/
│   ├── ghosty.png      # Player sprite
│   ├── jump.wav        # Jump sound effect
│   └── game_over.wav   # Game-over sound effect
├── tests/
│   ├── *.property.test.js  # Property-based tests (fast-check)
│   └── integration.test.js # Integration tests
├── .kiro/
│   ├── specs/          # Feature specs (requirements, design, tasks)
│   ├── steering/       # Steering rules (this directory)
│   └── hooks/          # Agent hooks
├── package.json        # Project metadata and scripts
└── vitest.config.js    # Vitest configuration
```

## Architecture Notes
- **No module bundler** — scripts are loaded via `<script>` tags in order: `config.js` → `game.js` → `settings.js`
- `CONFIG` is a global object shared across all scripts; `settings.js` mutates it at runtime
- Game state (`ghosty`, `pipes`, `clouds`, `score`, `gameState`) is module-level in `game.js`
- Tests import logic by re-implementing game functions in isolation (they don't import from `game.js` directly since it relies on DOM/Canvas APIs)
