# 🍹 Mixmaster Cocktail Recipe Manager

A full-stack cocktail recipe management application built with React, TypeScript, Express.js, and SQLite.

## ✨ Features

- **Recipe Management**: Create, edit, and organize cocktail recipes with precision
- **Batch Calculator**: Scale recipes for events and large parties  
- **Clarification Tools**: Professional clarification calculations for crystal-clear cocktails
- **Search & Filter**: Find recipes by name, ingredient, category, or glass type
- **Persistent Storage**: SQLite database for reliable data persistence
- **REST API**: Full backend API for recipe operations

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

## 🐳 Docker Container

This application is containerized and automatically published to GitHub Container Registry.

### Basic Usage
```bash
# Run with ephemeral storage
docker run -p 3000:3000 ghcr.io/jasonetco/mixmaster-cocktail-r:latest
```

### With Persistent Database (Recommended)
```bash
# Mount the recipes.db file directly
docker run -p 3000:3000 \
  -v $(pwd)/recipes.db:/app/recipes.db \
  ghcr.io/jasonetco/mixmaster-cocktail-r:latest
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

## 📡 API Endpoints

The server provides a REST API at `/api`:

- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/recipes/search?q=query` - Search recipes
- `GET /api/recipes/category/:category` - Get recipes by category
- `GET /api/health` - Health check

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, Node.js
- **Database**: SQLite3
- **Build**: Vite, TSX
- **Container**: Docker, Multi-stage build

## 📄 License

MIT License - see LICENSE file for details.
You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?
- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas
  
🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

🐳 Docker Container

This repository includes a Dockerfile and GitHub Actions workflow for containerization:

- **Docker Hub**: The app is automatically built and published as a Docker container
- **Registry**: Available on GitHub Container Registry (`ghcr.io`)
- **Usage**: `docker run -p 80:80 ghcr.io/jasonetco/mixmaster-cocktail-r:latest`

The container serves the Mixmaster Cocktail application using nginx and is automatically built on pushes to the `main` branch.

📄 License For Spark Template Resources 

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
