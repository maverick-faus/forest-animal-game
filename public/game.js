// Activity client code
const socket = io();

// Session state
let gameState = {
    currentScreen: 'join',
    roomId: null,
    currentPlayer: null,
    players: [],
    collectibles: [],
    gameStartTime: null,
    gameDuration: 150000
};

// Input state
const keys = {};
let lastMoveTime = 0;
const MOVE_SPEED = 4; // Base speed per frame
const SPEED_BOOST_MULTIPLIER = 1.5;

// For smooth frame-independent movement
let lastFrameTime = Date.now();

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
canvas.width = 1280;
canvas.height = 720;

// Animal emoji mapping
const ANIMAL_EMOJIS = {
    'Bear': '🐻',
    'Beaver': '🦫',
    'Otter': '🦦',
    'Bunny': '🐰',
    'Fox': '🦊',
    'Raccoon': '🦝',
    'Squirrel': '🐿️',
    'Deer': '🦌',
    'Hedgehog': '🦔',
    'Owl': '🦉'
};

// Animal colors for player indicators
const ANIMAL_COLORS = {
    'Bear': '#8B4513',
    'Beaver': '#CD853F',
    'Otter': '#4682B4',
    'Bunny': '#FFB6C1',
    'Fox': '#FF4500',
    'Raccoon': '#696969',
    'Squirrel': '#D2691E',
    'Deer': '#DEB887',
    'Hedgehog': '#A0522D',
    'Owl': '#8B7355'
};

// Collectible emoji mapping
const COLLECTIBLE_EMOJIS = {
    'berry': '🍓',
    'acorn': '🌰',
    'mushroom': '🍄',
    'flower': '🌼'
};

