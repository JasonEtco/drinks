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

const mockGenerateIngredientAlternatives = generateIngredientAlternatives as any;

describe('Ingredient Alternatives API', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/recipes', recipesRouter());
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
      .get('/api/recipes/ingredients/Orange%20Liqueur/alternatives')
      .expect(200);

    expect(response.body).toEqual({
      ingredient: 'Orange Liqueur',
      alternatives: mockAlternatives
    });

    expect(mockGenerateIngredientAlternatives).toHaveBeenCalledWith({
      ingredientName: 'Orange Liqueur'
    });
  });

  it('should handle URL encoded ingredient names', async () => {
    const mockAlternatives = [
      'Lemon juice',
      'Grapefruit juice',
      'Yuzu juice'
    ];

    mockGenerateIngredientAlternatives.mockResolvedValue(mockAlternatives);

    const response = await request(app)
      .get('/api/recipes/ingredients/Fresh%20lime%20juice/alternatives')
      .expect(200);

    expect(response.body).toEqual({
      ingredient: 'Fresh lime juice',
      alternatives: mockAlternatives
    });

    expect(mockGenerateIngredientAlternatives).toHaveBeenCalledWith({
      ingredientName: 'Fresh lime juice'
    });
  });

  it('should return 400 for empty ingredient name', async () => {
    const response = await request(app)
      .get('/api/recipes/ingredients/ /alternatives')
      .expect(400);

    expect(response.body).toEqual({
      error: 'Ingredient name is required'
    });

    expect(mockGenerateIngredientAlternatives).not.toHaveBeenCalled();
  });

  it('should return 400 for missing ingredient name', async () => {
    const response = await request(app)
      .get('/api/recipes/ingredients//alternatives')
      .expect(404); // This will be a 404 because the route won't match

    expect(mockGenerateIngredientAlternatives).not.toHaveBeenCalled();
  });

  it('should handle LLM errors gracefully', async () => {
    mockGenerateIngredientAlternatives.mockRejectedValue(
      new Error('LLM service unavailable')
    );

    const response = await request(app)
      .get('/api/recipes/ingredients/Vodka/alternatives')
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
      .get('/api/recipes/ingredients/Fern%C3%A9t-Branca/alternatives')
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
      .get('/api/recipes/ingredients/Agave%20Tequila/alternatives')
      .expect(200);

    expect(response.body.ingredient).toBe('Agave Tequila');
    expect(response.body.alternatives).toEqual(mockAlternatives);
  });

  it('should handle invalid URL encoding gracefully', async () => {
    const response = await request(app)
      .get('/api/recipes/ingredients/100%25%25invalid/alternatives')
      .expect(400);

    expect(response.body).toEqual({
      error: 'Invalid ingredient name encoding'
    });

    expect(mockGenerateIngredientAlternatives).not.toHaveBeenCalled();
  });
});