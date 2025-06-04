#!/usr/bin/env node

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRecipeTool, editRecipeTool } from '../lib/mcp-tools.js';
import { TestDatabase } from './test-utils.js';
import { GlassType } from '../lib/types.js';
import { database } from '../lib/database.js';

// Mock the database module to use test database
const testDb = new TestDatabase();

// Mock the database singleton
beforeEach(async () => {
  await testDb.connect();
  await testDb.initialize();
  // Replace the database instance for testing
  (database as any).db = testDb.getDb();
});

afterEach(async () => {
  await testDb.clear();
  await testDb.close();
});

describe('MCP Tools - Create Recipe', () => {
  it('should successfully create a new recipe with all required fields', async () => {
    const result = await createRecipeTool.execute({
      name: 'Test Margarita',
      ingredients: [
        { name: 'Tequila', amount: 2, unit: 'oz' },
        { name: 'Lime juice', amount: 1, unit: 'oz' },
        { name: 'Cointreau', amount: 1, unit: 'oz' }
      ],
      instructions: 'Shake with ice and strain into glass',
      glass: GlassType.COUPE,
      garnish: 'Lime wheel',
      category: 'cocktail',
      tags: ['citrus', 'classic']
    });

    expect(result.success).toBe(true);
    expect(result.recipe).toBeDefined();
    expect(result.recipe!.name).toBe('Test Margarita');
    expect(result.recipe!.ingredients).toHaveLength(3);
    expect(result.recipe!.ingredients[0].name).toBe('Tequila');
    expect(result.recipe!.ingredients[0].amount).toBe(2);
    expect(result.recipe!.ingredients[0].unit).toBe('oz');
    expect(result.recipe!.glass).toBe(GlassType.COUPE);
    expect(result.recipe!.garnish).toBe('Lime wheel');
    expect(result.recipe!.category).toBe('cocktail');
    expect(result.recipe!.tags).toEqual(['citrus', 'classic']);
    expect(result.message).toContain('Successfully created recipe');
  });

  it('should successfully create a recipe with minimal required fields', async () => {
    const result = await createRecipeTool.execute({
      name: 'Simple Cocktail',
      ingredients: [
        { name: 'Vodka', amount: 2, unit: 'oz' }
      ],
      instructions: 'Serve neat'
    });

    expect(result.success).toBe(true);
    expect(result.recipe).toBeDefined();
    expect(result.recipe!.name).toBe('Simple Cocktail');
    expect(result.recipe!.ingredients).toHaveLength(1);
    expect(result.recipe!.instructions).toBe('Serve neat');
    expect(result.recipe!.tags).toEqual([]);
  });

  it('should handle missing required name field', async () => {
    const result = await createRecipeTool.execute({
      name: '',
      ingredients: [
        { name: 'Vodka', amount: 2, unit: 'oz' }
      ],
      instructions: 'Serve neat'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Recipe name is required');
    expect(result.message).toContain('Failed to create recipe');
  });

  it('should handle empty ingredients array', async () => {
    const result = await createRecipeTool.execute({
      name: 'Empty Recipe',
      ingredients: [],
      instructions: 'No ingredients'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('At least one ingredient is required');
    expect(result.message).toContain('Failed to create recipe');
  });

  it('should handle missing instructions', async () => {
    const result = await createRecipeTool.execute({
      name: 'No Instructions',
      ingredients: [
        { name: 'Vodka', amount: 2, unit: 'oz' }
      ],
      instructions: ''
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Instructions are required');
    expect(result.message).toContain('Failed to create recipe');
  });

  it('should handle invalid ingredient amount', async () => {
    const result = await createRecipeTool.execute({
      name: 'Invalid Amount',
      ingredients: [
        { name: 'Vodka', amount: -1, unit: 'oz' }
      ],
      instructions: 'Serve neat'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Ingredient amount must be positive');
    expect(result.message).toContain('Failed to create recipe');
  });

  it('should assign unique IDs to ingredients', async () => {
    const result = await createRecipeTool.execute({
      name: 'ID Test Recipe',
      ingredients: [
        { name: 'Vodka', amount: 2, unit: 'oz' },
        { name: 'Lime juice', amount: 1, unit: 'oz' }
      ],
      instructions: 'Mix and serve'
    });

    expect(result.success).toBe(true);
    expect(result.recipe!.ingredients).toHaveLength(2);
    expect(result.recipe!.ingredients[0].id).toBeDefined();
    expect(result.recipe!.ingredients[1].id).toBeDefined();
    expect(result.recipe!.ingredients[0].id).not.toBe(result.recipe!.ingredients[1].id);
  });
});

describe('MCP Tools - Edit Recipe', () => {
  let testRecipeId: string;

  beforeEach(async () => {
    // Create a test recipe to edit
    const testRecipe = await testDb.insertTestRecipe({
      name: 'Original Recipe',
      instructions: 'Original instructions',
      ingredients: [
        { id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }
      ],
      glass: GlassType.ROCKS,
      garnish: 'Original garnish',
      category: 'cocktail',
      tags: ['original']
    });
    testRecipeId = testRecipe.id;
  });

  it('should successfully edit recipe name', async () => {
    const result = await editRecipeTool.execute({
      id: testRecipeId,
      name: 'Updated Recipe Name'
    });

    expect(result.success).toBe(true);
    expect(result.recipe).toBeDefined();
    expect(result.recipe!.name).toBe('Updated Recipe Name');
    expect(result.recipe!.instructions).toBe('Original instructions'); // Should remain unchanged
    expect(result.message).toContain('Successfully updated recipe');
  });

  it('should successfully edit recipe instructions', async () => {
    const result = await editRecipeTool.execute({
      id: testRecipeId,
      instructions: 'New preparation method'
    });

    expect(result.success).toBe(true);
    expect(result.recipe!.instructions).toBe('New preparation method');
    expect(result.recipe!.name).toBe('Original Recipe'); // Should remain unchanged
  });

  it('should successfully edit recipe ingredients', async () => {
    const result = await editRecipeTool.execute({
      id: testRecipeId,
      ingredients: [
        { name: 'Gin', amount: 2.5, unit: 'oz' },
        { name: 'Tonic', amount: 4, unit: 'oz' }
      ]
    });

    expect(result.success).toBe(true);
    expect(result.recipe!.ingredients).toHaveLength(2);
    expect(result.recipe!.ingredients[0].name).toBe('Gin');
    expect(result.recipe!.ingredients[0].amount).toBe(2.5);
    expect(result.recipe!.ingredients[1].name).toBe('Tonic');
    // Verify new IDs are assigned
    expect(result.recipe!.ingredients[0].id).toBeDefined();
    expect(result.recipe!.ingredients[1].id).toBeDefined();
  });

  it('should successfully edit multiple fields at once', async () => {
    const result = await editRecipeTool.execute({
      id: testRecipeId,
      name: 'Completely Updated Recipe',
      instructions: 'New instructions',
      glass: GlassType.MARTINI,
      garnish: 'New garnish',
      category: 'updated',
      tags: ['new', 'updated']
    });

    expect(result.success).toBe(true);
    expect(result.recipe!.name).toBe('Completely Updated Recipe');
    expect(result.recipe!.instructions).toBe('New instructions');
    expect(result.recipe!.glass).toBe(GlassType.MARTINI);
    expect(result.recipe!.garnish).toBe('New garnish');
    expect(result.recipe!.category).toBe('updated');
    expect(result.recipe!.tags).toEqual(['new', 'updated']);
  });

  it('should handle non-existent recipe ID', async () => {
    const result = await editRecipeTool.execute({
      id: 'non-existent-id',
      name: 'Should not work'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Recipe with ID non-existent-id not found');
    expect(result.message).toContain('Cannot edit recipe: Recipe not found');
  });

  it('should handle empty recipe ID', async () => {
    const result = await editRecipeTool.execute({
      id: '',
      name: 'Should not work'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Recipe ID is required');
    expect(result.message).toContain('Failed to edit recipe');
  });

  it('should handle invalid field values', async () => {
    const result = await editRecipeTool.execute({
      id: testRecipeId,
      name: '', // Empty name should fail
      instructions: 'Valid instructions'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Recipe name is required');
    expect(result.message).toContain('Failed to edit recipe');
  });

  it('should handle invalid ingredient amounts in edit', async () => {
    const result = await editRecipeTool.execute({
      id: testRecipeId,
      ingredients: [
        { name: 'Vodka', amount: -5, unit: 'oz' } // Negative amount
      ]
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Ingredient amount must be positive');
    expect(result.message).toContain('Failed to edit recipe');
  });

  it('should handle edit with no changes provided', async () => {
    const result = await editRecipeTool.execute({
      id: testRecipeId
      // No updates provided
    });

    expect(result.success).toBe(true);
    expect(result.recipe!.name).toBe('Original Recipe'); // Should remain unchanged
    expect(result.message).toContain('Successfully updated recipe');
  });
});

describe('MCP Tools - Integration', () => {
  it('should be able to create and then edit a recipe', async () => {
    // First create a recipe
    const createResult = await createRecipeTool.execute({
      name: 'Integration Test Recipe',
      ingredients: [
        { name: 'Vodka', amount: 2, unit: 'oz' }
      ],
      instructions: 'Original instructions'
    });

    expect(createResult.success).toBe(true);
    const recipeId = createResult.recipe!.id;

    // Then edit the recipe
    const editResult = await editRecipeTool.execute({
      id: recipeId,
      name: 'Edited Integration Recipe',
      ingredients: [
        { name: 'Gin', amount: 2.5, unit: 'oz' },
        { name: 'Tonic', amount: 4, unit: 'oz' }
      ]
    });

    expect(editResult.success).toBe(true);
    expect(editResult.recipe!.name).toBe('Edited Integration Recipe');
    expect(editResult.recipe!.ingredients).toHaveLength(2);
    expect(editResult.recipe!.ingredients[0].name).toBe('Gin');
  });
});