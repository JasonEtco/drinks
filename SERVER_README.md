# Drinks

A modern cocktail recipe management application with a React frontend and Express.js backend.

## Features

- ✨ Modern React frontend with beautiful UI components
- 🚀 Express.js server with RESTful API
- 🍸 Complete recipe management (CRUD operations)
- 🔍 Search and filter recipes
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

2. For development with hot-reload (frontend only):
```bash
npm run dev
```

3. To run the full-stack application:
```bash
npm run dev:full
```

4. For production:
```bash
npm run start:prod
```

### Available Scripts

- `npm run dev` - Start Vite development server (frontend only)
- `npm run dev:server` - Start Express server with hot-reload
- `npm run dev:full` - Build frontend and start server
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