// Screen management
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}Screen`).classList.add('active');
    gameState.currentScreen = screenName;
}

// Join game
document.getElementById('joinButton')?.addEventListener('click', () => {
    const playerName = document.getElementById('playerNameInput').value.trim();
    const roomIdInput = document.getElementById('roomIdInput').value.trim();

    if (!playerName) {
        showError('Please enter your name');
        return;
    }

    const roomId = roomIdInput || generateRoomId();
    gameState.roomId = roomId;

    socket.emit('joinRoom', { roomId, playerName });
});

// Enter key to join
document.getElementById('playerNameInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('joinButton').click();
    }
});

document.getElementById('roomIdInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('joinButton').click();
    }
});

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function showError(message) {
    const errorDiv = document.getElementById('joinError');
    if (errorDiv) {
        errorDiv.textContent = message;
        setTimeout(() => {
            errorDiv.textContent = '';
        }, 3000);
    }
}

// Socket event handlers
socket.on('joinSuccess', ({ player, gameState: initialState }) => {
    gameState.currentPlayer = player;
    gameState.players = initialState.players;
    gameState.gameState = initialState.gameState;

    showScreen('lobby');
    updateLobby();
});

socket.on('joinError', (message) => {
    showError(message);
});

socket.on('gameStateUpdate', (state) => {
    gameState.players = state.players;
    gameState.collectibles = state.collectibles;
    gameState.gameStartTime = state.gameStartTime;
    gameState.gameDuration = state.gameDuration;

    // Update current player reference
    const currentPlayer = state.players.find(p => p.id === socket.id);
    if (currentPlayer) {
        gameState.currentPlayer = currentPlayer;
    }

    if (gameState.currentScreen === 'lobby') {
        updateLobby();
    } else if (gameState.currentScreen === 'game') {
        updateScoreboard();
        updateAbilityIndicator();
    }
});

socket.on('gameStarted', (state) => {
    gameState.players = state.players;
    gameState.collectibles = state.collectibles;
    gameState.gameStartTime = state.gameStartTime;
    gameState.gameDuration = state.gameDuration;

    // Update current player reference
    const currentPlayer = state.players.find(p => p.id === socket.id);
    if (currentPlayer) {
        gameState.currentPlayer = currentPlayer;
    }

    // Reset frame timing
    lastFrameTime = Date.now();

    showScreen('game');
    startGameLoop();
});

socket.on('collectibleCollected', ({ playerId, collectibleId, points }) => {
    // Play collection sound (visual feedback)
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        // Could add particle effects here
    }
});

socket.on('speedBoostActivated', ({ playerId, endTime, cooldownEnd }) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.speedBoostActive = true;
        player.speedBoostEndTime = endTime;
        player.speedBoostAvailable = false;
        player.speedBoostCooldownEnd = cooldownEnd;
        player.speedBoostLastUsed = Date.now();
    }
    updateAbilityIndicator();
});

socket.on('speedBoostEnded', ({ playerId }) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.speedBoostActive = false;
    }
    updateAbilityIndicator();
});

socket.on('speedBoostReady', ({ playerId }) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.speedBoostAvailable = true;
        player.speedBoostCooldownEnd = null;
    }
    updateAbilityIndicator();
});

// Lobby functions
function updateLobby() {
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = gameState.roomId;
    }

    const playerCount = document.getElementById('playerCount');
    if (playerCount) {
        playerCount.textContent = gameState.players.length;
    }

    const playersList = document.getElementById('lobbyPlayersList');
    if (playersList) {
        playersList.innerHTML = '';
        gameState.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'lobby-player-item';
            playerItem.innerHTML = `
                <div class="player-animal">${ANIMAL_EMOJIS[player.animal]}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-animal-name">${player.animal}</div>
                </div>
            `;
            playersList.appendChild(playerItem);
        });
    }

    const startButton = document.getElementById('startGameButton');
    if (startButton) {
        startButton.disabled = gameState.players.length < 3;
    }
}

document.getElementById('startGameButton')?.addEventListener('click', () => {
    socket.emit('startGame');
});

document.getElementById('copyRoomCode')?.addEventListener('click', () => {
    const roomCode = gameState.roomId;
    navigator.clipboard.writeText(roomCode).then(() => {
        const button = document.getElementById('copyRoomCode');
        const originalText = button.textContent;
        button.textContent = '✓';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1000);
    });
});

// Game loop
let gameLoopRunning = false;
let animationFrameId = null;

function startGameLoop() {
    if (gameLoopRunning) return;
    gameLoopRunning = true;
    gameLoop();
}

function stopGameLoop() {
    gameLoopRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

function gameLoop() {
    if (!gameLoopRunning) return;

    // Check if game should end
    if (gameState.gameStartTime) {
        const elapsed = Date.now() - gameState.gameStartTime;
        if (elapsed >= gameState.gameDuration) {
            endGame();
            return;
        }
    }

    // Update player movement
    updatePlayerMovement();

    // Render game
    render();

    // Update timer
    updateTimer();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function updatePlayerMovement() {
    if (!gameState.currentPlayer) return;

    const now = Date.now();
    const deltaTime = (now - lastFrameTime) / 16.67; // Normalize to 60fps
    lastFrameTime = now;

    let dx = 0;
    let dy = 0;

    // Check keys
    if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

    // Apply movement if any key is pressed
    if (dx !== 0 || dy !== 0) {
        // Normalize diagonal movement
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        dx /= magnitude;
        dy /= magnitude;

        // Apply speed with delta time for frame-independent movement
        let speed = MOVE_SPEED * deltaTime;
        if (gameState.currentPlayer.speedBoostActive) {
            speed *= SPEED_BOOST_MULTIPLIER;
        }

        // Update position directly (no interpolation lag)
        gameState.currentPlayer.x += dx * speed;
        gameState.currentPlayer.y += dy * speed;

        // Boundary check
        const margin = 30;
        gameState.currentPlayer.x = Math.max(margin, Math.min(canvas.width - margin, gameState.currentPlayer.x));
        gameState.currentPlayer.y = Math.max(margin, Math.min(canvas.height - margin, gameState.currentPlayer.y));

        // Send position to server (throttle to reduce network traffic)
        if (now - lastMoveTime > 30) { // Increased update rate to 33ms (~30fps)
            socket.emit('playerMove', {
                x: gameState.currentPlayer.x,
                y: gameState.currentPlayer.y
            });
            lastMoveTime = now;
        }
    }
}

function render() {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw forest background elements
    drawForestBackground();

    // Draw collectibles
    gameState.collectibles.forEach(collectible => {
        drawCollectible(collectible);
    });

    // Draw players
    gameState.players.forEach(player => {
        drawPlayer(player);
    });
}

function drawForestBackground() {
    // Draw some decorative grass patches
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    for (let i = 0; i < 20; i++) {
        const x = (i * 150 + 50) % canvas.width;
        const y = (Math.floor(i / 8) * 180 + 100) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw some trees
    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    for (let i = 0; i < 10; i++) {
        const x = (i * 200 + 100) % canvas.width;
        const y = 50;
        ctx.fillRect(x - 5, y, 10, 30);

        ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    }
}

function drawCollectible(collectible) {
    const age = Date.now() - collectible.spawnTime;
    const lifetime = 8000;

    // Fade out only in the last second (and keep minimum opacity at 0.6)
    let alpha = 1;
    if (age > lifetime - 1000) {
        alpha = Math.max(0.6, (lifetime - age) / 1000);
    }

    // Draw shadow
    ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * alpha})`;
    ctx.beginPath();
    ctx.ellipse(collectible.x, collectible.y + 35, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw collectible emoji
    ctx.globalAlpha = alpha;
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Bobbing animation
    const bob = Math.sin(Date.now() / 300 + collectible.id) * 3;
    ctx.fillText(COLLECTIBLE_EMOJIS[collectible.type], collectible.x, collectible.y + bob);

    // Draw point value
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(`+${collectible.points}`, collectible.x, collectible.y - 25 + bob);
    ctx.fillText(`+${collectible.points}`, collectible.x, collectible.y - 25 + bob);

    ctx.globalAlpha = 1;
}

