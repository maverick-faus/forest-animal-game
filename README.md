# 🌲 Forest Animal Game 🌲

A cute, multiplayer web-based game where 8-10 players compete as adorable forest animals to collect the most items!

## 🎮 Game Features

- **10 Unique Animals**: Bear, Beaver, Otter, Bunny, Fox, Raccoon, Squirrel, Deer, Hedgehog, Owl
- **Multiplayer**: 3-10 players per game room
- **Collectibles**: Berries (1pt), Acorns (2pts), Mushrooms (3pts), Golden Flowers (5pts)
- **Special Ability**: Speed boost (50% faster for 5 seconds) - once per game!
- **Game Duration**: 2 minutes 30 seconds of fast-paced action
- **Real-time Gameplay**: Smooth multiplayer with WebSocket synchronization

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open your browser**:
   - Navigate to `http://localhost:3000`
   - Share the room code with friends to play together!

### For Development

```bash
npm run dev
```

## 🌐 Deployment

### Deploy to Cloud Platforms

#### Heroku
```bash
heroku create your-forest-game
git push heroku main
```

#### Render / Railway / Fly.io
- Import the repository
- Set build command: `npm install`
- Set start command: `npm start`
- Deploy!

#### Custom Server
```bash
# Set production environment
export PORT=80  # or your preferred port

# Run with PM2 for production
npm install -g pm2
pm2 start server.js --name forest-game
pm2 save
```

## 🎯 How to Play

### Phase 1: Lobby
1. Enter your name and optionally a room code
2. Share the room code with friends
3. Wait for at least 3 players to join
4. Any player can click "Start Game"

### Phase 2: Game (2:30)
- **Movement**: Arrow keys or WASD
- **Speed Boost**: Press SPACEBAR (once per game!)
- **Objective**: Collect items to earn points
  - 🍓 Berries: 1 point
  - 🌰 Acorns: 2 points
  - 🍄 Mushrooms: 3 points
  - 🌼 Golden Flowers: 5 points
- Items disappear after 8 seconds
- New items spawn every 1.5 seconds

### Phase 3: Results
- See final rankings
- Winner gets crowned!
- Click "Play Again" to return to lobby

## 🛠️ Technical Details

### Architecture
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + HTML5 Canvas
- **Real-time Communication**: WebSocket (Socket.IO)

### Project Structure
```
ClaudeGame/
├── server.js           # Main server file with game logic
├── package.json        # Dependencies
├── public/
│   ├── index.html     # Game UI
│   ├── game.js        # Client-side game logic
│   └── styles.css     # Styling
└── README.md          # This file
```

### Key Features
- Room-based multiplayer system
- Server-authoritative game state
- Client-side prediction for smooth movement
- Collision detection
- Real-time score tracking
- Speed boost ability system

## 🎨 Customization

### Change Game Duration
In `server.js`, modify:
```javascript
const GAME_DURATION = 150000; // milliseconds (default: 2.5 minutes)
```

### Adjust Collectible Spawn Rate
In `server.js`, modify:
```javascript
const SPAWN_INTERVAL = 1500; // milliseconds (default: 1.5 seconds)
```

### Change Collectible Point Values
In `server.js`, modify the `COLLECTIBLES` array:
```javascript
const COLLECTIBLES = [
  { type: 'berry', points: 1, color: '#FF4444', spawnChance: 0.4 },
  // ... modify points here
];
```

## 🐛 Troubleshooting

### Port Already in Use
Change the port in `server.js` or set the PORT environment variable:
```bash
PORT=3001 npm start
```

### Players Can't Connect
- Ensure your firewall allows connections on the port
- For online play, deploy to a cloud platform
- Share the full URL with room code

### Game Laggy
- Reduce `SPAWN_INTERVAL` in server.js
- Check network connection
- Ensure server has adequate resources

## 📝 License

MIT License - Feel free to modify and use for your own projects!

## 🤝 Contributing

Feel free to fork, modify, and submit pull requests!

---

Made with ❤️ for forest animal lovers everywhere! 🐻🦊🐰
