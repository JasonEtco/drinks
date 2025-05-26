import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { GlassType, Recipe } from './lib/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, enable in production with proper config
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// In-memory storage for development (replace with database in production)
let recipes: Recipe[] = [
  {
    id: '1',
    name: 'Classic Margarita',
    category: 'cocktail',
    glass: GlassType.ROCKS,
    garnish: 'Lime wheel',
    instructions: 'Shake all ingredients with ice and strain over fresh ice.',
    ingredients: [
      { name: 'Tequila', amount: 2, unit: 'oz' },
      { name: 'Cointreau', amount: 1, unit: 'oz' },
      { name: 'Fresh lime juice', amount: 1, unit: 'oz' }
    ],
    tags: ['classic', 'citrus'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Old Fashioned',
    category: 'cocktail',
    glass: GlassType.ROCKS,
    garnish: 'Orange peel',
    instructions: 'Muddle sugar with bitters, add whiskey and ice, stir.',
    ingredients: [
      { name: 'Bourbon whiskey', amount: 2, unit: 'oz' },
      { name: 'Simple syrup', amount: 0.25, unit: 'oz' },
      { name: 'Angostura bitters', amount: 2, unit: 'dashes' }
    ],
    tags: ['classic', 'whiskey'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// API Routes

// Get all recipes
app.get('/api/recipes', (req, res) => {
  res.json(recipes);
});

// Get recipe by ID
app.get('/api/recipes/:id', (req: any, res: any) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  res.json(recipe);
});

// Create new recipe
app.post('/api/recipes', (req: any, res: any) => {
  const recipe: Recipe = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  recipes.push(recipe);
  res.status(201).json(recipe);
});

// Update recipe
app.put('/api/recipes/:id', (req: any, res: any) => {
  const index = recipes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  recipes[index] = {
    ...recipes[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  res.json(recipes[index]);
});

// Delete recipe
app.delete('/api/recipes/:id', (req: any, res: any) => {
  const index = recipes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  const deletedRecipe = recipes.splice(index, 1)[0];
  res.json(deletedRecipe);
});

// Search recipes
app.get('/api/recipes/search/:query', (req: any, res: any) => {
  const query = req.params.query.toLowerCase();
  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(query) ||
    recipe.tags?.some(tag => tag.toLowerCase().includes(query)) ||
    recipe.category?.toLowerCase().includes(query) ||
    recipe.ingredients.some(ingredient => 
      ingredient.name.toLowerCase().includes(query)
    )
  );
  res.json(filteredRecipes);
});

// Get recipes by category
app.get('/api/recipes/category/:category', (req: any, res: any) => {
  const filteredRecipes = recipes.filter(recipe => 
    recipe.category === req.params.category
  );
  res.json(filteredRecipes);
});

// Health check endpoint
app.get('/api/health', (req: any, res: any) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    recipesCount: recipes.length 
  });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req: any, res: any) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🍸 Mixmaster server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend served at http://localhost:${PORT}`);
});
