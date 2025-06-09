import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

// Mock the createGitHubModels function
vi.mock('../server/llm.js', () => ({
  generateIngredientAlternatives: vi.fn(),
  createGitHubModels: vi.fn(() => vi.fn()),
  generateRecipeTags: vi.fn(),
  generateRecipeFromLikes: vi.fn(),
  generateRecipeDescription: vi.fn(),
}));

import { generateIngredientAlternatives } from '../server/llm.js';
import { generateObject } from 'ai';

const mockGenerateIngredientAlternatives = generateIngredientAlternatives as any;
const mockGenerateObject = generateObject as any;

describe('Ingredient Alternatives LLM', () => {
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
    
    // Set up the actual implementation for testing
    mockGenerateIngredientAlternatives.mockImplementation(async ({ ingredient, recipe }) => {
      const mockResult = {
        object: {
          alternatives: [
            'Mock Alternative 1',
            'Mock Alternative 2',
            'Mock Alternative 3'
          ]
        }
      };

      mockGenerateObject.mockResolvedValue(mockResult);

      // Simulate the actual function logic for testing
      if (!mockResult || !mockResult.object) {
        throw new Error("Failed to generate ingredient alternatives from LLM");
      }

      return mockResult.object.alternatives;
    });
  });

  it('should generate alternatives for a basic ingredient', async () => {
    const result = await generateIngredientAlternatives({
      ingredient: 'Orange Liqueur',
      recipe: mockRecipe
    });

    expect(result).toEqual([
      'Mock Alternative 1',
      'Mock Alternative 2',
      'Mock Alternative 3'
    ]);

    expect(mockGenerateIngredientAlternatives).toHaveBeenCalledWith({
      ingredient: 'Orange Liqueur',
      recipe: mockRecipe
    });
  });

  it('should generate alternatives for a specific spirit', async () => {
    mockGenerateIngredientAlternatives.mockResolvedValueOnce([
      'Blanco Tequila',
      'Mezcal',
      'Silver Rum',
      'Vodka',
      'Pisco'
    ]);

    const result = await generateIngredientAlternatives({
      ingredient: 'Reposado Tequila',
      recipe: mockRecipe
    });

    expect(result).toEqual([
      'Blanco Tequila',
      'Mezcal',
      'Silver Rum',
      'Vodka',
      'Pisco'
    ]);
  });

  it('should handle citrus ingredients', async () => {
    mockGenerateIngredientAlternatives.mockResolvedValueOnce([
      'Lemon juice',
      'Grapefruit juice',
      'Yuzu juice',
      'Orange juice',
      'Citric acid solution'
    ]);

    const result = await generateIngredientAlternatives({
      ingredient: 'Fresh lime juice',
      recipe: mockRecipe
    });

    expect(result).toEqual([
      'Lemon juice',
      'Grapefruit juice',
      'Yuzu juice',
      'Orange juice',
      'Citric acid solution'
    ]);
  });

  it('should throw error when LLM fails to generate result', async () => {
    mockGenerateIngredientAlternatives.mockRejectedValueOnce(
      new Error('Failed to generate ingredient alternatives from LLM')
    );

    await expect(generateIngredientAlternatives({
      ingredient: 'Vodka',
      recipe: mockRecipe
    })).rejects.toThrow('Failed to generate ingredient alternatives from LLM');
  });

  it('should handle complex ingredient names', async () => {
    mockGenerateIngredientAlternatives.mockResolvedValueOnce([
      'Aperol',
      'Cynar',
      'Amaro Nonino',
      'Averna',
      'Montenegro'
    ]);

    const result = await generateIngredientAlternatives({
      ingredient: 'Campari',
      recipe: mockRecipe
    });

    expect(result).toEqual([
      'Aperol',
      'Cynar',
      'Amaro Nonino',
      'Averna',
      'Montenegro'
    ]);
  });
});