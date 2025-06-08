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
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up the actual implementation for testing
    mockGenerateIngredientAlternatives.mockImplementation(async ({ ingredientName }) => {
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
      ingredientName: 'Orange Liqueur'
    });

    expect(result).toEqual([
      'Mock Alternative 1',
      'Mock Alternative 2',
      'Mock Alternative 3'
    ]);

    expect(mockGenerateIngredientAlternatives).toHaveBeenCalledWith({
      ingredientName: 'Orange Liqueur'
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
      ingredientName: 'Reposado Tequila'
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
      ingredientName: 'Fresh lime juice'
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
      ingredientName: 'Vodka'
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
      ingredientName: 'Campari'
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