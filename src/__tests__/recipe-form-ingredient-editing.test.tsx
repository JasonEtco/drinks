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
    generateDescription: vi.fn().mockResolvedValue({ description: 'Generated description' }),
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
    { name: 'Simple Syrup', amount: 0.25, unit: 'oz' },
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

describe('RecipeForm Ingredient Editing', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display ingredients in read-only mode by default', () => {
    render(
      <TestWrapper>
        <RecipeForm
          initialRecipe={mockRecipe}
          onSubmit={mockOnSubmit}
          cancelLinkTo="/"
        />
      </TestWrapper>
    );

    // Check that ingredients are displayed in read-only format
    expect(screen.getByText('2 oz Gin')).toBeInTheDocument();
    expect(screen.getByText('0.5 oz Lemon Juice')).toBeInTheDocument();
    expect(screen.getByText('0.25 oz Simple Syrup')).toBeInTheDocument();

    // Check that edit buttons are present using test IDs
    expect(screen.getByTestId('edit-ingredient-Gin')).toBeInTheDocument();
    expect(screen.getByTestId('edit-ingredient-Lemon Juice')).toBeInTheDocument();
    expect(screen.getByTestId('edit-ingredient-Simple Syrup')).toBeInTheDocument();
  });

  it('should enter edit mode when edit button is clicked', async () => {
    render(
      <TestWrapper>
        <RecipeForm
          initialRecipe={mockRecipe}
          onSubmit={mockOnSubmit}
          cancelLinkTo="/"
        />
      </TestWrapper>
    );

    // Find and click the edit button for the Gin ingredient
    const editButton = screen.getByTestId('edit-ingredient-Gin');
    fireEvent.click(editButton);

    await waitFor(() => {
      // Should show ingredient name as read-only label
      expect(screen.getByText('Gin:')).toBeInTheDocument();
      
      // Should show amount input with current value
      const amountInput = screen.getByDisplayValue('2');
      expect(amountInput).toBeInTheDocument();
      expect(amountInput).toHaveAttribute('type', 'number');
      
      // Should show save and cancel buttons
      expect(screen.getByTestId('save-ingredient-Gin')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-edit-ingredient-Gin')).toBeInTheDocument();
    });
  });

  it('should save changes when save button is clicked with valid input', async () => {
    render(
      <TestWrapper>
        <RecipeForm
          initialRecipe={mockRecipe}
          onSubmit={mockOnSubmit}
          cancelLinkTo="/"
        />
      </TestWrapper>
    );

    // Enter edit mode for Gin ingredient
    const editButton = screen.getByTestId('edit-ingredient-Gin');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Gin:')).toBeInTheDocument();
    });

    // Change the amount
    const amountInput = screen.getByDisplayValue('2');
    fireEvent.change(amountInput, { target: { value: '2.5' } });

    // Save the changes
    const saveButton = screen.getByTestId('save-ingredient-Gin');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Should exit edit mode and show updated ingredient
      expect(screen.getByText('2.5 oz Gin')).toBeInTheDocument();
      expect(screen.queryByText('Gin:')).not.toBeInTheDocument();
    });
  });

  it('should cancel editing when cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <RecipeForm
          initialRecipe={mockRecipe}
          onSubmit={mockOnSubmit}
          cancelLinkTo="/"
        />
      </TestWrapper>
    );

    // Enter edit mode for Gin ingredient
    const editButton = screen.getByTestId('edit-ingredient-Gin');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Gin:')).toBeInTheDocument();
    });

    // Change the amount
    const amountInput = screen.getByDisplayValue('2');
    fireEvent.change(amountInput, { target: { value: '3' } });

    // Cancel the changes
    const cancelButton = screen.getByTestId('cancel-edit-ingredient-Gin');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      // Should exit edit mode and show original ingredient unchanged
      expect(screen.getByText('2 oz Gin')).toBeInTheDocument();
      expect(screen.queryByText('Gin:')).not.toBeInTheDocument();
    });
  });

  it('should show error for invalid amount input', async () => {
    const { toast } = await import('sonner');
    
    render(
      <TestWrapper>
        <RecipeForm
          initialRecipe={mockRecipe}
          onSubmit={mockOnSubmit}
          cancelLinkTo="/"
        />
      </TestWrapper>
    );

    // Enter edit mode for Gin ingredient
    const editButton = screen.getByTestId('edit-ingredient-Gin');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Gin:')).toBeInTheDocument();
    });

    // Enter invalid amount
    const amountInput = screen.getByDisplayValue('2');
    fireEvent.change(amountInput, { target: { value: '0' } });

    // Try to save
    const saveButton = screen.getByTestId('save-ingredient-Gin');
    fireEvent.click(saveButton);

    // Should show error toast
    expect(toast.error).toHaveBeenCalledWith('Please enter a valid amount');

    // Should remain in edit mode
    expect(screen.getByText('Gin:')).toBeInTheDocument();
  });

  it('should preserve ingredient editing when form is submitted', async () => {
    render(
      <TestWrapper>
        <RecipeForm
          initialRecipe={mockRecipe}
          onSubmit={mockOnSubmit}
          cancelLinkTo="/"
        />
      </TestWrapper>
    );

    // Edit the Gin ingredient
    const editButton = screen.getByTestId('edit-ingredient-Gin');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Gin:')).toBeInTheDocument();
    });

    // Change amount to 1.5
    const amountInput = screen.getByDisplayValue('2');
    fireEvent.change(amountInput, { target: { value: '1.5' } });

    // Save changes
    const saveButton = screen.getByTestId('save-ingredient-Gin');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('1.5 oz Gin')).toBeInTheDocument();
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    // Verify the modified ingredient is included in the submitted recipe
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: expect.arrayContaining([
            expect.objectContaining({
              name: 'Gin',
              amount: 1.5,
              unit: 'oz'
            })
          ])
        })
      );
    });
  });
});