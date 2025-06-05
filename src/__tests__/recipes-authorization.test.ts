import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { GlassType } from '../lib/types';

// Mock the LLM functions
vi.mock('../server/llm.js', () => ({
  generateRecipeTags: vi.fn().mockResolvedValue(['tag1', 'tag2']),
  generateRecipeFromLikes: vi.fn().mockResolvedValue({
    name: 'Generated Recipe',
    ingredients: [{ name: 'Gin', amount: 2, unit: 'oz' }],
    instructions: 'Mix and serve',
    tags: ['generated'],
  }),
}));

// Mock validation schemas
vi.mock('../lib/validation.js', () => ({
  CreateRecipeSchema: {
    parse: vi.fn((data) => {
      if (!data.name) throw new Error('Name is required');
      return data;
    }),
  },
  UpdateRecipeSchema: {
    parse: vi.fn((data) => data),
  },
}));

// Mock jose library for JWT verification
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: vi.fn(),
}));

// Mock the database import
vi.mock('../lib/database.js', () => ({
  database: {
    listRecipes: vi.fn(),
    searchRecipes: vi.fn(),
    createRecipe: vi.fn(),
    getRecipeById: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    getRecipeCount: vi.fn(),
  }
}));

// Import after mocks
import { recipesRouter } from '../server/recipes';
import { database } from '../lib/database.js';

