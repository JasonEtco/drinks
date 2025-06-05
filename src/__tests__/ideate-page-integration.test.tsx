import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecipeProvider, useRecipes } from '../contexts/RecipeContext';
import { ApiService } from '../lib/api';
import { Recipe } from '../lib/types';

// Mock the ApiService
vi.mock('../lib/api', () => ({
  ApiService: {
    listRecipes: vi.fn().mockResolvedValue([]),
  },
}));

// Test the addGeneratedRecipe functionality directly
describe('IdeatePage recipe context integration', () => {
  it('should be able to add generated recipes from tool calls to context', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RecipeProvider>{children}</RecipeProvider>
    );

    const { result } = renderHook(() => useRecipes(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Initially should have 0 recipes
    expect(result.current.recipes).toHaveLength(0);

    // Simulate a recipe created via tool call in IdeatePage
    const toolCallRecipe: Recipe = {
      id: 'tool-recipe-1',
      name: 'AI Created Margarita',
      description: 'A margarita created by AI via tool call',
      ingredients: [
        { name: 'Tequila', amount: 2, unit: 'oz' },
        { name: 'Triple Sec', amount: 1, unit: 'oz' },
        { name: 'Lime Juice', amount: 1, unit: 'oz' }
      ],
      instructions: 'Shake with ice and strain into glass',
      glass: 'Margarita',
      garnish: 'Lime wheel',
      tags: ['ai-generated', 'tequila'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add the recipe using addGeneratedRecipe (simulating what IdeatePage would do)
    act(() => {
      result.current.addGeneratedRecipe(toolCallRecipe);
    });

    // Should now have 1 recipe in context
    expect(result.current.recipes).toHaveLength(1);
    expect(result.current.recipes[0]).toEqual(toolCallRecipe);
    expect(result.current.recipes[0].name).toBe('AI Created Margarita');
  });

  it('should handle multiple tool call recipes', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RecipeProvider>{children}</RecipeProvider>
    );

    const { result } = renderHook(() => useRecipes(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Add multiple recipes as if they came from different tool calls
    const recipe1: Recipe = {
      id: 'tool-1',
      name: 'AI Mojito',
      description: 'AI created mojito',
      ingredients: [{ name: 'Rum', amount: 2, unit: 'oz' }],
      instructions: 'Mix and serve',
      glass: 'Highball',
      garnish: 'Mint',
      tags: ['ai'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const recipe2: Recipe = {
      id: 'tool-2',
      name: 'AI Manhattan',
      description: 'AI created manhattan',
      ingredients: [{ name: 'Whiskey', amount: 2, unit: 'oz' }],
      instructions: 'Stir and serve',
      glass: 'Coupe',
      garnish: 'Cherry',
      tags: ['ai'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addGeneratedRecipe(recipe1);
      result.current.addGeneratedRecipe(recipe2);
    });

    expect(result.current.recipes).toHaveLength(2);
    expect(result.current.recipes.map(r => r.name)).toContain('AI Mojito');
    expect(result.current.recipes.map(r => r.name)).toContain('AI Manhattan');
  });
});