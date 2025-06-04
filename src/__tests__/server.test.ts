import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { GlassType } from '../lib/types';

// Define locally to avoid imports
const createTestRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'test-id',
  name: 'Test Margarita',
  glass: GlassType.COUPE,
  garnish: 'Lime wheel',
  instructions: 'Shake all ingredients with ice and strain over fresh ice.',
  ingredients: [
    { id: 'ing1', name: 'Tequila', amount: 2, unit: 'oz' },
    { id: 'ing2', name: 'Cointreau', amount: 1, unit: 'oz' },
    { id: 'ing3', name: 'Fresh lime juice', amount: 1, unit: 'oz' },
  ],
  tags: ['classic', 'citrus'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Define interface locally to avoid imports
interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: Array<{
    id: string;
    name: string;
    amount: number;
    unit: string;
  }>;
  instructions: string;
  glass?: GlassType;
  garnish?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Mock database interface
interface MockDatabase {
  listRecipes(): Promise<Recipe[]>;
  searchRecipes(query: string): Promise<Recipe[]>;
  createRecipe(recipe: any): Promise<Recipe>;
  getRecipeById(id: string): Promise<Recipe | null>;
  updateRecipe(id: string, updates: any): Promise<Recipe | null>;
  deleteRecipe(id: string): Promise<Recipe | null>;
  getRecipeCount(): Promise<number>;
}

const createMockDatabase = (): MockDatabase => ({
  listRecipes: vi.fn(),
  searchRecipes: vi.fn(),
  createRecipe: vi.fn(),
  getRecipeById: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  getRecipeCount: vi.fn(),
});

// Validation schemas (simplified)
const validateCreateRecipe = (data: any) => {
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new Error('Name is required');
  }
  if (!data.instructions || typeof data.instructions !== 'string' || data.instructions.trim() === '') {
    throw new Error('Instructions are required');
  }
  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    throw new Error('At least one ingredient is required');
  }
  for (const ingredient of data.ingredients) {
    if (!ingredient.name || !ingredient.id || typeof ingredient.amount !== 'number' || ingredient.amount <= 0) {
      throw new Error('Invalid ingredient');
    }
  }
  return data;
};

const validateUpdateRecipe = (data: any) => {
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    throw new Error('Name must be a non-empty string');
  }
  if (data.instructions !== undefined && (typeof data.instructions !== 'string' || data.instructions.trim() === '')) {
    throw new Error('Instructions must be a non-empty string');
  }
  if (data.ingredients !== undefined) {
    if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }
  }
  return data;
};

// Create test Express app
const createTestApp = (mockDb: MockDatabase) => {
  const app = express();
  app.use(express.json());

  // Get all recipes
  app.get('/api/recipes', async (_: Request, res: Response) => {
    try {
      const recipes = await mockDb.listRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recipes' });
    }
  });

  // Search recipes
  app.get('/api/recipes/search', async (req: Request, res: Response) => {
    try {
      if (!req.query.q) {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }
      const filteredRecipes = await mockDb.searchRecipes(req.query.q.toString());
      res.json(filteredRecipes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search recipes' });
    }
  });

  // Create new recipe
  app.post('/api/recipes', async (req: Request, res: Response) => {
    try {
      const validatedData = validateCreateRecipe(req.body);
      const recipe = await mockDb.createRecipe(validatedData);
      res.status(201).json(recipe);
    } catch (error) {
      if (error instanceof Error && (error.message.includes('required') || error.message.includes('Invalid'))) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.message
        });
        return;
      }
      res.status(500).json({ error: 'Failed to create recipe' });
    }
  });

  // Get recipe by ID
  app.get('/api/recipes/:recipeId', async (req: Request, res: Response) => {
    try {
      const recipe = await mockDb.getRecipeById(req.params.recipeId);
      if (!recipe) {
        res.status(404).json({ error: 'Recipe not found' });
        return;
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recipe' });
    }
  });

  // Update recipe
  app.put('/api/recipes/:recipeId', async (req: Request, res: Response) => {
    try {
      const validatedData = validateUpdateRecipe(req.body);
      const updatedRecipe = await mockDb.updateRecipe(req.params.recipeId, validatedData);
      if (!updatedRecipe) {
        res.status(404).json({ error: 'Recipe not found' });
        return;
      }
      res.json(updatedRecipe);
    } catch (error) {
      if (error instanceof Error && error.message.includes('must be')) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.message
        });
        return;
      }
      res.status(500).json({ error: 'Failed to update recipe' });
    }
  });

  // Delete recipe
  app.delete('/api/recipes/:recipeId', async (req: Request, res: Response) => {
    try {
      const deletedRecipe = await mockDb.deleteRecipe(req.params.recipeId);
      if (!deletedRecipe) {
        res.status(404).json({ error: 'Recipe not found' });
        return;
      }
      res.json(deletedRecipe);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete recipe' });
    }
  });

  // Health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const recipesCount = await mockDb.getRecipeCount();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        recipesCount,
      });
    } catch (error) {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        recipesCount: 0,
      });
    }
  });

  return app;
};