function drawPlayer(player) {
    const isCurrentPlayer = player.id === socket.id;

    // Reset canvas state to prevent bleeding between players
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 40, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Speed boost effect
    if (player.speedBoostActive) {
        // Draw speed lines
        ctx.setLineDash([]); // Ensure no dashes for speed lines
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const offset = i * 15;
            ctx.beginPath();
            ctx.moveTo(player.x - 40 - offset, player.y - 10);
            ctx.lineTo(player.x - 50 - offset, player.y - 10);
            ctx.stroke();
        }

        // Glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
    }

    // Draw player circle background
    ctx.fillStyle = ANIMAL_COLORS[player.animal];
    ctx.beginPath();
    ctx.arc(player.x, player.y, 35, 0, Math.PI * 2);
    ctx.fill();

    // Draw animal emoji
    ctx.shadowBlur = 0;
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ANIMAL_EMOJIS[player.animal], player.x, player.y);

    // Draw player name
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(player.name, player.x, player.y + 50);
    ctx.fillText(player.name, player.x, player.y + 50);

    // Highlight current player (only when not speed boosting)
    if (isCurrentPlayer && !player.speedBoostActive) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function updateTimer() {
    if (!gameState.gameStartTime) return;

    const elapsed = Date.now() - gameState.gameStartTime;
    const remaining = Math.max(0, gameState.gameDuration - elapsed);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Change color when time is running out
        if (remaining < 30000) {
            timerDisplay.style.color = '#d32f2f';
        } else {
            timerDisplay.style.color = '#4a7c59';
        }
    }
}

function updateScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    if (!scoreboard) return;

    // Sort players by score
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

    scoreboard.innerHTML = '';
    sortedPlayers.forEach((player, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        if (player.id === socket.id) {
            scoreItem.classList.add('current-player');
        }

        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        scoreItem.innerHTML = `
            <div class="score-animal">${ANIMAL_EMOJIS[player.animal]}</div>
            <div class="score-info">
                <div class="score-name">${rankEmoji} ${player.name}</div>
                <div class="score-points">${player.score} pts</div>
            </div>
        `;
        scoreboard.appendChild(scoreItem);
    });
}

