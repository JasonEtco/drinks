import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { GlassType } from '../lib/types';

// Create a simple test app for edge case testing
const createEdgeCaseTestApp = () => {
  const app = express();
  app.use(express.json({ limit: '1mb' })); // Set a limit for testing

  // Test endpoint for malformed JSON
  app.post('/api/test/json', (req: Request, res: Response) => {
    res.json({ received: req.body });
  });

  // Test endpoint for large payloads
  app.post('/api/test/large', (req: Request, res: Response) => {
    res.json({ size: JSON.stringify(req.body).length });
  });

  // Test endpoint for various HTTP methods
  app.all('/api/test/methods', (req: Request, res: Response) => {
    res.json({ method: req.method });
  });

  // Test endpoint with parameters
  app.get('/api/test/params/:id/:category', (req: Request, res: Response) => {
    res.json({ 
      id: req.params.id, 
      category: req.params.category,
      query: req.query 
    });
  });

  // Test endpoint for content types
  app.post('/api/test/content-type', (req: Request, res: Response) => {
    res.json({ 
      contentType: req.headers['content-type'],
      body: req.body 
    });
  });

  return app;
};

describe('Server Edge Cases and Error Handling', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createEdgeCaseTestApp();
  });

  describe('JSON Parsing', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/test/json')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should handle empty JSON object', async () => {
      const response = await request(app)
        .post('/api/test/json')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({});
    });

    it('should handle null values in JSON', async () => {
      const data = {
        name: null,
        value: null,
        nested: { prop: null }
      };

      const response = await request(app)
        .post('/api/test/json')
        .send(data);

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual(data);
    });
  });

  describe('URL Parameters', () => {
    it('should handle URL-encoded parameters', async () => {
      const response = await request(app)
        .get('/api/test/params/test%20id/special%20category')
        .query({ q: 'test query', filter: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('test id');
      expect(response.body.category).toBe('special category');
      expect(response.body.query.q).toBe('test query');
    });

    it('should handle special characters in parameters', async () => {
      const response = await request(app)
        .get('/api/test/params/café&bar/piña-colada');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('café&bar');
      expect(response.body.category).toBe('piña-colada');
    });

    it('should handle empty query parameters', async () => {
      const response = await request(app)
        .get('/api/test/params/123/cocktail')
        .query({ q: '', empty: '' });

      expect(response.status).toBe(200);
      expect(response.body.query.q).toBe('');
    });
  });

  describe('HTTP Methods', () => {
    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const response = await request(app)[method.toLowerCase() as keyof request.SuperTest<request.Test>]('/api/test/methods');
        expect(response.status).toBe(200);
        expect(response.body.method).toBe(method);
      }
    });
  });

  describe('Content Types', () => {
    it('should handle application/json content type', async () => {
      const response = await request(app)
        .post('/api/test/content-type')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });

      expect(response.status).toBe(200);
      expect(response.body.contentType).toContain('application/json');
      expect(response.body.body).toEqual({ test: 'data' });
    });

    it('should handle missing content type', async () => {
      const response = await request(app)
        .post('/api/test/content-type')
        .send('plain text');

      expect(response.status).toBe(200);
    });
  });

  describe('Large Payloads', () => {
    it('should handle moderately large JSON payloads', async () => {
      const largeData = {
        items: Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'A'.repeat(100) // 100 character string
        }))
      };

      const response = await request(app)
        .post('/api/test/large')
        .send(largeData);

      expect(response.status).toBe(200);
      expect(response.body.size).toBeGreaterThan(100000);
    });
  });
});

