import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { database } from './lib/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DEBUG_API_KEY = process.env.DEBUG_API_KEY;

const execAsync = promisify(exec);

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

// Debugging endpoint - requires authentication
app.post('/api/debug', async (req: Request, res: Response) => {
  try {
    // Check if debugging is enabled and API key is configured
    if (!DEBUG_API_KEY) {
      res.status(503).json({ error: 'Debug endpoint not configured' });
      return;
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.substring(7);
    if (token !== DEBUG_API_KEY) {
      res.status(403).json({ error: 'Invalid debug token' });
      return;
    }

    // Validate request body
    const { command, args = [] } = req.body;
    if (!command || typeof command !== 'string') {
      res.status(400).json({ error: 'Command is required and must be a string' });
      return;
    }

    // Only allow specific safe commands
    const allowedCommands = ['curl', 'ls'];
    if (!allowedCommands.includes(command)) {
      res.status(400).json({ 
        error: `Command not allowed. Only ${allowedCommands.join(', ')} are permitted` 
      });
      return;
    }

    // Validate arguments are strings and don't contain dangerous characters
    if (!Array.isArray(args)) {
      res.status(400).json({ error: 'Args must be an array' });
      return;
    }

    for (const arg of args) {
      if (typeof arg !== 'string') {
        res.status(400).json({ error: 'All arguments must be strings' });
        return;
      }
      // Basic sanitization - prevent command injection
      if (arg.includes(';') || arg.includes('&') || arg.includes('|') || 
          arg.includes('`') || arg.includes('$') || arg.includes('>') || 
          arg.includes('<') || arg.includes('&&') || arg.includes('||')) {
        res.status(400).json({ error: 'Arguments contain unsafe characters' });
        return;
      }
    }

    // Additional validation for specific commands
    if (command === 'curl') {
      // For curl, limit to basic HTTP operations
      const safeArgs = args.filter(arg => 
        arg.startsWith('http://') || 
        arg.startsWith('https://') || 
        arg === '-s' || 
        arg === '-S' || 
        arg === '-f' || 
        arg === '-L' || 
        arg.startsWith('-H') ||
        arg.startsWith('--header')
      );
      if (safeArgs.length !== args.length) {
        res.status(400).json({ error: 'Some curl arguments are not allowed' });
        return;
      }
    } else if (command === 'ls') {
      // For ls, only allow basic listing options
      const safeArgs = args.filter(arg => 
        arg.startsWith('/') || 
        arg.startsWith('./') || 
        arg === '-l' || 
        arg === '-a' || 
        arg === '-la' || 
        arg === '-h' || 
        arg === '-lh' ||
        /^[a-zA-Z0-9._/-]+$/.test(arg)
      );
      if (safeArgs.length !== args.length) {
        res.status(400).json({ error: 'Some ls arguments are not allowed' });
        return;
      }
    }

    // Build and execute command
    const fullCommand = `${command} ${args.join(' ')}`.trim();
    
    // Set execution timeout and options
    const execOptions = {
      timeout: 10000, // 10 second timeout
      maxBuffer: 1024 * 1024, // 1MB max output
      cwd: process.cwd()
    };

    console.log(`Debug command executed: ${fullCommand}`);
    const { stdout, stderr } = await execAsync(fullCommand, execOptions);
    
    res.json({
      command: fullCommand,
      stdout: stdout,
      stderr: stderr,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Debug command error:', error);
    
    // Handle specific exec errors
    if (error.code === 'ENOENT') {
      res.status(400).json({ 
        error: 'Command not found',
        timestamp: new Date().toISOString()
      });
    } else if (error.signal === 'SIGTERM' || error.signal === 'SIGKILL') {
      res.status(408).json({ 
        error: 'Command timeout',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: 'Command execution failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*splat', (_: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🍸 Drinks server running on port ${PORT}`);
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
