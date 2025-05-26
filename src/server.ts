import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { database } from './lib/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('combined'));
app.use(express.json());

// Get all recipes
app.get('/api/recipes', async (_: Request, res: Response) => {
  try {
    const recipes = await database.listRecipes();
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Search recipes (must come before /:recipeId route)
app.get('/api/recipes/search', async (req: Request, res: Response) => {
  try {
    if (!req.query.q) {
      res.status(400).json({ error: 'Query parameter is required' });
      return
    }
    const filteredRecipes = await database.searchRecipes(req.query.q.toString());
    res.json(filteredRecipes);
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

// Get recipes by category (must come before /:recipeId route)
app.get('/api/recipes/category/:category', async (req: Request, res: Response) => {
  try {
    const filteredRecipes = await database.getRecipesByCategory(req.params.category);
    res.json(filteredRecipes);
  } catch (error) {
    console.error('Error fetching recipes by category:', error);
    res.status(500).json({ error: 'Failed to fetch recipes by category' });
  }
});

// Create new recipe
app.post('/api/recipes', async (req: Request, res: Response) => {
  try {
    const recipe = await database.createRecipe(req.body);
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Get recipe by ID (must come after specific routes)
app.get('/api/recipes/:recipeId', async (req: Request, res: Response) => {
  try {
    const recipe = await database.getRecipeById(req.params.recipeId);
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return
    }
    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});


// Update recipe
app.put('/api/recipes/:recipeId', async (req: Request, res: Response) => {
  try {
    const updatedRecipe = await database.updateRecipe(req.params.recipeId, req.body);
    if (!updatedRecipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return
    }
    res.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
app.delete('/api/recipes/:recipeId', async (req: Request, res: Response) => {
  try {
    const deletedRecipe = await database.deleteRecipe(req.params.recipeId);
    if (!deletedRecipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return
    }
    res.json(deletedRecipe);
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const recipesCount = await database.getRecipeCount();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      recipesCount 
    });
  } catch (error) {
    console.error('Error getting recipe count:', error);
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      recipesCount: 0 
    });
  }
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  database.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  database.close();
  process.exit(0);
});
