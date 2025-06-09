import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { recipesRouter } from '../server/recipes.js';

// Mock the LLM function
vi.mock('../server/llm.js', () => ({
  generateIngredientAlternatives: vi.fn(),
  generateRecipeTags: vi.fn(),
  generateRecipeFromLikes: vi.fn(),
  createGitHubModels: vi.fn(),
}));

// Mock the database
vi.mock('../lib/database.js', () => ({
  database: {
    listRecipes: vi.fn(),
    searchRecipes: vi.fn(),
    createRecipe: vi.fn(),
    getRecipeById: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
  },
}));

import { generateIngredientAlternatives } from '../server/llm.js';
import { database } from '../lib/database.js';

const mockGenerateIngredientAlternatives = generateIngredientAlternatives as any;
const mockDatabase = database as any;

describe('Ingredient Alternatives API', () => {
  let app: express.Application;
  const mockRecipe = {
    id: 'test-recipe-id',
    name: 'Test Cocktail',
    description: 'A test cocktail',
    ingredients: [
      { name: 'Orange Liqueur', amount: 1, unit: 'oz' },
      { name: 'Vodka', amount: 2, unit: 'oz' }
    ],
    instructions: 'Mix and serve',
    glass: 'Coupe',
    tags: ['test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/recipes', recipesRouter());
    
    // Mock database to return a recipe
    mockDatabase.getRecipeById.mockResolvedValue(mockRecipe);
  });

  it('should return alternatives for a valid ingredient', async () => {
    const mockAlternatives = [
      'Cointreau',
      'Grand Marnier',
      'Orange Curaçao',
      'Triple Sec',
      'Orange Bitters'
    ];

    mockGenerateIngredientAlternatives.mockResolvedValue(mockAlternatives);

    const response = await request(app)
      .post('/api/recipes/ingredients/alternatives')
      .send({
        ingredient: 'Orange Liqueur',
        recipeId: 'test-recipe-id'
      })
      .expect(200);

    expect(response.body).toEqual({
      ingredient: 'Orange Liqueur',
      alternatives: mockAlternatives
    });

    expect(mockGenerateIngredientAlternatives).toHaveBeenCalledWith({
      ingredient: 'Orange Liqueur',
      recipe: mockRecipe
    });
    
    expect(mockDatabase.getRecipeById).toHaveBeenCalledWith('test-recipe-id');
  });

  it('should handle various ingredient names', async () => {
    const mockAlternatives = [
      'Lemon juice',
      'Grapefruit juice',
      'Yuzu juice'
    ];

    mockGenerateIngredientAlternatives.mockResolvedValue(mockAlternatives);

    const response = await request(app)
      .post('/api/recipes/ingredients/alternatives')
      .send({
        ingredient: 'Fresh lime juice',
        recipeId: 'test-recipe-id'
      })
      .expect(200);

    expect(response.body).toEqual({
      ingredient: 'Fresh lime juice',
      alternatives: mockAlternatives
    });

    expect(mockGenerateIngredientAlternatives).toHaveBeenCalledWith({
      ingredient: 'Fresh lime juice',
      recipe: mockRecipe
    });
  });

  it('should return 400 for empty ingredient name', async () => {
    const response = await request(app)
      .post('/api/recipes/ingredients/alternatives')
      .send({
        ingredient: '   ',
        recipeId: 'test-recipe-id'
      })
      .expect(400);

    expect(response.body).toEqual({
      error: 'Ingredient name is required'
    });

    expect(mockGenerateIngredientAlternatives).not.toHaveBeenCalled();
  });

  it('should return 400 for missing ingredient name', async () => {
    const response = await request(app)
      .post('/api/recipes/ingredients/alternatives')
      .send({
        recipeId: 'test-recipe-id'
      })
      .expect(400);

    expect(response.body).toEqual({
      error: 'Ingredient name is required'
    });

    expect(mockGenerateIngredientAlternatives).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent recipe', async () => {
    mockDatabase.getRecipeById.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/recipes/ingredients/alternatives')
      .send({
        ingredient: 'Vodka',
        recipeId: 'non-existent-recipe'
      })
      .expect(404);

    expect(response.body).toEqual({
      error: 'Recipe not found'
    });

    expect(mockGenerateIngredientAlternatives).not.toHaveBeenCalled();
  });

  it('should handle LLM errors gracefully', async () => {
    mockGenerateIngredientAlternatives.mockRejectedValue(
      new Error('LLM service unavailable')
    );

    const response = await request(app)
      .post('/api/recipes/ingredients/alternatives')
      .send({
        ingredient: 'Vodka',
        recipeId: 'test-recipe-id'
      })
      .expect(500);

    expect(response.body).toEqual({
      error: 'Failed to generate ingredient alternatives'
    });
  });

  it('should handle special characters in ingredient names', async () => {
    const mockAlternatives = [
      'Aperol',
      'Cynar',
      'Amaro Nonino'
    ];

    mockGenerateIngredientAlternatives.mockResolvedValue(mockAlternatives);

    const response = await request(app)
      .post('/api/recipes/ingredients/alternatives')
      .send({
        ingredient: 'Fernét-Branca',
        recipeId: 'test-recipe-id'
      })
      .expect(200);

    expect(response.body.ingredient).toBe('Fernét-Branca');
    expect(response.body.alternatives).toEqual(mockAlternatives);
  });

  it('should handle ingredients with numbers', async () => {
    const mockAlternatives = [
      'Blanco Tequila',
      'Mezcal',
      'Silver Rum'
    ];

    mockGenerateIngredientAlternatives.mockResolvedValue(mockAlternatives);

    const response = await request(app)
      .post('/api/recipes/ingredients/alternatives')
      .send({
        ingredient: 'Agave Tequila',
        recipeId: 'test-recipe-id'
      })
      .expect(200);

    expect(response.body.ingredient).toBe('Agave Tequila');
    expect(response.body.alternatives).toEqual(mockAlternatives);
  });
});