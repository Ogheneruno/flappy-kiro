const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBar = document.getElementById('scoreBar');

// Apply canvas dimensions from config
canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

// Game state
let ghosty = {
    x: 120,
    y: CONFIG.canvasHeight / 2,
    width: CONFIG.ghostySize,
    height: CONFIG.ghostySize,
    velocity: 0
};

let pipes = [];
let clouds = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('flappyKiroHigh')) || 0;
let gameState = 'waiting'; // waiting, playing, gameover
let frameCount = 0;
let ghostyImage = new Image();
let ghostyLoaded = false;

// Load ghosty image
ghostyImage.onload = () => { ghostyLoaded = true; };
ghostyImage.src = 'assets/ghosty.png';

// Load sounds
const jumpSound = new Audio('assets/jump.wav');
const gameOverSound = new Audio('assets/game_over.wav');

// Initialize clouds
function initClouds() {
    clouds = [];
    for (let i = 0; i < CONFIG.cloudCount; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.6),
            width: 60 + Math.random() * 40,
            speed: CONFIG.cloudMinSpeed + Math.random() * (CONFIG.cloudMaxSpeed - CONFIG.cloudMinSpeed)
        });
    }
}

// Draw cloud
function drawCloud(cloud) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const w = cloud.width;
    const h = w * 0.5;
    const x = cloud.x;
    const y = cloud.y;

    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - w * 0.2, y + h * 0.1, w * 0.25, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.2, y + h * 0.05, w * 0.28, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
}

// Draw ghosty
function drawGhosty() {
    ctx.save();
    ctx.translate(ghosty.x + ghosty.width / 2, ghosty.y + ghosty.height / 2);

    let angle = Math.min(Math.max(ghosty.velocity * 3, -30), 45) * (Math.PI / 180);
    ctx.rotate(angle);

    if (ghostyLoaded) {
        ctx.drawImage(ghostyImage, -ghosty.width / 2, -ghosty.height / 2, ghosty.width, ghosty.height);
    } else {
        // Fallback ghost shape
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(0, -4, 14, 14, 0, Math.PI, 0);
        ctx.lineTo(14, 10);
        ctx.quadraticCurveTo(10, 5, 7, 10);
        ctx.quadraticCurveTo(3.5, 15, 0, 10);
        ctx.quadraticCurveTo(-3.5, 15, -7, 10);
        ctx.quadraticCurveTo(-10, 5, -14, 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-5, -4, 3, 0, Math.PI * 2);
        ctx.arc(5, -4, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// Draw pipe
function drawPipe(pipe) {
    const capHeight = 20;
    const capOverhang = 8;

    // Top pipe body
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(pipe.x, 0, CONFIG.pipeWidth, pipe.topHeight - capHeight);

    // Top pipe cap
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(pipe.x - capOverhang, pipe.topHeight - capHeight, CONFIG.pipeWidth + capOverhang * 2, capHeight);

    // Bottom pipe body
    const bottomY = pipe.topHeight + CONFIG.pipeGap;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(pipe.x, bottomY + capHeight, CONFIG.pipeWidth, canvas.height - bottomY - capHeight);

    // Bottom pipe cap
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(pipe.x - capOverhang, bottomY, CONFIG.pipeWidth + capOverhang * 2, capHeight);
}

// Spawn pipe
function spawnPipe() {
    const minTop = 60;
    const maxTop = canvas.height - CONFIG.pipeGap - 60;
    const topHeight = minTop + Math.random() * (maxTop - minTop);

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        scored: false
    });
}

// Check collision
function checkCollision() {
    const inset = CONFIG.hitboxInset;

    // Floor and ceiling
    if (ghosty.y + ghosty.height > canvas.height || ghosty.y < 0) {
        return true;
    }

    // Pipes
    for (let pipe of pipes) {
        const ghostLeft = ghosty.x + inset;
        const ghostRight = ghosty.x + ghosty.width - inset;
        const ghostTop = ghosty.y + inset;
        const ghostBottom = ghosty.y + ghosty.height - inset;

        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + CONFIG.pipeWidth;

        if (ghostRight > pipeLeft && ghostLeft < pipeRight) {
            if (ghostTop < pipe.topHeight) return true;
            if (ghostBottom > pipe.topHeight + CONFIG.pipeGap) return true;
        }
    }

    return false;
}

// Jump
function jump() {
    if (gameState === 'waiting') {
        gameState = 'playing';
    }

    if (gameState === 'playing') {
        ghosty.velocity = CONFIG.jumpForce;
        try { jumpSound.currentTime = 0; jumpSound.play(); } catch (e) {}
    }

    if (gameState === 'gameover') {
        resetGame();
    }
}

// Reset game
function resetGame() {
    ghosty.y = canvas.height / 2;
    ghosty.velocity = 0;
    ghosty.width = CONFIG.ghostySize;
    ghosty.height = CONFIG.ghostySize;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameState = 'waiting';
    updateScoreBar();
}

// Update score bar
function updateScoreBar() {
    scoreBar.textContent = `Score: ${score} | High: ${highScore}`;
}

// Game over
function gameOver() {
    gameState = 'gameover';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyKiroHigh', highScore);
    }
    updateScoreBar();
    try { gameOverSound.currentTime = 0; gameOverSound.play(); } catch (e) {}
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw clouds
    for (let cloud of clouds) {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + cloud.width;
            cloud.y = Math.random() * (canvas.height * 0.6);
        }
        drawCloud(cloud);
    }

    if (gameState === 'playing') {
        // Update ghosty
        ghosty.velocity += CONFIG.gravity;
        ghosty.y += ghosty.velocity;

        // Spawn pipes
        frameCount++;
        if (frameCount % CONFIG.pipeSpawnInterval === 0) {
            spawnPipe();
        }

        // Update pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= CONFIG.pipeSpeed;

            // Score
            if (!pipes[i].scored && pipes[i].x + CONFIG.pipeWidth < ghosty.x) {
                pipes[i].scored = true;
                score++;
                updateScoreBar();
            }

            // Remove off-screen pipes
            if (pipes[i].x + CONFIG.pipeWidth < -10) {
                pipes.splice(i, 1);
            }
        }

        // Check collision
        if (checkCollision()) {
            gameOver();
        }
    }

    // Draw pipes
    for (let pipe of pipes) {
        drawPipe(pipe);
    }

    // Draw ghosty
    drawGhosty();

    // Draw overlays
    if (gameState === 'waiting') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Flappy Kiro', canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = '20px Arial';
        ctx.fillText('Click or press Space to start', canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = '16px Arial';
        ctx.fillText('Guide Ghosty through the pipes!', canvas.width / 2, canvas.height / 2 + 45);
    }

    if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '22px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = '18px Arial';
        ctx.fillText('Click or press Space to restart', canvas.width / 2, canvas.height / 2 + 50);
    }

    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

// Initialize
initClouds();
updateScoreBar();
gameLoop();
