import { describe, it, expect } from 'vitest';
import { analyzeRecipeAvailability, getAvailableRecipes, getIngredientSuggestions } from '../lib/recipe-inventory';
import { Recipe, InventoryItem, GlassType } from '../lib/types';

const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Gin',
    quantity: 750,
    unit: 'ml',
    category: 'spirits',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Lemon Juice',
    quantity: 200,
    unit: 'ml',
    category: 'mixers',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Simple Syrup',
    quantity: 100,
    unit: 'ml',
    category: 'mixers',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Gin Sour',
    description: 'Classic gin sour cocktail',
    ingredients: [
      { name: 'Gin', amount: 60, unit: 'ml' },
      { name: 'Lemon Juice', amount: 30, unit: 'ml' },
      { name: 'Simple Syrup', amount: 15, unit: 'ml' },
    ],
    instructions: 'Shake with ice and strain.',
    glass: GlassType.COUPE,
    tags: ['classic', 'sour'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Martini',
    description: 'Classic dry martini',
    ingredients: [
      { name: 'Gin', amount: 60, unit: 'ml' },
      { name: 'Dry Vermouth', amount: 15, unit: 'ml' },
    ],
    instructions: 'Stir with ice and strain.',
    glass: GlassType.MARTINI,
    tags: ['classic', 'stirred'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Whiskey Sour',
    description: 'Classic whiskey sour',
    ingredients: [
      { name: 'Whiskey', amount: 60, unit: 'ml' },
      { name: 'Lemon Juice', amount: 30, unit: 'ml' },
      { name: 'Simple Syrup', amount: 15, unit: 'ml' },
    ],
    instructions: 'Shake with ice and strain.',
    glass: GlassType.ROCKS,
    tags: ['classic', 'sour'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

describe('Recipe Inventory Analysis', () => {
  describe('analyzeRecipeAvailability', () => {
    it('should correctly identify available recipes', () => {
      const analysis = analyzeRecipeAvailability(mockRecipes, mockInventory);
      
      // Gin Sour should be available (we have all ingredients)
      const ginSourAnalysis = analysis.find(a => a.recipe.name === 'Gin Sour');
      expect(ginSourAnalysis?.canMake).toBe(true);
      expect(ginSourAnalysis?.missingIngredients).toHaveLength(0);
      expect(ginSourAnalysis?.availableIngredients).toHaveLength(3);
    });

    it('should correctly identify partially available recipes', () => {
      const analysis = analyzeRecipeAvailability(mockRecipes, mockInventory);
      
      // Martini should be partial (we have gin but no vermouth)
      const martiniAnalysis = analysis.find(a => a.recipe.name === 'Martini');
      expect(martiniAnalysis?.canMake).toBe(false);
      expect(martiniAnalysis?.partialMatch).toBe(true);
      expect(martiniAnalysis?.missingIngredients).toHaveLength(1);
      expect(martiniAnalysis?.availableIngredients).toHaveLength(1);
    });

    it('should correctly identify unavailable recipes', () => {
      const analysis = analyzeRecipeAvailability(mockRecipes, mockInventory);
      
      // Whiskey Sour should be partial (we have lemon juice and syrup but no whiskey)
      const whiskeySourAnalysis = analysis.find(a => a.recipe.name === 'Whiskey Sour');
      expect(whiskeySourAnalysis?.canMake).toBe(false);
      expect(whiskeySourAnalysis?.partialMatch).toBe(true);
      expect(whiskeySourAnalysis?.missingIngredients).toHaveLength(1);
      expect(whiskeySourAnalysis?.availableIngredients).toHaveLength(2);
    });
  });

  describe('getAvailableRecipes', () => {
    it('should return only recipes that can be fully made', () => {
      const available = getAvailableRecipes(mockRecipes, mockInventory);
      
      expect(available).toHaveLength(1);
      expect(available[0].name).toBe('Gin Sour');
    });

    it('should return empty array when no recipes can be made', () => {
      const emptyInventory: InventoryItem[] = [];
      const available = getAvailableRecipes(mockRecipes, emptyInventory);
      
      expect(available).toHaveLength(0);
    });
  });

  describe('getIngredientSuggestions', () => {
    it('should suggest missing ingredients ordered by recipe count', () => {
      const suggestions = getIngredientSuggestions(mockRecipes, mockInventory);
      
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should suggest whiskey and dry vermouth
      const suggestionNames = suggestions.map(s => s.ingredient);
      expect(suggestionNames).toContain('dry vermouth');
      expect(suggestionNames).toContain('whiskey');
    });

    it('should include recipe count for each suggestion', () => {
      const suggestions = getIngredientSuggestions(mockRecipes, mockInventory);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.recipeCount).toBeGreaterThan(0);
        expect(suggestion.recipes).toHaveLength(suggestion.recipeCount);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty inventory', () => {
      const analysis = analyzeRecipeAvailability(mockRecipes, []);
      
      analysis.forEach(result => {
        expect(result.canMake).toBe(false);
        expect(result.availableIngredients).toHaveLength(0);
        expect(result.missingIngredients.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty recipes', () => {
      const analysis = analyzeRecipeAvailability([], mockInventory);
      
      expect(analysis).toHaveLength(0);
    });

    it('should handle case-insensitive ingredient matching', () => {
      const inventoryWithDifferentCase: InventoryItem[] = [
        {
          id: '1',
          name: 'gin', // lowercase
          quantity: 750,
          unit: 'ml',
          category: 'spirits',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const recipeWithUpperCase: Recipe[] = [
        {
          id: '1',
          name: 'Test Cocktail',
          description: 'Test',
          ingredients: [
            { name: 'GIN', amount: 60, unit: 'ml' }, // uppercase
          ],
          instructions: 'Test',
          glass: GlassType.COUPE,
          tags: [],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const analysis = analyzeRecipeAvailability(recipeWithUpperCase, inventoryWithDifferentCase);
      
      expect(analysis[0].canMake).toBe(true);
    });
  });
});