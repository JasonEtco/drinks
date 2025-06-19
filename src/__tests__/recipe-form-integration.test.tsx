import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RecipeForm from '../components/RecipeForm';
import { Recipe, GlassType } from '../lib/types';
import { RecipeProvider } from '../contexts/RecipeContext';
import { ApiService } from '../lib/api';

// Mock the ApiService
vi.mock('../lib/api', () => ({
  ApiService: {
    listRecipes: vi.fn().mockResolvedValue([]),
  },
}));

// Mock sonner toast notifications
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockRecipe: Recipe = {
  id: 'test-recipe',
  name: 'Test Cocktail',
  description: 'A test cocktail',
  ingredients: [
    { name: 'Gin', amount: 2, unit: 'oz' },
    { name: 'Lemon Juice', amount: 0.5, unit: 'oz' },
  ],
  instructions: 'Shake with ice, strain into coupe',
  glass: GlassType.COUPE,
  garnish: 'Lemon twist',
  tags: ['citrus', 'classic'],
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <RecipeProvider>
      {children}
    </RecipeProvider>
  </MemoryRouter>
);

describe('RecipeForm Complete Workflow Integration', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should support full workflow: view -> edit -> save -> edit different ingredient -> save -> submit', async () => {
    render(
      <TestWrapper>
        <RecipeForm
          initialRecipe={mockRecipe}
          onSubmit={mockOnSubmit}
          cancelLinkTo="/"
        />
      </TestWrapper>
    );

    // Step 1: Verify initial state
    expect(screen.getByText('2 oz Gin')).toBeInTheDocument();
    expect(screen.getByText('0.5 oz Lemon Juice')).toBeInTheDocument();

    // Step 2: Edit first ingredient (Gin)
    fireEvent.click(screen.getByTestId('edit-ingredient-Gin'));
    
    await waitFor(() => {
      expect(screen.getByText('Gin:')).toBeInTheDocument();
    });

    // Change amount from 2 to 1.5
    const ginAmountInput = screen.getByDisplayValue('2');
    fireEvent.change(ginAmountInput, { target: { value: '1.5' } });

    // Save first ingredient
    fireEvent.click(screen.getByTestId('save-ingredient-Gin'));

    await waitFor(() => {
      expect(screen.getByText('1.5 oz Gin')).toBeInTheDocument();
      expect(screen.queryByText('Gin:')).not.toBeInTheDocument();
    });

    // Step 3: Edit second ingredient (Lemon Juice)
    fireEvent.click(screen.getByTestId('edit-ingredient-Lemon Juice'));
    
    await waitFor(() => {
      expect(screen.getByText('Lemon Juice:')).toBeInTheDocument();
    });

    // Change amount from 0.5 to 0.75
    const lemonAmountInput = screen.getByDisplayValue('0.5');
    fireEvent.change(lemonAmountInput, { target: { value: '0.75' } });

    // Save second ingredient (keeping original unit)
    fireEvent.click(screen.getByTestId('save-ingredient-Lemon Juice'));

    await waitFor(() => {
      expect(screen.getByText('0.75 oz Lemon Juice')).toBeInTheDocument();
      expect(screen.queryByText('Lemon Juice:')).not.toBeInTheDocument();
    });

    // Step 4: Submit the form with edited ingredients
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    // Step 5: Verify the form submission includes both edits
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: expect.arrayContaining([
            expect.objectContaining({
              name: 'Gin',
              amount: 1.5,
              unit: 'oz'
            }),
            expect.objectContaining({
              name: 'Lemon Juice',
              amount: 0.75,
              unit: 'oz'
            })
          ])
        })
      );
    });
  });

  it('should handle cancelling one edit while preserving another', async () => {
    render(
      <TestWrapper>
        <RecipeForm
          initialRecipe={mockRecipe}
          onSubmit={mockOnSubmit}
          cancelLinkTo="/"
        />
      </TestWrapper>
    );

    // Edit first ingredient and save
    fireEvent.click(screen.getByTestId('edit-ingredient-Gin'));
    
    await waitFor(() => {
      expect(screen.getByText('Gin:')).toBeInTheDocument();
    });

    const ginAmountInput = screen.getByDisplayValue('2');
    fireEvent.change(ginAmountInput, { target: { value: '1.5' } });

    fireEvent.click(screen.getByTestId('save-ingredient-Gin'));

    await waitFor(() => {
      expect(screen.getByText('1.5 oz Gin')).toBeInTheDocument();
    });

    // Edit second ingredient but cancel
    fireEvent.click(screen.getByTestId('edit-ingredient-Lemon Juice'));
    
    await waitFor(() => {
      expect(screen.getByText('Lemon Juice:')).toBeInTheDocument();
    });

    const lemonAmountInput = screen.getByDisplayValue('0.5');
    fireEvent.change(lemonAmountInput, { target: { value: '2' } });

    // Cancel the edit
    fireEvent.click(screen.getByTestId('cancel-edit-ingredient-Lemon Juice'));

    await waitFor(() => {
      // Should preserve first edit but not second
      expect(screen.getByText('1.5 oz Gin')).toBeInTheDocument();
      expect(screen.getByText('0.5 oz Lemon Juice')).toBeInTheDocument(); // Original unchanged
      expect(screen.queryByText('Lemon Juice:')).not.toBeInTheDocument();
    });

    // Submit and verify only first edit is preserved
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: expect.arrayContaining([
            expect.objectContaining({
              name: 'Gin',
              amount: 1.5, // Changed
              unit: 'oz'
            }),
            expect.objectContaining({
              name: 'Lemon Juice',
              amount: 0.5, // Original
              unit: 'oz'
            })
          ])
        })
      );
    });
  });
});