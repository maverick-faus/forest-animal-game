# 🚀 Deployment Guide - Forest Animal Game

## Quick Deploy to Render (FREE - Recommended)

### Prerequisites
- GitHub account
- Git installed on your computer

### Step 1: Push to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   cd ClaudeGame
   git init
   git add .
   git commit -m "Initial commit - Forest Animal Game"
   ```

2. **Create a new GitHub repository**:
   - Go to https://github.com/new
   - Name it: `forest-animal-game`
   - Don't initialize with README (already have files)
   - Click "Create repository"

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/forest-animal-game.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Render

1. **Sign up for Render**:
   - Go to https://render.com
   - Sign up with GitHub (easiest)

2. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `forest-animal-game`
   - Click "Connect"

3. **Configure the service**:
   - **Name**: `forest-animal-game` (or any name you like)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: leave empty
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select **Free**

4. **Click "Create Web Service"**

5. **Wait for deployment** (2-3 minutes):
   - Render will install dependencies and start your server
   - Once deployed, you'll get a URL like: `https://forest-animal-game-xxxx.onrender.com`

6. **Open your game**:
   - Click the URL at the top
   - Share it with friends!

### Important Notes

- **Free tier sleeps after 15 min of inactivity** - First load takes ~30 seconds
- **750 hours/month free** - Enough for continuous use
- **WebSockets work perfectly** - No additional config needed
- **HTTPS automatic** - Secure by default

---

## Alternative: Deploy to Railway

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy to Railway

1. **Sign up**: https://railway.app
   - Sign up with GitHub

2. **New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `forest-animal-game`

3. **Configure**:
   - Railway auto-detects Node.js
   - No configuration needed!
   - Click "Deploy"

4. **Get URL**:
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Your game is live!

### Railway Pricing
- **$5 free credit/month**
- After credit: Pay-as-you-go (~$5-10/month)

---

## Alternative: Deploy to Fly.io

### Prerequisites
- Install flyctl: https://fly.io/docs/hands-on/install-flyctl/

### Steps

1. **Login**:
   ```bash
   flyctl auth login
   ```

2. **Launch app**:
   ```bash
   cd ClaudeGame
   flyctl launch
   ```
   - Choose app name
   - Choose region
   - Don't add PostgreSQL or Redis
   - Deploy now: Yes

3. **Your game is live**!
   - URL: `https://your-app-name.fly.dev`

### Fly.io Free Tier
- **3 shared VMs free**
- Perfect for this game

---

## Testing Your Deployment

1. Open the deployed URL
2. Enter your name
3. Share the room code with friends
4. Friends can join from anywhere!

---

## Troubleshooting

### Game doesn't load
- Check Render logs: Click "Logs" in dashboard
- Make sure deployment finished successfully

### WebSockets not working
- Render/Railway: Should work automatically
- Check if HTTPS is enabled (required for WebSockets)

### Port already in use (local)
- Kill existing Node processes:
  ```bash
  # Windows
  taskkill /F /IM node.exe

  # Mac/Linux
  killall node
  ```

---

## Update Your Deployed Game

After making changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Render/Railway will **automatically redeploy**! 🎉

---

## Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Fly.io Docs: https://fly.io/docs

---

Made with ❤️ - Happy Gaming! 🌲🎮
