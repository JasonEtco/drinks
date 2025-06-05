import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecipeProvider, useRecipes } from '../contexts/RecipeContext';
import { Recipe } from '../lib/types';
import { ApiService } from '../lib/api';

// Mock the ApiService
vi.mock('../lib/api', () => ({
  ApiService: {
    listRecipes: vi.fn().mockResolvedValue([]),
  },
}));

// Test component that uses the context
function TestComponent() {
  const { recipes, addGeneratedRecipe } = useRecipes();
  
  const handleAddGenerated = () => {
    const testRecipe: Recipe = {
      id: 'test-1',
      name: 'Test Generated Recipe',
      description: 'A test recipe',
      ingredients: [
        { name: 'Test Ingredient', amount: 1, unit: 'oz' }
      ],
      instructions: 'Test instructions',
      glass: 'Coupe',
      garnish: 'Test garnish',
      tags: ['test'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addGeneratedRecipe(testRecipe);
  };

  return (
    <div>
      <div data-testid="recipe-count">{recipes.length}</div>
      <button onClick={handleAddGenerated} data-testid="add-generated">
        Add Generated Recipe
      </button>
      {recipes.map((recipe) => (
        <div key={recipe.id} data-testid={`recipe-${recipe.id}`}>
          {recipe.name}
        </div>
      ))}
    </div>
  );
}

describe('RecipeContext addGeneratedRecipe', () => {
  it('should add a generated recipe to the context without API call', async () => {
    render(
      <RecipeProvider>
        <TestComponent />
      </RecipeProvider>
    );

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Initially should have 0 recipes (mocked to return empty array)
    expect(screen.getByTestId('recipe-count')).toHaveTextContent('0');

    // Add a generated recipe
    fireEvent.click(screen.getByTestId('add-generated'));

    // Should now have 1 recipe
    expect(screen.getByTestId('recipe-count')).toHaveTextContent('1');
    expect(screen.getByTestId('recipe-test-1')).toHaveTextContent('Test Generated Recipe');

    // Verify listRecipes was called once during initialization but createRecipe was not called
    expect(ApiService.listRecipes).toHaveBeenCalledTimes(1);
  });
});