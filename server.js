const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Session rooms storage
const rooms = new Map();

// Animal types available
const ANIMALS = ['Bear', 'Beaver', 'Otter', 'Bunny', 'Fox', 'Raccoon', 'Squirrel', 'Deer', 'Hedgehog', 'Owl'];

// Collectible types with point values
const COLLECTIBLES = [
  { type: 'berry', points: 1, color: '#FF4444', spawnChance: 0.4 },
  { type: 'acorn', points: 2, color: '#8B4513', spawnChance: 0.35 },
  { type: 'mushroom', points: 3, color: '#FF69B4', spawnChance: 0.2 },
  { type: 'flower', points: 5, color: '#FFD700', spawnChance: 0.05 }
];

const SESSION_DURATION = 150000; // 2.5 minutes in milliseconds (production)
// const SESSION_DURATION = 15000; // 15 seconds (testing)
const COLLECTIBLE_LIFETIME = 8000; // 8 seconds
const SPAWN_INTERVAL = 1500; // Spawn every 1.5 seconds
const SPEED_BOOST_COOLDOWN = 30000; // 30 seconds cooldown
const SPEED_BOOST_DURATION = 5000; // 5 seconds duration

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = new Map();
    this.availableAnimals = [...ANIMALS];
    this.gameState = 'lobby'; // lobby, playing, results
    this.collectibles = [];
    this.gameStartTime = null;
    this.spawnInterval = null;
    this.gameEndTimeout = null;
    this.collectibleIdCounter = 0;
  }

  addPlayer(socketId, playerName) {
    if (this.availableAnimals.length === 0) {
      return null; // Room full
    }

    const animalIndex = Math.floor(Math.random() * this.availableAnimals.length);
    const animal = this.availableAnimals.splice(animalIndex, 1)[0];

    const player = {
      id: socketId,
      name: playerName,
      animal: animal,
      score: 0,
      x: Math.random() * 1100 + 100, // Random position (leaving margin)
      y: Math.random() * 500 + 100,
      speedBoostAvailable: true,
      speedBoostActive: false,
      speedBoostEndTime: null,
      speedBoostLastUsed: null,
      speedBoostCooldownEnd: null
    };

    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      this.availableAnimals.push(player.animal);
      this.players.delete(socketId);
    }

    // If game is running and players drop below 2, end game
    if (this.gameState === 'playing' && this.players.size < 2) {
      this.endGame();
    }
  }

  startGame() {
    if (this.players.size < 2) {
      return false;
    }

    this.gameState = 'playing';
    this.gameStartTime = Date.now();
    this.collectibles = [];

    // Reset all players
    this.players.forEach(player => {
      player.score = 0;
      player.x = Math.random() * 1100 + 100;
      player.y = Math.random() * 500 + 100;
      player.speedBoostAvailable = true;
      player.speedBoostActive = false;
      player.speedBoostEndTime = null;
      player.speedBoostLastUsed = null;
      player.speedBoostCooldownEnd = null;
    });

    // Start spawning collectibles
    this.spawnInterval = setInterval(() => {
      this.spawnCollectible();
    }, SPAWN_INTERVAL);

    // End game after duration
    this.gameEndTimeout = setTimeout(() => {
      this.endGame();
    }, SESSION_DURATION);

    return true;
  }

  spawnCollectible() {
    if (this.gameState !== 'playing') return;

    // Select collectible type based on spawn chances
    const random = Math.random();
    let cumulativeChance = 0;
    let selectedType = COLLECTIBLES[0];

    for (const collectible of COLLECTIBLES) {
      cumulativeChance += collectible.spawnChance;
      if (random <= cumulativeChance) {
        selectedType = collectible;
        break;
      }
    }

    const collectible = {
      id: this.collectibleIdCounter++,
      type: selectedType.type,
      points: selectedType.points,
      color: selectedType.color,
      x: Math.random() * 1200 + 50,
      y: Math.random() * 650 + 50,
      spawnTime: Date.now()
    };

    this.collectibles.push(collectible);

    // Remove after lifetime
    setTimeout(() => {
      this.collectibles = this.collectibles.filter(c => c.id !== collectible.id);
    }, COLLECTIBLE_LIFETIME);
  }

  endGame() {
    this.gameState = 'results';

    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }

    if (this.gameEndTimeout) {
      clearTimeout(this.gameEndTimeout);
      this.gameEndTimeout = null;
    }

    this.collectibles = [];
  }

  returnToLobby() {
    this.gameState = 'lobby';
    this.collectibles = [];
    this.gameStartTime = null;

    // Reset player positions and abilities
    this.players.forEach(player => {
      player.x = Math.random() * 1100 + 100;
      player.y = Math.random() * 500 + 100;
      player.speedBoostAvailable = true;
      player.speedBoostActive = false;
      player.speedBoostEndTime = null;
      player.speedBoostLastUsed = null;
      player.speedBoostCooldownEnd = null;
    });
  }

  getState() {
    return {
      roomId: this.roomId,
      gameState: this.gameState,
      players: Array.from(this.players.values()),
      collectibles: this.collectibles,
      gameStartTime: this.gameStartTime,
      gameDuration: SESSION_DURATION
    };
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ roomId, playerName }) => {
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new GameRoom(roomId));
    }

    const room = rooms.get(roomId);

    // Can't join if game is in progress
    if (room.gameState === 'playing') {
      socket.emit('joinError', 'Game already in progress');
      return;
    }

    const player = room.addPlayer(socket.id, playerName);

    if (!player) {
      socket.emit('joinError', 'Room is full');
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;

    // Send initial state to joining player
    socket.emit('joinSuccess', { player, gameState: room.getState() });

    // Notify all players in room
    io.to(roomId).emit('gameStateUpdate', room.getState());

    console.log(`Player ${playerName} (${player.animal}) joined room ${roomId}`);
  });

  socket.on('startGame', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    if (room.startGame()) {
      io.to(roomId).emit('gameStarted', room.getState());
      console.log(`Game started in room ${roomId}`);
    } else {
      socket.emit('error', 'Need at least 2 participants to start');
    }
  });

  socket.on('playerMove', ({ x, y }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.x = x;
    player.y = y;

    // Check collisions with collectibles
    room.collectibles = room.collectibles.filter(collectible => {
      const dx = player.x - collectible.x;
      const dy = player.y - collectible.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 40) { // Collision radius
        player.score += collectible.points;
        io.to(roomId).emit('collectibleCollected', {
          playerId: socket.id,
          collectibleId: collectible.id,
          points: collectible.points
        });
        return false; // Remove collectible
      }
      return true;
    });
  });

  socket.on('activateSpeedBoost', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player || !player.speedBoostAvailable) return;

    const now = Date.now();

    // Start cooldown
    player.speedBoostAvailable = false;
    player.speedBoostActive = true;
    player.speedBoostEndTime = now + SPEED_BOOST_DURATION;
    player.speedBoostLastUsed = now;
    player.speedBoostCooldownEnd = now + SPEED_BOOST_COOLDOWN;

    io.to(roomId).emit('speedBoostActivated', {
      playerId: socket.id,
      endTime: player.speedBoostEndTime,
      cooldownEnd: player.speedBoostCooldownEnd
    });

    // Deactivate boost after duration
    setTimeout(() => {
      player.speedBoostActive = false;
      io.to(roomId).emit('speedBoostEnded', { playerId: socket.id });
    }, SPEED_BOOST_DURATION);

    // Make available again after cooldown
    setTimeout(() => {
      if (room.gameState === 'playing') {
        player.speedBoostAvailable = true;
        io.to(roomId).emit('speedBoostReady', { playerId: socket.id });
      }
    }, SPEED_BOOST_COOLDOWN);
  });

  socket.on('playAgain', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.returnToLobby();
    io.to(roomId).emit('gameStateUpdate', room.getState());
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        io.to(roomId).emit('gameStateUpdate', room.getState());

        // Clean up empty rooms
        if (room.players.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    }
    console.log('User disconnected:', socket.id);
  });

  // Periodic game state updates
  setInterval(() => {
    const roomId = socket.data.roomId;
    if (roomId) {
      const room = rooms.get(roomId);
      if (room && room.gameState === 'playing') {
        io.to(roomId).emit('gameStateUpdate', room.getState());
      }
    }
  }, 50); // 20 FPS server updates
});

http.listen(PORT, () => {
  console.log(`🌲 Forest Animal Activity server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to participate!`);
});
