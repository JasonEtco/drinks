# 🍹 Drinks

A full-stack cocktail recipe management application built with React, TypeScript, Express.js, and SQLite.

## ✨ Features

- **Recipe Management**: Create, edit, and organize cocktail recipes with precision
- **Bar Inventory Tracker**: Manage your bar inventory with barcode scanning and recipe integration
- **Batch Calculator**: Scale recipes for events and large parties  
- **Clarification Tools**: Professional clarification calculations for crystal-clear cocktails
- **Search & Filter**: Find recipes by name, ingredient, or glass type
- **Persistent Storage**: SQLite database for reliable data persistence
- **REST API**: Full backend API for recipe and inventory operations
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
# The database file contains both recipes and inventory data
# To backup, simply copy the local recipes.db file
cp recipes.db backup-recipes.db

# To restore, copy your backup back
cp backup-recipes.db recipes.db
```

The SQLite database includes:
- **Recipes table**: All cocktail recipes with ingredients and instructions
- **Inventory table**: Bar inventory items with quantities, categories, and barcodes

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

## 📦 Bar Inventory Tracker

The inventory tracker helps you manage your bar ingredients and see which recipes you can make.

### Features

- **Inventory Management**: Add, edit, and delete ingredients with detailed information
- **Barcode Scanner**: Scan ingredients directly into your inventory with automatic product lookup
- **Product Database Integration**: Automatically identifies products from barcodes using free APIs
- **Smart Form Pre-filling**: Product information automatically populates name, category, and quantity
- **Recipe Integration**: See which recipes you can make with current inventory
- **Smart Suggestions**: Get recommendations for ingredients to expand your recipe options
- **Search & Sort**: Find ingredients quickly with search and sortable columns
- **Quantity Tracking**: Visual indicators for low stock and out-of-stock items

### Adding Ingredients

1. **Manual Entry**: Click "Add Item" to create a new inventory entry
2. **Barcode Scanning**: Use "Scan Barcode" for automatic product identification
   - **Camera Scanning**: Point camera at barcode for automatic detection
   - **Product Lookup**: Found products auto-fill name, brand, category, and suggested quantities
   - **Manual Entry**: Fallback option for manual barcode input
   - **Smart Categories**: Automatically suggests appropriate categories (Spirits, Mixers, Garnishes)
3. **Form Fields**:
   - **Required**: Name, Quantity, Unit
   - **Optional**: Category, Barcode, Purchase/Expiry dates, Cost, Notes

### Product Database Integration

The barcode scanner integrates with multiple free product databases:
- **Open Food Facts**: Comprehensive food and beverage database
- **UPC Item DB**: General product database with fallback support
- **Smart Detection**: Automatic product matching with intelligent categorization
- **Graceful Fallback**: Manual entry when products aren't found in databases

### Recipe Availability

The inventory page shows:
- **Ready to Make**: Recipes you can make with current ingredients
- **Almost Ready**: Recipes missing only a few ingredients
- **Shopping Suggestions**: Most useful ingredients to buy next

### Supported Data

- **Categories**: Spirits, Liqueurs, Wine, Beer, Mixers, Garnish, Tools (auto-suggested from product data)
- **Units**: ml, l, oz, bottle, can, package, g, kg, piece (auto-suggested based on product type)
- **Barcode Standards**: UPC, EAN (via camera scanning with ZXing library)
- **Product Types**: Alcoholic beverages, mixers, garnishes, and bar tools

### Integration

The inventory system automatically:
- Matches ingredients to recipes (case-insensitive)
- Performs basic unit conversions (ml ↔ oz, l ↔ ml)
- Suggests recipes based on available ingredients
- Recommends ingredients that unlock the most recipes
- Looks up product information from barcode databases
- Pre-fills forms with intelligent category and quantity suggestions
- Handles graceful fallbacks when products aren't found in databases

## 📡 API Endpoints

The server provides a REST API at `/api`:

### Recipe Endpoints
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/recipes/search?q=query` - Search recipes

### Inventory Endpoints
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get inventory item by ID
- `GET /api/inventory/barcode/:barcode` - Get inventory item by barcode
- `POST /api/inventory` - Create new inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/inventory/search/:query` - Search inventory items

### System Endpoints
- `GET /api/health` - Health check with recipe and inventory counts

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