const createTestRecipe = (overrides = {}) => ({
  id: 'test-recipe-id',
  name: 'Test Cocktail',
  description: 'A test cocktail',
  ingredients: [
    { name: 'Gin', amount: 2, unit: 'oz' },
    { name: 'Tonic', amount: 4, unit: 'oz' },
  ],
  instructions: 'Mix gin and tonic with ice.',
  glass: GlassType.HIGHBALL,
  garnish: 'Lime wedge',
  tags: ['classic', 'refreshing'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('Recipes API Authorization', () => {
  let app: express.Application;
  let mockJwtVerify: any;

  beforeEach(async () => {
    const { jwtVerify } = await import('jose');
    mockJwtVerify = jwtVerify as any;
    
    app = express();
    app.use(express.json());
    app.use('/api/recipes', recipesRouter());
    
    // Mock environment variables for new auth system
    process.env.CLOUDFLARE_TEAM_DOMAIN = 'https://example.cloudflareaccess.com';
    process.env.WRITER_USERS = 'editor@example.com,admin@example.com';
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Type cast the mocked database for easier access
    const mockDb = database as any;
    mockDb.listRecipes.mockClear();
    mockDb.searchRecipes.mockClear();
    mockDb.createRecipe.mockClear();
    mockDb.getRecipeById.mockClear();
    mockDb.updateRecipe.mockClear();
    mockDb.deleteRecipe.mockClear();
    mockDb.getRecipeCount.mockClear();
  });

  describe('Read Operations (No Auth Required)', () => {
    it('should allow getting all recipes without authorization', async () => {
      const mockRecipes = [createTestRecipe()];
      (database.listRecipes as any).mockResolvedValue(mockRecipes);

      const response = await request(app)
        .get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipes);
      expect(database.listRecipes).toHaveBeenCalled();
    });

    it('should allow getting recipe by ID without authorization', async () => {
      const mockRecipe = createTestRecipe();
      (database.getRecipeById as any).mockResolvedValue(mockRecipe);

      const response = await request(app)
        .get('/api/recipes/test-recipe-id');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipe);
      expect(database.getRecipeById).toHaveBeenCalledWith('test-recipe-id');
    });

    it('should allow searching recipes without authorization', async () => {
      const mockRecipes = [createTestRecipe()];
      (database.searchRecipes as any).mockResolvedValue(mockRecipes);

      const response = await request(app)
        .get('/api/recipes/search?q=gin');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipes);
      expect(database.searchRecipes).toHaveBeenCalledWith('gin');
    });

    it('should work with valid CF_Authorization header for read operations', async () => {
      const mockRecipes = [createTestRecipe()];
      (database.listRecipes as any).mockResolvedValue(mockRecipes);
      
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'viewer@example.com' }
      });

      const response = await request(app)
        .get('/api/recipes')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipes);
    });
  });

  describe('Write Operations (Editor Auth Required)', () => {
    describe('Create Recipe', () => {
      it('should require CF_Authorization header for creating recipe', async () => {
        const newRecipe = {
          name: 'New Cocktail',
          ingredients: [{ name: 'Vodka', amount: 2, unit: 'oz' }],
          instructions: 'Serve neat',
          tags: [],
        };

        const response = await request(app)
          .post('/api/recipes')
          .send(newRecipe);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Missing CF_Authorization header');
        expect(database.createRecipe).not.toHaveBeenCalled();
      });

      it('should deny recipe creation for non-writer users', async () => {
        mockJwtVerify.mockResolvedValue({
          payload: { email: 'viewer@example.com' }
        });

        const newRecipe = {
          name: 'New Cocktail',
          ingredients: [{ name: 'Vodka', amount: 2, unit: 'oz' }],
          instructions: 'Serve neat',
          tags: [],
        };

        const response = await request(app)
          .post('/api/recipes')
          .set('CF_Authorization', 'valid-jwt-token')
          .send(newRecipe);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Insufficient permissions');
        expect(database.createRecipe).not.toHaveBeenCalled();
      });

      it('should allow recipe creation for writer users', async () => {
        mockJwtVerify.mockResolvedValue({
          payload: { email: 'editor@example.com' }
        });

        const newRecipe = {
          name: 'New Cocktail',
          ingredients: [{ name: 'Vodka', amount: 2, unit: 'oz' }],
          instructions: 'Serve neat',
          tags: [],
        };
        const createdRecipe = createTestRecipe(newRecipe);
        (database.createRecipe as any).mockResolvedValue(createdRecipe);

        const response = await request(app)
          .post('/api/recipes')
          .set('CF_Authorization', 'valid-jwt-token')
          .send(newRecipe);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(createdRecipe);
        expect(database.createRecipe).toHaveBeenCalled();
      });
    });

    describe('Update Recipe', () => {
      it('should require CF_Authorization header for updating recipe', async () => {
        const updateData = { name: 'Updated Cocktail' };

        const response = await request(app)
          .put('/api/recipes/test-recipe-id')
          .send(updateData);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Missing CF_Authorization header');
        expect(database.updateRecipe).not.toHaveBeenCalled();
      });

      it('should deny recipe update for non-writer users', async () => {
        mockJwtVerify.mockResolvedValue({
          payload: { email: 'viewer@example.com' }
        });

        const updateData = { name: 'Updated Cocktail' };

        const response = await request(app)
          .put('/api/recipes/test-recipe-id')
          .set('CF_Authorization', 'valid-jwt-token')
          .send(updateData);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Insufficient permissions');
        expect(database.updateRecipe).not.toHaveBeenCalled();
      });

      it('should allow recipe update for writer users', async () => {
        mockJwtVerify.mockResolvedValue({
          payload: { email: 'editor@example.com' }
        });

        const updateData = { name: 'Updated Cocktail' };
        const updatedRecipe = createTestRecipe(updateData);
        (database.updateRecipe as any).mockResolvedValue(updatedRecipe);

        const response = await request(app)
          .put('/api/recipes/test-recipe-id')
          .set('CF_Authorization', 'valid-jwt-token')
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedRecipe);
        expect(database.updateRecipe).toHaveBeenCalledWith('test-recipe-id', updateData);
      });
    });

    describe('Delete Recipe', () => {
      it('should require CF_Authorization header for deleting recipe', async () => {
        const response = await request(app)
          .delete('/api/recipes/test-recipe-id');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Missing CF_Authorization header');
        expect(database.deleteRecipe).not.toHaveBeenCalled();
      });

      it('should deny recipe deletion for non-writer users', async () => {
        mockJwtVerify.mockResolvedValue({
          payload: { email: 'viewer@example.com' }
        });

        const response = await request(app)
          .delete('/api/recipes/test-recipe-id')
          .set('CF_Authorization', 'valid-jwt-token');

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Insufficient permissions');
        expect(database.deleteRecipe).not.toHaveBeenCalled();
      });

      it('should allow recipe deletion for writer users', async () => {
        mockJwtVerify.mockResolvedValue({
          payload: { email: 'editor@example.com' }
        });

        const deletedRecipe = createTestRecipe();
        (database.deleteRecipe as any).mockResolvedValue(deletedRecipe);

        const response = await request(app)
          .delete('/api/recipes/test-recipe-id')
          .set('CF_Authorization', 'valid-jwt-token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(deletedRecipe);
        expect(database.deleteRecipe).toHaveBeenCalledWith('test-recipe-id');
      });
    });

    describe('Generate Recipe from Likes', () => {
      it('should require writer permissions for generating recipe from likes', async () => {
        mockJwtVerify.mockResolvedValue({
          payload: { email: 'viewer@example.com' }
        });

        const requestData = {
          likedRecipeIds: ['recipe1', 'recipe2'],
          passedRecipeIds: ['recipe3'],
        };

        const response = await request(app)
          .post('/api/recipes/generate-from-likes')
          .set('CF_Authorization', 'valid-jwt-token')
          .send(requestData);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Insufficient permissions');
      });

      it('should allow generating recipe from likes for writer users', async () => {
        mockJwtVerify.mockResolvedValue({
          payload: { email: 'editor@example.com' }
        });

        const requestData = {
          likedRecipeIds: ['recipe1', 'recipe2'],
          passedRecipeIds: ['recipe3'],
        };
        
        const likedRecipe1 = createTestRecipe({ id: 'recipe1', name: 'Liked Recipe 1' });
        const likedRecipe2 = createTestRecipe({ id: 'recipe2', name: 'Liked Recipe 2' });
        const generatedRecipe = createTestRecipe({ name: 'Generated Recipe' });

        (database.getRecipeById as any)
          .mockResolvedValueOnce(likedRecipe1)
          .mockResolvedValueOnce(likedRecipe2)
          .mockResolvedValueOnce(null); // passed recipe not found
        (database.createRecipe as any).mockResolvedValue(generatedRecipe);

        const response = await request(app)
          .post('/api/recipes/generate-from-likes')
          .set('CF_Authorization', 'valid-jwt-token')
          .send(requestData);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(generatedRecipe);
        expect(database.createRecipe).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid authorization header format', async () => {
      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/recipes')
        .set('CF_Authorization', 'invalid-jwt-token')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header');
    });

    it('should handle database errors gracefully for authorized requests', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'editor@example.com' }
      });

      (database.createRecipe as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/recipes')
        .set('CF_Authorization', 'valid-jwt-token')
        .send({
          name: 'Test Recipe',
          ingredients: [{ name: 'Test', amount: 1, unit: 'oz' }],
          instructions: 'Test instructions',
          tags: [],
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create recipe');
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.CLOUDFLARE_TEAM_DOMAIN;
    delete process.env.WRITER_USERS;
    
    // Reset mocks
    vi.clearAllMocks();
  });
});