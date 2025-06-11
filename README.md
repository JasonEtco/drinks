# 🍹 Drinks

A full-stack cocktail recipe management application built with React, TypeScript, Express.js, and database persistence.

## ✨ Features

- **Recipe Management**: Create, edit, and organize cocktail recipes with precision
- **Batch Calculator**: Scale recipes for events and large parties  
- **Clarification Tools**: Professional clarification calculations for crystal-clear cocktails
- **Search & Filter**: Find recipes by name, ingredient, or glass type
- **Persistent Storage**: SQLite (development) and MySQL (production) database support
- **REST API**: Full backend API for recipe operations
- **Mobile Sleep Prevention**: Toggle to keep mobile screens awake while viewing recipes
- **Cloud Deployment**: Ready for Azure Container Apps with managed MySQL

## 🚀 Quick Start

### Local Development

Choose your preferred database setup:

#### SQLite (Lightweight)
```bash
# Install dependencies
npm install

# Start development with SQLite
./script/dev-setup.fish sqlite
```

#### MySQL (Production-like)
```bash
# Install dependencies and start with MySQL
./script/dev-setup.fish mysql
```

### Manual Development Setup
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

## ☁️ Azure Cloud Deployment

Deploy to Azure Container Apps with managed MySQL database:

```bash
# Follow the complete setup guide
open AZURE_SETUP.md
```

**Quick Azure Setup:**
1. Create Azure service principal
2. Add GitHub secrets (Azure credentials + MySQL password)
3. Push to main branch → automatic deployment!

## 🐳 Docker Container

### Local MySQL Testing
```bash
# Start with MySQL database
docker-compose up

# Or SQLite only
docker-compose --profile sqlite up drinks-app-sqlite
```

### Production Container
```bash
# Run with MySQL
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  ghcr.io/jasonetco/drinks:latest

# Run with SQLite (development)
docker run -p 3000:3000 \
  -v ./recipes.db:/app/recipes.db \
  ghcr.io/jasonetco/drinks:latest
```
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
