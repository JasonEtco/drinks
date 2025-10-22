import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RecipePage from '../pages/RecipePage';
import { RecipeProvider } from '../contexts/RecipeContext';
import { ApiService } from '../lib/api';
import { Recipe, GlassType } from '../lib/types';

// Mock the ApiService
vi.mock('../lib/api', () => ({
  ApiService: {
    listRecipes: vi.fn(),
    getRecipe: vi.fn(),
  },
}));

const mockRecipe: Recipe = {
  id: 'test-recipe-123',
  name: 'Test Margarita',
  description: 'A delicious test margarita',
  ingredients: [
    { name: 'Tequila', amount: 2, unit: 'oz' },
    { name: 'Cointreau', amount: 1, unit: 'oz' },
    { name: 'Lime juice', amount: 1, unit: 'oz' },
  ],
  instructions: 'Shake all ingredients with ice and strain.',
  glass: GlassType.COUPE,
  garnish: 'Lime wheel',
  tags: ['classic', 'citrus'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('RecipePage direct loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load recipe directly from API when not in context', async () => {
    // Mock listRecipes to return empty array (recipe not in context)
    vi.mocked(ApiService.listRecipes).mockResolvedValue([]);
    
    // Mock getRecipe to return the specific recipe
    vi.mocked(ApiService.getRecipe).mockResolvedValue(mockRecipe);

    render(
      <MemoryRouter initialEntries={['/recipes/test-recipe-123']}>
        <RecipeProvider>
          <Routes>
            <Route path="/recipes/:id" element={<RecipePage />} />
          </Routes>
        </RecipeProvider>
      </MemoryRouter>
    );

    // Wait for loading to complete and recipe to appear
    await waitFor(() => {
      expect(screen.getByText('Test Margarita')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the recipe details are displayed
    expect(screen.getByText('Test Margarita')).toBeInTheDocument();
    expect(screen.getByText('A delicious test margarita')).toBeInTheDocument();
    expect(screen.getByText('Tequila')).toBeInTheDocument();
    expect(screen.getByText('Cointreau')).toBeInTheDocument();
    expect(screen.getByText('Lime juice')).toBeInTheDocument();

    // Verify API calls
    expect(ApiService.listRecipes).toHaveBeenCalledTimes(1);
    expect(ApiService.getRecipe).toHaveBeenCalledWith('test-recipe-123');
  });

  it('should show loading state while fetching recipe', async () => {
    // Mock listRecipes to return empty array
    vi.mocked(ApiService.listRecipes).mockResolvedValue([]);
    
    // Mock getRecipe with delay to simulate loading
    vi.mocked(ApiService.getRecipe).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockRecipe), 100))
    );

    render(
      <MemoryRouter initialEntries={['/recipes/test-recipe-123']}>
        <RecipeProvider>
          <Routes>
            <Route path="/recipes/:id" element={<RecipePage />} />
          </Routes>
        </RecipeProvider>
      </MemoryRouter>
    );

    // Should show loading spinner initially
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    // Wait for recipe to load
    await waitFor(() => {
      expect(screen.getByText('Test Margarita')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show not found message when recipe does not exist', async () => {
    // Mock listRecipes to return empty array
    vi.mocked(ApiService.listRecipes).mockResolvedValue([]);
    
    // Mock getRecipe to throw error (recipe not found)
    vi.mocked(ApiService.getRecipe).mockRejectedValue(
      new Error('Recipe not found')
    );

    render(
      <MemoryRouter initialEntries={['/recipes/non-existent-recipe']}>
        <RecipeProvider>
          <Routes>
            <Route path="/recipes/:id" element={<RecipePage />} />
          </Routes>
        </RecipeProvider>
      </MemoryRouter>
    );

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Recipe Not Found')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText("The recipe you're looking for doesn't exist.")).toBeInTheDocument();
  });

  it('should use recipe from context when available', async () => {
    // Mock listRecipes to return recipe in context
    vi.mocked(ApiService.listRecipes).mockResolvedValue([mockRecipe]);
    
    // getRecipe should NOT be called when recipe is in context
    vi.mocked(ApiService.getRecipe).mockResolvedValue(mockRecipe);

    render(
      <MemoryRouter initialEntries={['/recipes/test-recipe-123']}>
        <RecipeProvider>
          <Routes>
            <Route path="/recipes/:id" element={<RecipePage />} />
          </Routes>
        </RecipeProvider>
      </MemoryRouter>
    );

    // Wait for recipe to appear
    await waitFor(() => {
      expect(screen.getByText('Test Margarita')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the recipe is displayed
    expect(screen.getByText('Test Margarita')).toBeInTheDocument();

    // Verify listRecipes was called but getRecipe was NOT called
    expect(ApiService.listRecipes).toHaveBeenCalledTimes(1);
    expect(ApiService.getRecipe).not.toHaveBeenCalled();
  });
});
