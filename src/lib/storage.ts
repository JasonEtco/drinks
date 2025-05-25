import { Recipe } from './types';

const API_BASE_URL = '/api';

// Helper function to handle API requests
const apiRequest = async (url: string, options: RequestInit = {}): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Save recipes (not used directly anymore, but kept for compatibility)
export const saveRecipes = async (recipes: Recipe[]): Promise<void> => {
  // This function is now handled by individual add/update operations
  console.warn('saveRecipes is deprecated, use individual operations instead');
};

// Load recipes from API
export const loadRecipes = async (): Promise<Recipe[]> => {
  try {
    const recipes = await apiRequest('/recipes');
    return recipes || [];
  } catch (error) {
    console.error('Error loading recipes:', error);
    return [];
  }
};

// Add a new recipe
export const addRecipe = async (recipe: Recipe): Promise<boolean> => {
  try {
    await apiRequest('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
    return true;
  } catch (error) {
    console.error('Error adding recipe:', error);
    return false;
  }
};

// Update an existing recipe
export const updateRecipe = async (updatedRecipe: Recipe): Promise<boolean> => {
  try {
    const recipeWithTimestamp = {
      ...updatedRecipe,
      updated: new Date().toISOString()
    };
    
    await apiRequest(`/recipes/${updatedRecipe.id}`, {
      method: 'PUT',
      body: JSON.stringify(recipeWithTimestamp),
    });
    return true;
  } catch (error) {
    console.error('Error updating recipe:', error);
    return false;
  }
};

// Delete a recipe
export const deleteRecipe = async (recipeId: string): Promise<boolean> => {
  try {
    await apiRequest(`/recipes/${recipeId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return false;
  }
};

// Get a recipe by ID
export const getRecipeById = async (recipeId: string): Promise<Recipe | null> => {
  try {
    const recipe = await apiRequest(`/recipes/${recipeId}`);
    return recipe;
  } catch (error) {
    console.error('Error getting recipe:', error);
    return null;
  }
};

// Export recipes to JSON file
export const exportRecipes = async (): Promise<void> => {
  try {
    const recipes = await loadRecipes();
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cocktail-recipes-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  } catch (error) {
    console.error('Error exporting recipes:', error);
  }
};

// Import recipes from JSON file
export const importRecipes = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject('Invalid file format');
          return;
        }
        
        const importedRecipes = JSON.parse(result) as Recipe[];
        
        // Use the import API endpoint
        await apiRequest('/recipes/import', {
          method: 'POST',
          body: JSON.stringify({ recipes: importedRecipes }),
        });
        
        resolve(true);
      } catch (error) {
        console.error('Error parsing imported recipes:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject('Error reading file');
    };
    
    reader.readAsText(file);
  });
};