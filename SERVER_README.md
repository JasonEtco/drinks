# Drinks

A modern cocktail recipe management application with a React frontend and Express.js backend.

## Features

- ✨ Modern React frontend with beautiful UI components
- 🚀 Express.js server with RESTful API
- 🍸 Complete recipe management (CRUD operations)
- 🔍 Search and filter recipes
- 🧠 AI-powered cocktail ideation and suggestions
- 📱 Responsive design
- 🎯 TypeScript throughout

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional, for AI chat feature):
```bash
export GITHUB_TOKEN=your_github_personal_access_token
```
Note: The AI chat feature on the `/ideate` page requires a GitHub Personal Access Token with access to GitHub Models.

3. For development with Hot Module Reloading (HMR):
```bash
npm run dev
```
This starts both the frontend dev server with HMR (http://localhost:5173) and backend server (http://localhost:3000). Changes to React components will be instantly reflected in the browser without losing application state.

4. To run individual development servers:
```bash
# Frontend only (with HMR)
npm run dev:client

# Backend only (with hot reload)
npm run dev:server
```

5. To run the full-stack application (production-like):
```bash
npm run dev:full
```

5. For production:
```bash
npm run start:prod
```

## Development Workflow

### Hot Module Reloading (HMR)
The project is configured with Vite's Hot Module Reloading for optimal development experience:

- **React Fast Refresh**: Instant updates to React components while preserving component state
- **CSS Hot Reload**: Immediate style changes without page refresh  
- **API Proxy**: Development server automatically proxies API calls to the backend
- **Error Overlay**: Helpful error messages displayed directly in the browser

### Development vs Production
- **Development** (`npm run dev`): Uses Vite dev server (port 5173) with HMR + Express server (port 3000)
- **Production** (`npm run start:prod`): Builds static assets and serves everything from Express server (port 3000)

### Available Scripts

- `npm run dev` - Start full development environment (Vite HMR + Express server)
- `npm run dev:client` - Start Vite development server with HMR (port 5173)
- `npm run dev:server` - Start Express server with hot-reload (port 3000)
- `npm run dev:full` - Build frontend and start server (production-like)
- `npm run build` - Build frontend for production
- `npm run start:prod` - Build everything and start production server
- `npm run lint` - Run ESLint

## API Endpoints

The server provides the following REST API endpoints:

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Search & Filter
- `GET /api/recipes/search/:query` - Search recipes
- `GET /api/recipes/category/:category` - Get recipes by category

### AI Chat
- `POST /api/chat` - Get AI-powered cocktail suggestions (requires GITHUB_TOKEN)

### Health Check
- `GET /api/health` - API health check

## Project Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── lib/                # Utilities and types
├── styles/             # CSS and styling
├── server.ts           # Express server
└── main.tsx           # React app entry point
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, TypeScript
- **Build**: Vite
- **Development**: tsx (TypeScript execution)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
