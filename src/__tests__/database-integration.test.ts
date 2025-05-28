import { Database as SqliteDB } from 'sqlite3';
import { TestDatabase, createTestRecipe } from './test-utils';
import { GlassType } from '../lib/types';

describe('Database Integration Tests', () => {
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = new TestDatabase();
    await testDb.connect();
    await testDb.initialize();
  });

  afterEach(async () => {
    await testDb.close();
  });

  describe('Database Setup', () => {
    it('should connect to in-memory database successfully', async () => {
      expect(testDb.getDb()).not.toBeNull();
    });

    it('should initialize database schema correctly', async () => {
      // Test that we can query the schema
      const db = testDb.getDb()!;
      return new Promise<void>((resolve, reject) => {
        db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='recipes'",
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              expect(row).toBeDefined();
              expect((row as any).name).toBe('recipes');
              resolve();
            }
          }
        );
      });
    });
  });

  describe('Test Recipe Operations', () => {
    it('should insert test recipe successfully', async () => {
      const recipe = createTestRecipe({
        name: 'Test Mojito',
        category: 'cocktail',
        glass: GlassType.HIGHBALL
      });

      const insertedRecipe = await testDb.insertTestRecipe(recipe);

      expect(insertedRecipe.id).toBeDefined();
      expect(insertedRecipe.name).toBe('Test Mojito');
      expect(insertedRecipe.category).toBe('cocktail');
      expect(insertedRecipe.glass).toBe(GlassType.HIGHBALL);
      expect(insertedRecipe.createdAt).toBeDefined();
      expect(insertedRecipe.updatedAt).toBeDefined();
    });

    it('should clear database successfully', async () => {
      // Insert a test recipe
      const recipe = createTestRecipe({ name: 'Test Recipe' });
      await testDb.insertTestRecipe(recipe);

      // Clear the database
      await testDb.clear();

      // Verify the database is empty
      const db = testDb.getDb()!;
      return new Promise<void>((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM recipes', (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            expect(row.count).toBe(0);
            resolve();
          }
        });
      });
    });

    it('should handle multiple recipe insertions', async () => {
      const recipe1 = createTestRecipe({ name: 'Recipe 1' });
      const recipe2 = createTestRecipe({ name: 'Recipe 2' });
      const recipe3 = createTestRecipe({ name: 'Recipe 3' });

      await testDb.insertTestRecipe(recipe1);
      await testDb.insertTestRecipe(recipe2);
      await testDb.insertTestRecipe(recipe3);

      // Verify all recipes were inserted
      const db = testDb.getDb()!;
      return new Promise<void>((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM recipes', (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            expect(row.count).toBe(3);
            resolve();
          }
        });
      });
    });

    it('should handle recipe with complex ingredients', async () => {
      const complexRecipe = createTestRecipe({
        name: 'Complex Cocktail',
        ingredients: [
          { id: 'ing1', name: 'Bourbon Whiskey', amount: 2, unit: 'oz' },
          { id: 'ing2', name: 'Sweet Vermouth', amount: 1, unit: 'oz' },
          { id: 'ing3', name: 'Angostura Bitters', amount: 2, unit: 'dashes' },
          { id: 'ing4', name: 'Simple Syrup', amount: 0.25, unit: 'oz' },
          { id: 'ing5', name: 'Orange Peel', amount: 1, unit: 'piece' },
        ],
        tags: ['classic', 'whiskey', 'stirred', 'strong']
      });

      const insertedRecipe = await testDb.insertTestRecipe(complexRecipe);

      expect(insertedRecipe.ingredients).toHaveLength(5);
      expect(insertedRecipe.ingredients[0].name).toBe('Bourbon Whiskey');
      expect(insertedRecipe.ingredients[4].name).toBe('Orange Peel');
      expect(insertedRecipe.tags).toContain('classic');
      expect(insertedRecipe.tags).toContain('whiskey');
    });

    it('should handle recipe with all optional fields', async () => {
      const fullRecipe = createTestRecipe({
        name: 'Full Featured Recipe',
        category: 'cocktail',
        glass: GlassType.NICK_AND_NORA,
        garnish: 'Lemon twist and cherry',
        instructions: 'Detailed mixing instructions with multiple steps',
        tags: ['premium', 'garnish', 'citrus', 'cherry']
      });

      const insertedRecipe = await testDb.insertTestRecipe(fullRecipe);

      expect(insertedRecipe.category).toBe('cocktail');
      expect(insertedRecipe.glass).toBe(GlassType.NICK_AND_NORA);
      expect(insertedRecipe.garnish).toBe('Lemon twist and cherry');
      expect(insertedRecipe.tags).toHaveLength(4);
    });

    it('should handle recipe with minimal required fields', async () => {
      const minimalRecipe = {
        name: 'Minimal Recipe',
        instructions: 'Simple instructions',
        ingredients: [
          { id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }
        ]
      };

      const insertedRecipe = await testDb.insertTestRecipe(minimalRecipe);

      expect(insertedRecipe.name).toBe('Minimal Recipe');
      expect(insertedRecipe.instructions).toBe('Simple instructions');
      expect(insertedRecipe.ingredients).toHaveLength(1);
      expect(insertedRecipe.category).toBe('cocktail'); // Default value
      expect(insertedRecipe.glass).toBe(GlassType.COUPE); // Default value
      expect(insertedRecipe.tags).toEqual([]); // Default value
    });
  });

  describe('Edge Cases', () => {
    it('should handle recipes with special characters in name', async () => {
      const recipeWithSpecialChars = createTestRecipe({
        name: "Piña Colada with \"Extra\" Rum & Coconut (Tropical!)",
        garnish: "Pineapple wedge & maraschino cherry"
      });

      const insertedRecipe = await testDb.insertTestRecipe(recipeWithSpecialChars);

      expect(insertedRecipe.name).toBe("Piña Colada with \"Extra\" Rum & Coconut (Tropical!)");
      expect(insertedRecipe.garnish).toBe("Pineapple wedge & maraschino cherry");
    });

    it('should handle recipes with very long instructions', async () => {
      const longInstructions = 'This is a very long set of instructions that might test the database\'s ability to handle large text fields. '.repeat(10);
      
      const recipe = createTestRecipe({
        name: 'Complex Recipe',
        instructions: longInstructions
      });

      const insertedRecipe = await testDb.insertTestRecipe(recipe);

      expect(insertedRecipe.instructions).toBe(longInstructions);
    });

    it('should handle recipes with decimal amounts in ingredients', async () => {
      const recipe = createTestRecipe({
        name: 'Precise Recipe',
        ingredients: [
          { id: 'ing1', name: 'Gin', amount: 2.25, unit: 'oz' },
          { id: 'ing2', name: 'Lemon Juice', amount: 0.75, unit: 'oz' },
          { id: 'ing3', name: 'Simple Syrup', amount: 0.5, unit: 'oz' },
        ]
      });

      const insertedRecipe = await testDb.insertTestRecipe(recipe);

      expect(insertedRecipe.ingredients[0].amount).toBe(2.25);
      expect(insertedRecipe.ingredients[1].amount).toBe(0.75);
      expect(insertedRecipe.ingredients[2].amount).toBe(0.5);
    });

    it('should handle empty tags array', async () => {
      const recipe = createTestRecipe({
        name: 'No Tags Recipe',
        tags: []
      });

      const insertedRecipe = await testDb.insertTestRecipe(recipe);

      expect(insertedRecipe.tags).toEqual([]);
    });
  });
});