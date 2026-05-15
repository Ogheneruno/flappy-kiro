# Tech Stack

## Runtime
- Vanilla JavaScript (ES modules, `"type": "module"` in package.json)
- HTML5 Canvas for rendering
- No frontend framework — plain DOM for the settings UI

## Testing
- **Vitest** (v1.6+) — test runner with `globals: true`
- **fast-check** (v3.15+) — property-based testing library
- Tests live in `tests/` and follow the naming pattern `*.property.test.js` or `*.test.js`

## Build & Dev
There is no build step or bundler. The game loads scripts directly via `<script>` tags in `index.html`. To run locally, serve the project root with any static file server.

## Common Commands

| Task | Command |
|------|---------|
| Run tests (single pass) | `npm test` |
| Run tests (watch mode) | `npm run test:watch` |

## Key Conventions
- Configuration lives in `config.js` as a global `CONFIG` object
- Game logic is in `game.js`; settings UI wiring is in `settings.js`
- No TypeScript, no transpilation — code runs as-is in modern browsers
- Audio playback uses `.play()` with `.catch(() => {})` to suppress autoplay errors