function updateAbilityIndicator() {
    const indicator = document.getElementById('abilityIndicator');
    const icon = document.getElementById('abilityIcon');
    const text = document.getElementById('abilityText');
    const countdown = document.getElementById('abilityCountdown');
    const progressBar = document.getElementById('abilityProgressBar');

    if (!gameState.currentPlayer || !indicator) return;

    indicator.className = 'ability-indicator';
    const now = Date.now();

    if (gameState.currentPlayer.speedBoostActive) {
        // Active state - showing duration countdown
        indicator.classList.add('active');
        const remaining = Math.ceil((gameState.currentPlayer.speedBoostEndTime - now) / 1000);
        countdown.textContent = remaining > 0 ? remaining : '';
        progressBar.style.width = '100%';
    } else if (gameState.currentPlayer.speedBoostCooldownEnd && now < gameState.currentPlayer.speedBoostCooldownEnd) {
        // Cooldown state - showing progress bar
        indicator.classList.add('cooldown');
        const totalCooldown = 30000; // 30 seconds
        const elapsed = now - gameState.currentPlayer.speedBoostLastUsed;
        const progress = Math.min(100, (elapsed / totalCooldown) * 100);
        progressBar.style.width = `${progress}%`;

        const remainingSeconds = Math.ceil((gameState.currentPlayer.speedBoostCooldownEnd - now) / 1000);
        countdown.textContent = remainingSeconds > 0 ? remainingSeconds : '';
    } else if (gameState.currentPlayer.speedBoostAvailable) {
        // Available state
        indicator.classList.add('available');
        countdown.textContent = '';
        progressBar.style.width = '100%';
    } else {
        // Default state
        countdown.textContent = '';
        progressBar.style.width = '0%';
    }
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    if (gameState.currentScreen !== 'game') return;

    keys[e.key] = true;

    // Spacebar for speed boost
    if (e.key === ' ') {
        e.preventDefault();
        if (gameState.currentPlayer?.speedBoostAvailable) {
            socket.emit('activateSpeedBoost');
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// End game
function endGame() {
    stopGameLoop();
    showScreen('results');
    displayResults();
}

function displayResults() {
    // Sort players by score
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

    // Display winner
    const winner = sortedPlayers[0];
    const winnerAnnouncement = document.getElementById('winnerAnnouncement');
    if (winnerAnnouncement && winner) {
        winnerAnnouncement.innerHTML = `
            <div class="winner-animal">${ANIMAL_EMOJIS[winner.animal]}</div>
            <h2>🎉 Top Performer! 🎉</h2>
            <div class="winner-name">${winner.name}</div>
            <div class="winner-score">${winner.score} points</div>
        `;
    }

    // Display final scoreboard
    const finalScoreboard = document.getElementById('finalScoreboard');
    if (finalScoreboard) {
        finalScoreboard.innerHTML = '<h3 style="margin-bottom: 20px;">Final Scores</h3>';
        sortedPlayers.forEach((player, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = `final-score-item rank-${index + 1}`;

            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

            scoreItem.innerHTML = `
                <div class="final-rank">${index + 1}</div>
                <div class="final-animal">${ANIMAL_EMOJIS[player.animal]}</div>
                <div class="final-info">
                    <div class="final-name">${player.name} ${rankEmoji}</div>
                    <div class="final-animal-name">${player.animal}</div>
                </div>
                <div class="final-points">${player.score}</div>
            `;
            finalScoreboard.appendChild(scoreItem);
        });
    }
}

document.getElementById('playAgainButton')?.addEventListener('click', () => {
    socket.emit('playAgain');
    showScreen('lobby');
    updateLobby();
});

// Handle window visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.currentScreen === 'game') {
        // Pause or handle visibility change
    }
});

// Prevent context menu on canvas
canvas?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Initialize
console.log('🌲 Forest Animal Game loaded!');
