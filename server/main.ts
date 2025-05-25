import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import type { Recipe } from '../src/lib/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Database setup
const dbPath = path.join(__dirname, '../recipes.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    notes TEXT,
    created TEXT NOT NULL,
    updated TEXT NOT NULL,
    glass TEXT,
    garnish TEXT,
    category TEXT
  )
`);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// API Routes

// Get all recipes
app.get('/api/recipes', (req, res) => {
  try {
    const recipes = db.prepare('SELECT * FROM recipes').all();
    const parsedRecipes = recipes.map(recipe => ({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients)
    }));
    res.json(parsedRecipes);
  } catch (error) {
    console.error('Error loading recipes:', error);
    res.status(500).json({ error: 'Failed to load recipes' });
  }
});

// Add a new recipe
app.post('/api/recipes', (req, res) => {
  try {
    const recipe: Recipe = req.body;
    const stmt = db.prepare(`
      INSERT INTO recipes (id, name, ingredients, instructions, notes, created, updated, glass, garnish, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      recipe.id,
      recipe.name,
      JSON.stringify(recipe.ingredients),
      recipe.instructions,
      recipe.notes || null,
      recipe.created,
      recipe.updated,
      recipe.glass || null,
      recipe.garnish || null,
      recipe.category || null
    );
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error adding recipe:', error);
    res.status(500).json({ error: 'Failed to add recipe' });
  }
});

// Update a recipe
app.put('/api/recipes/:id', (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipe: Recipe = req.body;
    
    const stmt = db.prepare(`
      UPDATE recipes 
      SET name = ?, ingredients = ?, instructions = ?, notes = ?, updated = ?, glass = ?, garnish = ?, category = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      recipe.name,
      JSON.stringify(recipe.ingredients),
      recipe.instructions,
      recipe.notes || null,
      recipe.updated,
      recipe.glass || null,
      recipe.garnish || null,
      recipe.category || null,
      recipeId
    );
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Recipe not found' });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete a recipe
app.delete('/api/recipes/:id', (req, res) => {
  try {
    const recipeId = req.params.id;
    const stmt = db.prepare('DELETE FROM recipes WHERE id = ?');
    const result = stmt.run(recipeId);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Recipe not found' });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Get a recipe by ID
app.get('/api/recipes/:id', (req, res) => {
  try {
    const recipeId = req.params.id;
    const stmt = db.prepare('SELECT * FROM recipes WHERE id = ?');
    const recipe = stmt.get(recipeId);
    
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
    } else {
      const parsedRecipe = {
        ...recipe,
        ingredients: JSON.parse(recipe.ingredients)
      };
      res.json(parsedRecipe);
    }
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({ error: 'Failed to get recipe' });
  }
});

// Import recipes (merge with existing)
app.post('/api/recipes/import', (req, res) => {
  try {
    const importedRecipes: Recipe[] = req.body.recipes;
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO recipes (id, name, ingredients, instructions, notes, created, updated, glass, garnish, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction((recipes: Recipe[]) => {
      for (const recipe of recipes) {
        insertStmt.run(
          recipe.id,
          recipe.name,
          JSON.stringify(recipe.ingredients),
          recipe.instructions,
          recipe.notes || null,
          recipe.created,
          recipe.updated,
          recipe.glass || null,
          recipe.garnish || null,
          recipe.category || null
        );
      }
    });
    
    transaction(importedRecipes);
    res.json({ success: true });
  } catch (error) {
    console.error('Error importing recipes:', error);
    res.status(500).json({ error: 'Failed to import recipes' });
  }
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Gracefully close database on exit
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});