describe('Recipe API Edge Cases', () => {
  // Mock database for edge case testing
  const mockDb = {
    listRecipes: vi.fn(),
    searchRecipes: vi.fn(),
    getRecipesByCategory: vi.fn(),
    createRecipe: vi.fn(),
    getRecipeById: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    getRecipeCount: vi.fn(),
  };

  const createRecipeApp = () => {
    const app = express();
    app.use(express.json());

    // Search endpoint with edge case handling
    app.get('/api/recipes/search', async (req: Request, res: Response) => {
      try {
        if (!req.query.q) {
          res.status(400).json({ error: 'Query parameter is required' });
          return;
        }
        
        const query = req.query.q.toString();
        // Handle very long queries
        if (query.length > 1000) {
          res.status(400).json({ error: 'Query too long' });
          return;
        }

        const results = await mockDb.searchRecipes(query);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: 'Failed to search recipes' });
      }
    });

    // Category endpoint with validation
    app.get('/api/recipes/category/:category', async (req: Request, res: Response) => {
      try {
        const category = req.params.category;
        
        // Validate category parameter
        if (category.length > 100) {
          res.status(400).json({ error: 'Category name too long' });
          return;
        }

        const results = await mockDb.getRecipesByCategory(category);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipes by category' });
      }
    });

    return app;
  };

  let app: express.Application;

  beforeEach(() => {
    app = createRecipeApp();
    vi.clearAllMocks();
  });

  describe('Search Edge Cases', () => {
    it('should handle empty search query gracefully', async () => {
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ q: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query parameter is required');
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1001);
      
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ q: longQuery });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query too long');
    });

    it('should handle special characters in search query', async () => {
      mockDb.searchRecipes.mockResolvedValue([]);
      
      const specialQuery = 'piña & "special" cocktail (with herbs)';
      
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ q: specialQuery });

      expect(response.status).toBe(200);
      expect(mockDb.searchRecipes).toHaveBeenCalledWith(specialQuery);
    });

    it('should handle Unicode characters in search query', async () => {
      mockDb.searchRecipes.mockResolvedValue([]);
      
      const unicodeQuery = '🍸 cocktail with émojis & ñoñó';
      
      const response = await request(app)
        .get('/api/recipes/search')
        .query({ q: unicodeQuery });

      expect(response.status).toBe(200);
      expect(mockDb.searchRecipes).toHaveBeenCalledWith(unicodeQuery);
    });
  });

  describe('Category Edge Cases', () => {
    it('should handle very long category names', async () => {
      const longCategory = 'a'.repeat(101);
      
      const response = await request(app)
        .get(`/api/recipes/category/${longCategory}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category name too long');
    });

    it('should handle special characters in category', async () => {
      mockDb.getRecipesByCategory.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/recipes/category/specialty & "unique" drinks');

      expect(response.status).toBe(200);
    });

    it('should handle numeric category names', async () => {
      mockDb.getRecipesByCategory.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/recipes/category/123');

      expect(response.status).toBe(200);
      expect(mockDb.getRecipesByCategory).toHaveBeenCalledWith('123');
    });
  });
});

describe('Recipe Data Validation Edge Cases', () => {
  const createValidationApp = () => {
    const app = express();
    app.use(express.json());

    const validateRecipe = (data: any, isUpdate = false) => {
      const errors = [];

      if (!isUpdate || data.name !== undefined) {
        if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
          errors.push('Name is required and must be a non-empty string');
        } else if (data.name.length > 200) {
          errors.push('Name must be 200 characters or less');
        }
      }

      if (!isUpdate || data.instructions !== undefined) {
        if (!data.instructions || typeof data.instructions !== 'string' || data.instructions.trim() === '') {
          errors.push('Instructions are required and must be a non-empty string');
        } else if (data.instructions.length > 2000) {
          errors.push('Instructions must be 2000 characters or less');
        }
      }

      if (!isUpdate || data.ingredients !== undefined) {
        if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
          errors.push('At least one ingredient is required');
        } else if (data.ingredients.length > 50) {
          errors.push('Maximum 50 ingredients allowed');
        } else {
          data.ingredients.forEach((ingredient: any, index: number) => {
            if (!ingredient.id || !ingredient.name || typeof ingredient.amount !== 'number' || ingredient.amount <= 0) {
              errors.push(`Ingredient ${index + 1} is invalid`);
            }
            if (ingredient.amount > 1000) {
              errors.push(`Ingredient ${index + 1} amount too large`);
            }
          });
        }
      }

      if (data.tags && (!Array.isArray(data.tags) || data.tags.length > 20)) {
        errors.push('Maximum 20 tags allowed');
      }

      return errors;
    };

    app.post('/api/recipes', (req: Request, res: Response) => {
      const errors = validateRecipe(req.body);
      if (errors.length > 0) {
        res.status(400).json({ error: 'Validation failed', details: errors });
        return;
      }
      res.status(201).json({ success: true });
    });

    app.put('/api/recipes/:id', (req: Request, res: Response) => {
      const errors = validateRecipe(req.body, true);
      if (errors.length > 0) {
        res.status(400).json({ error: 'Validation failed', details: errors });
        return;
      }
      res.json({ success: true });
    });

    return app;
  };

  let app: express.Application;

  beforeEach(() => {
    app = createValidationApp();
  });

  describe('Recipe Name Validation', () => {
    it('should reject extremely long recipe names', async () => {
      const longName = 'a'.repeat(201);
      
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: longName,
          instructions: 'Test instructions',
          ingredients: [{ id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Name must be 200 characters or less');
    });

    it('should reject whitespace-only names', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: '   ',
          instructions: 'Test instructions',
          ingredients: [{ id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Name is required and must be a non-empty string');
    });
  });

  describe('Instructions Validation', () => {
    it('should reject extremely long instructions', async () => {
      const longInstructions = 'a'.repeat(2001);
      
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          instructions: longInstructions,
          ingredients: [{ id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Instructions must be 2000 characters or less');
    });
  });

  describe('Ingredients Validation', () => {
    it('should reject too many ingredients', async () => {
      const manyIngredients = Array(51).fill(0).map((_, i) => ({
        id: `ing${i}`,
        name: `Ingredient ${i}`,
        amount: 1,
        unit: 'oz'
      }));

      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          instructions: 'Test instructions',
          ingredients: manyIngredients
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Maximum 50 ingredients allowed');
    });

    it('should reject ingredients with excessive amounts', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          instructions: 'Test instructions',
          ingredients: [{ id: 'ing1', name: 'Vodka', amount: 1001, unit: 'oz' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Ingredient 1 amount too large');
    });

    it('should reject ingredients with negative amounts', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          instructions: 'Test instructions',
          ingredients: [{ id: 'ing1', name: 'Vodka', amount: -1, unit: 'oz' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Ingredient 1 is invalid');
    });

    it('should reject ingredients with zero amounts', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          instructions: 'Test instructions',
          ingredients: [{ id: 'ing1', name: 'Vodka', amount: 0, unit: 'oz' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Ingredient 1 is invalid');
    });
  });

  describe('Tags Validation', () => {
    it('should reject too many tags', async () => {
      const manyTags = Array(21).fill(0).map((_, i) => `tag${i}`);

      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          instructions: 'Test instructions',
          ingredients: [{ id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }],
          tags: manyTags
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Maximum 20 tags allowed');
    });
  });

  describe('Update Validation', () => {
    it('should allow partial updates with valid data', async () => {
      const response = await request(app)
        .put('/api/recipes/123')
        .send({
          name: 'Updated Name Only'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject partial updates with invalid data', async () => {
      const response = await request(app)
        .put('/api/recipes/123')
        .send({
          name: 'a'.repeat(201) // Too long
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Name must be 200 characters or less');
    });
  });
});