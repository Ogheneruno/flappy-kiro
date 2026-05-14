// Flappy Kiro — Game Configuration
// Edit these values to tune gameplay. The in-game settings panel can override them at runtime.

const CONFIG = {
    // Physics
    gravity: 0.4,
    jumpForce: -7,

    // Pipes
    pipeWidth: 70,
    pipeGap: 160,
    pipeSpeed: 2.5,
    pipeSpawnInterval: 180, // frames between spawns

    // Ghosty
    ghostySize: 36,
    hitboxInset: 4, // px of forgiveness on each side

    // Background
    cloudCount: 5,
    cloudMinSpeed: 0.3,
    cloudMaxSpeed: 0.8,

    // Canvas
    canvasWidth: 800,
    canvasHeight: 500
};
