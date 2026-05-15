# Product: Flappy Kiro

Flappy Kiro is a browser-based Flappy Bird clone featuring "Ghosty" — a ghost character that the player guides through gaps between pipes. The game runs entirely client-side on an HTML5 Canvas.

## Core Gameplay
- Player taps/clicks/presses Space to make Ghosty jump
- Pipes scroll from right to left; the player must navigate through gaps
- Score increments each time Ghosty passes a pipe
- High score persists via localStorage
- Game states: waiting → playing → gameover

## Settings Panel
An in-game settings panel lets players adjust physics and pipe parameters in real time via sliders (gravity, jump force, pipe gap, pipe speed, etc.) with a reset-to-defaults button.

## Assets
- `assets/ghosty.png` — player sprite (with a canvas-drawn fallback)
- `assets/jump.wav` and `assets/game_over.wav` — sound effects
