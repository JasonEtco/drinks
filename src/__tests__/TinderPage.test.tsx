import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TinderPage from '../pages/TinderPage';
import { useRecipes } from '../contexts/RecipeContext';
import { ApiService } from '../lib/api';
import { Recipe } from '../lib/types';

// Mock the dependencies
vi.mock('../contexts/RecipeContext');
vi.mock('../lib/api');

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Test Cocktail 1',
    description: 'A test cocktail',
    ingredients: [
      { name: 'Vodka', amount: 2, unit: 'oz' },
      { name: 'Lime Juice', amount: 0.5, unit: 'oz' }
    ],
    instructions: 'Shake and strain',
    tags: ['vodka', 'citrus'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Test Cocktail 2',
    description: 'Another test cocktail',
    ingredients: [
      { name: 'Gin', amount: 2, unit: 'oz' },
      { name: 'Tonic', amount: 4, unit: 'oz' }
    ],
    instructions: 'Build in glass',
    tags: ['gin', 'refreshing'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

describe('TinderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useRecipes hook
    (useRecipes as any).mockReturnValue({
      recipes: mockRecipes,
      isLoading: false
    });
    
    // Mock ApiService
    (ApiService.generateRecipeFromLikes as any).mockResolvedValue({
      id: '3',
      name: 'Generated Cocktail',
      description: 'AI generated cocktail',
      ingredients: [
        { name: 'Whiskey', amount: 2, unit: 'oz' },
        { name: 'Sweet Vermouth', amount: 1, unit: 'oz' }
      ],
      instructions: 'Stir with ice and strain',
      tags: ['whiskey', 'classic'],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    });
  });

  it('should be a valid React component', () => {
    expect(TinderPage).toBeDefined();
    expect(typeof TinderPage).toBe('function');
  });

  it('should export the component properly', () => {
    expect(TinderPage.name).toBe('TinderPage');
  });

  it('should render without crashing', () => {
    render(<TinderPage />);
    expect(screen.getByText('Drink Tinder')).toBeInTheDocument();
  });

  it('should show generate button after liking recipes', () => {
    render(<TinderPage />);
    
    // Initially, the generate button should not be visible
    expect(screen.queryByText(/Generate Recipe from Likes/)).not.toBeInTheDocument();
    
    // Like a recipe by clicking the green heart button (second button)
    const buttons = screen.getAllByRole('button');
    const heartButton = buttons[1]; // The green heart button is the second button
    fireEvent.click(heartButton);
    
    // Now the generate button should be visible
    expect(screen.getByText(/Generate Recipe from Likes/)).toBeInTheDocument();
  });

  it('should call API to generate recipe when button is clicked', async () => {
    render(<TinderPage />);
    
    // Like a recipe first
    const buttons = screen.getAllByRole('button');
    const heartButton = buttons[1]; // The green heart button is the second button
    fireEvent.click(heartButton);
    
    // Click the generate button
    const generateButton = screen.getByText(/Generate Recipe from Likes/);
    fireEvent.click(generateButton);
    
    // Wait for the API call - note that due to shuffling, we can't predict exact ID
    await waitFor(() => {
      expect(ApiService.generateRecipeFromLikes).toHaveBeenCalledTimes(1);
      const [likedIds, passedIds] = (ApiService.generateRecipeFromLikes as any).mock.calls[0];
      expect(likedIds).toHaveLength(1);
      expect(passedIds).toEqual([]);
    });
  });

  it('should show generating state when generating recipe', async () => {
    // Make the API call take some time
    (ApiService.generateRecipeFromLikes as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        id: '3',
        name: 'Generated Cocktail',
        description: 'AI generated cocktail',
        ingredients: [],
        instructions: 'Test',
        tags: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }), 100))
    );
    
    render(<TinderPage />);
    
    // Like a recipe first
    const buttons = screen.getAllByRole('button');
    const heartButton = buttons[1]; // The green heart button is the second button
    fireEvent.click(heartButton);
    
    // Click the generate button
    const generateButton = screen.getByText(/Generate Recipe from Likes/);
    fireEvent.click(generateButton);
    
    // Should show generating state
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });
});