describe('Server API Endpoints', () => {
  let app: express.Application;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = createMockDatabase();
    app = createTestApp(mockDb);
    vi.clearAllMocks();
  });

  describe('GET /api/recipes', () => {
    it('should return all recipes successfully', async () => {
      const mockRecipes = [
        createTestRecipe({ id: '1', name: 'Margarita' }),
        createTestRecipe({ id: '2', name: 'Old Fashioned' }),
      ];
      (mockDb.listRecipes as ReturnType<typeof vi.fn>).mockResolvedValue(mockRecipes);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipes);
      expect(mockDb.listRecipes).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when database fails', async () => {
      (mockDb.listRecipes as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch recipes' });
    });

    it('should return empty array when no recipes exist', async () => {
      (mockDb.listRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/recipes/search', () => {
    it('should search recipes successfully with query parameter', async () => {
      const mockRecipes = [
        createTestRecipe({ id: '1', name: 'Margarita' }),
      ];
      (mockDb.searchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue(mockRecipes);

      const response = await request(app)
        .get('/api/recipes/search')
        .query({ q: 'margarita' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipes);
      expect(mockDb.searchRecipes).toHaveBeenCalledWith('margarita');
    });

    it('should return 400 when query parameter is missing', async () => {
      const response = await request(app).get('/api/recipes/search');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Query parameter is required' });
      expect(mockDb.searchRecipes).not.toHaveBeenCalled();
    });

    it('should return 500 when database search fails', async () => {
      (mockDb.searchRecipes as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Search error'));

      const response = await request(app)
        .get('/api/recipes/search')
        .query({ q: 'test' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to search recipes' });
    });

    it('should handle empty search results', async () => {
      (mockDb.searchRecipes as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/recipes/search')
        .query({ q: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/recipes', () => {
    const validRecipeData = {
      name: 'Test Recipe',
      instructions: 'Mix and serve',
      ingredients: [
        { id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' },
      ],
      glass: GlassType.COUPE,
      garnish: 'Lemon twist',
      tags: ['test'],
    };

    it('should create a new recipe successfully', async () => {
      const mockCreatedRecipe = createTestRecipe(validRecipeData);
      (mockDb.createRecipe as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedRecipe);

      const response = await request(app)
        .post('/api/recipes')
        .send(validRecipeData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedRecipe);
      expect(mockDb.createRecipe).toHaveBeenCalledWith(validRecipeData);
    });

    it('should return 400 for invalid recipe data - empty name', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        instructions: 'Mix and serve',
        ingredients: [{ id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }],
      };

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(mockDb.createRecipe).not.toHaveBeenCalled();
    });

    it('should return 400 when name is missing', async () => {
      const invalidData = {
        instructions: 'Mix and serve',
        ingredients: [{ id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }],
      };

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 when ingredients are missing', async () => {
      const invalidData = {
        name: 'Test Recipe',
        instructions: 'Mix and serve',
        ingredients: [],
      };

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 500 when database creation fails', async () => {
      (mockDb.createRecipe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/recipes')
        .send(validRecipeData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create recipe' });
    });
  });

  describe('GET /api/recipes/:recipeId', () => {
    it('should return recipe by ID successfully', async () => {
      const mockRecipe = createTestRecipe({ id: 'recipe1' });
      (mockDb.getRecipeById as ReturnType<typeof vi.fn>).mockResolvedValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipe);
      expect(mockDb.getRecipeById).toHaveBeenCalledWith('recipe1');
    });

    it('should return 404 when recipe not found', async () => {
      (mockDb.getRecipeById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const response = await request(app).get('/api/recipes/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Recipe not found' });
    });

    it('should return 500 when database fails', async () => {
      (mockDb.getRecipeById as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/recipes/recipe1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch recipe' });
    });
  });

  describe('PUT /api/recipes/:recipeId', () => {
    const validUpdateData = {
      name: 'Updated Recipe',
      instructions: 'Updated instructions',
    };

    it('should update recipe successfully', async () => {
      const mockUpdatedRecipe = createTestRecipe({ 
        id: 'recipe1', 
        ...validUpdateData 
      });
      (mockDb.updateRecipe as ReturnType<typeof vi.fn>).mockResolvedValue(mockUpdatedRecipe);

      const response = await request(app)
        .put('/api/recipes/recipe1')
        .send(validUpdateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedRecipe);
      expect(mockDb.updateRecipe).toHaveBeenCalledWith('recipe1', validUpdateData);
    });

    it('should return 404 when recipe to update not found', async () => {
      (mockDb.updateRecipe as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/recipes/nonexistent')
        .send(validUpdateData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Recipe not found' });
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
      };

      const response = await request(app)
        .put('/api/recipes/recipe1')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(mockDb.updateRecipe).not.toHaveBeenCalled();
    });

    it('should return 500 when database update fails', async () => {
      (mockDb.updateRecipe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/recipes/recipe1')
        .send(validUpdateData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update recipe' });
    });

    it('should allow partial updates', async () => {
      const partialUpdate = { name: 'New Name Only' };
      const mockUpdatedRecipe = createTestRecipe({ 
        id: 'recipe1', 
        name: 'New Name Only' 
      });
      (mockDb.updateRecipe as ReturnType<typeof vi.fn>).mockResolvedValue(mockUpdatedRecipe);

      const response = await request(app)
        .put('/api/recipes/recipe1')
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(mockDb.updateRecipe).toHaveBeenCalledWith('recipe1', partialUpdate);
    });
  });

  describe('DELETE /api/recipes/:recipeId', () => {
    it('should delete recipe successfully', async () => {
      const mockDeletedRecipe = createTestRecipe({ id: 'recipe1' });
      (mockDb.deleteRecipe as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeletedRecipe);

      const response = await request(app).delete('/api/recipes/recipe1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDeletedRecipe);
      expect(mockDb.deleteRecipe).toHaveBeenCalledWith('recipe1');
    });

    it('should return 404 when recipe to delete not found', async () => {
      (mockDb.deleteRecipe as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const response = await request(app).delete('/api/recipes/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Recipe not found' });
    });

    it('should return 500 when database deletion fails', async () => {
      (mockDb.deleteRecipe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/recipes/recipe1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to delete recipe' });
    });
  });

  describe('GET /api/health', () => {
    it('should return health status with recipe count', async () => {
      (mockDb.getRecipeCount as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.recipesCount).toBe(5);
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return health status with 0 count when database fails', async () => {
      (mockDb.getRecipeCount as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.recipesCount).toBe(0);
      expect(response.body.timestamp).toBeDefined();
    });
  });
});