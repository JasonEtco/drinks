import { describe, it, expect } from 'vitest';
import { generateId, createIngredient, createRecipe } from '../lib/recipe-utils';
import { GlassType } from '../lib/types';

describe('Recipe Utilities', () => {
  describe('generateId', () => {
    it('should generate a unique string ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with consistent format', () => {
      const id = generateId();
      
      // Should be a string of reasonable length (typically around 26 characters)
      expect(id.length).toBeGreaterThanOrEqual(20);
      expect(id.length).toBeLessThan(35);
      
      // Should only contain alphanumeric characters
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate many unique IDs', () => {
      const ids = new Set();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        ids.add(generateId());
      }
      
      // All IDs should be unique
      expect(ids.size).toBe(iterations);
    });
  });

  describe('createIngredient', () => {
    it('should create a valid ingredient object', () => {
      const ingredient = createIngredient('Vodka', 2, 'oz');
      
      expect(ingredient).toHaveProperty('name', 'Vodka');
      expect(ingredient).toHaveProperty('amount', 2);
      expect(ingredient).toHaveProperty('unit', 'oz');
    });

    it('should handle decimal amounts', () => {
      const ingredient = createIngredient('Lime Juice', 0.75, 'oz');
      
      expect(ingredient.amount).toBe(0.75);
    });

    it('should handle different units', () => {
      const units = ['oz', 'ml', 'dashes', 'splash', 'tsp', 'tbsp'];
      
      units.forEach(unit => {
        const ingredient = createIngredient('Test Ingredient', 1, unit);
        expect(ingredient.unit).toBe(unit);
      });
    });
  });

  describe('createRecipe', () => {
    const sampleIngredients = [
      createIngredient('Vodka', 2, 'oz'),
      createIngredient('Lime Juice', 0.5, 'oz'),
    ];

    it('should create a basic recipe with required fields', () => {
      const recipe = createRecipe(
        'Test Cocktail',
        sampleIngredients,
        'Shake with ice and strain'
      );
      
      expect(recipe).toHaveProperty('id');
      expect(recipe).toHaveProperty('name', 'Test Cocktail');
      expect(recipe).toHaveProperty('ingredients', sampleIngredients);
      expect(recipe).toHaveProperty('instructions', 'Shake with ice and strain');
      expect(recipe).toHaveProperty('tags', []);
      expect(recipe).toHaveProperty('createdAt');
      expect(recipe).toHaveProperty('updatedAt');
      
      expect(typeof recipe.id).toBe('string');
      expect(new Date(recipe.createdAt)).toBeInstanceOf(Date);
      expect(new Date(recipe.updatedAt)).toBeInstanceOf(Date);
    });

    it('should create recipe with all optional fields', () => {
      const recipe = createRecipe(
        'Deluxe Cocktail',
        sampleIngredients,
        'Complex preparation method',
        GlassType.MARTINI,
        'Olive garnish'
      );
      
      expect(recipe.glass).toBe(GlassType.MARTINI);
      expect(recipe.garnish).toBe('Olive garnish');
    });

    it('should generate unique IDs for different recipes', () => {
      const recipe1 = createRecipe('Recipe 1', sampleIngredients, 'Instructions 1');
      const recipe2 = createRecipe('Recipe 2', sampleIngredients, 'Instructions 2');
      
      expect(recipe1.id).not.toBe(recipe2.id);
    });

    it('should handle empty ingredients array', () => {
      const recipe = createRecipe('Empty Recipe', [], 'No ingredients');
      
      expect(recipe.ingredients).toEqual([]);
    });

    it('should set createdAt and updatedAt to same time', () => {
      const recipe = createRecipe('Time Test', sampleIngredients, 'Test');
      
      expect(recipe.createdAt).toBe(recipe.updatedAt);
    });

    it('should handle long names and instructions', () => {
      const longName = 'A'.repeat(100);
      const longInstructions = 'B'.repeat(500);
      
      const recipe = createRecipe(longName, sampleIngredients, longInstructions);
      
      expect(recipe.name).toBe(longName);
      expect(recipe.instructions).toBe(longInstructions);
    });

    it('should handle special characters in name and instructions', () => {
      const specialName = 'Piña Colada "Special" & More';
      const specialInstructions = 'Mix with care & love "properly"';
      
      const recipe = createRecipe(specialName, sampleIngredients, specialInstructions);
      
      expect(recipe.name).toBe(specialName);
      expect(recipe.instructions).toBe(specialInstructions);
    });
  });
});