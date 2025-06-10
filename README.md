# 🍹 Drinks

A full-stack cocktail recipe management application built with React, TypeScript, Express.js, and SQLite.

## ✨ Features

- **Recipe Management**: Create, edit, and organize cocktail recipes with precision
- **Batch Calculator**: Scale recipes for events and large parties  
- **Clarification Tools**: Professional clarification calculations for crystal-clear cocktails
- **Search & Filter**: Find recipes by name, ingredient, or glass type
- **Persistent Storage**: SQLite database for reliable data persistence
- **REST API**: Full backend API for recipe operations
- **Mobile Sleep Prevention**: Toggle to keep mobile screens awake while viewing recipes

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start both frontend and backend in development mode
npm run dev

# Or start individually:
npm run dev:client  # Frontend only (Vite dev server)
npm run dev:server  # Backend only (Express server)
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔐 Authentication Setup

The Drinks app supports OAuth authentication with GitHub and Google for accessing protected features like recipe creation, editing, and AI-powered suggestions.

### Required OAuth Credentials

#### GitHub OAuth App
1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications/new)
2. Create a new OAuth App with these settings:
   - **Application name**: Your app name (e.g., "Drinks App")
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
3. Save your `Client ID` and `Client Secret`

#### Google OAuth App
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create a new "OAuth client ID"
5. Choose "Web application" and add these URLs:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`
6. Save your `Client ID` and `Client Secret`

### Environment Variables

Copy `.env.example` to `.env` and fill in your OAuth credentials:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Session secret (change this in production!)
SESSION_SECRET=your-super-secret-session-key-change-in-production

# GitHub OAuth App settings
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Google OAuth settings  
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# GitHub token for AI features (optional)
GITHUB_TOKEN=your_github_personal_access_token_here
```

### Production Setup

For production deployment:

1. **Update OAuth callback URLs** to your production domain:
   - GitHub: `https://yourdomain.com/auth/github/callback`
   - Google: `https://yourdomain.com/auth/google/callback`

2. **Secure session secret**: Generate a strong random string for `SESSION_SECRET`

3. **HTTPS required**: OAuth providers require HTTPS in production

### Features Requiring Authentication

- ✨ Recipe creation and editing
- 🤖 AI-powered recipe generation and suggestions  
- 💬 Chat with AI for cocktail ideas
- 🏷️ Automatic recipe tagging
- 🔄 Recipe generation from liked recipes (Tinder mode)

Public features (no authentication required):
- 📖 Browse and view recipes
- 🔍 Search recipes
- 📊 Batch calculator and clarification tools

## 🐳 Docker Container

This application is containerized and automatically published to GitHub Container Registry.

### Basic Usage
```bash
# Run with ephemeral storage
docker run -p 3000:3000 ghcr.io/jasonetco/drinks:latest
```

### With Persistent Database (Recommended)
```bash
# Mount the recipes.db file directly
docker run -p 3000:3000 \
  -v $(pwd)/recipes.db:/app/recipes.db \
  ghcr.io/jasonetco/drinks:latest
```

### Environment Variables
- `DATABASE_PATH`: Path to SQLite database file (default: `./recipes.db`)
- `PORT`: Server port (default: `3000`)
- `NODE_ENV`: Environment mode (`development` or `production`)

### Database Backup and Restore
```bash
# The database file is directly mounted, so it's automatically persistent
# To backup, simply copy the local recipes.db file
cp recipes.db backup-recipes.db

# To restore, copy your backup back
cp backup-recipes.db recipes.db
```

## 📱 Mobile Sleep Prevention

The application includes a mobile sleep prevention feature that uses the Screen Wake Lock API to keep your device's screen active while viewing recipes.

### Usage

- **Availability**: The toggle appears automatically on mobile devices that support the Wake Lock API
- **Location**: Found in the top-right corner of the homepage header on mobile
- **Default State**: Off (allows normal screen sleep behavior)
- **Toggle States**: 
  - "Sleep" (default) - Screen can go to sleep normally
  - "Awake" - Screen stays active and won't go to sleep

### Browser Compatibility

The feature works on modern mobile browsers that support the Screen Wake Lock API, including:
- Chrome for Android (84+)
- Edge Mobile (84+)
- Safari iOS (16.4+)

For unsupported browsers, the toggle will not appear and the app functions normally.

### Technical Details

- Uses the native `navigator.wakeLock` API
- Automatically releases wake lock when switching tabs or minimizing the app
- Re-acquires wake lock when returning to the app (if previously enabled)
- Graceful degradation for unsupported browsers

## 📡 API Endpoints

The server provides a REST API at `/api`:

- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/recipes/search?q=query` - Search recipes
- `GET /api/health` - Health check

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, Node.js
- **Database**: SQLite3
- **Build**: Vite, TSX
- **Container**: Docker, Multi-stage build

🐳 Docker Container

This repository includes a Dockerfile and GitHub Actions workflow for containerization:

- **Docker Hub**: The app is automatically built and published as a Docker container
- **Registry**: Available on GitHub Container Registry (`ghcr.io`)
- **Usage**: `docker run -p 80:80 ghcr.io/jasonetco/drinks:latest`

The container serves the Drinks application using nginx and is automatically built on pushes to the `main` branch.
