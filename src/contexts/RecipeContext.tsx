import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Recipe, Ingredient } from '../lib/types';
import { loadRecipes, saveRecipes, addRecipe, updateRecipe, deleteRecipe } from '../lib/storage';
import { getUniqueIngredients } from '../lib/recipe-utils';

interface RecipeContextType {
  recipes: Recipe[];
  addNewRecipe: (recipe: Recipe) => Promise<void>;
  updateExistingRecipe: (recipe: Recipe) => Promise<void>;
  removeRecipe: (recipeId: string) => Promise<void>;
  getRecipe: (recipeId: string) => Recipe | undefined;
  uniqueIngredients: string[];
  isLoading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [uniqueIngredients, setUniqueIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recipes on mount
  useEffect(() => {
    const loadInitialRecipes = async () => {
      setIsLoading(true);
      try {
        const loadedRecipes = await loadRecipes();
        setRecipes(loadedRecipes);
        setUniqueIngredients(getUniqueIngredients(loadedRecipes));
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialRecipes();
  }, []);
  
  const addNewRecipe = async (recipe: Recipe) => {
    try {
      const success = await addRecipe(recipe);
      if (success) {
        setRecipes(prevRecipes => [...prevRecipes, recipe]);
        setUniqueIngredients(getUniqueIngredients([...recipes, recipe]));
      }
    } catch (error) {
      console.error('Failed to add recipe:', error);
      throw error;
    }
  };
  
  const updateExistingRecipe = async (recipe: Recipe) => {
    try {
      const success = await updateRecipe(recipe);
      if (success) {
        setRecipes(prevRecipes => 
          prevRecipes.map(r => r.id === recipe.id ? recipe : r)
        );
        setUniqueIngredients(getUniqueIngredients([
          ...recipes.filter(r => r.id !== recipe.id),
          recipe
        ]));
      }
    } catch (error) {
      console.error('Failed to update recipe:', error);
      throw error;
    }
  };
  
  const removeRecipe = async (recipeId: string) => {
    try {
      const success = await deleteRecipe(recipeId);
      if (success) {
        setRecipes(prevRecipes => prevRecipes.filter(r => r.id !== recipeId));
        setUniqueIngredients(getUniqueIngredients(
          recipes.filter(r => r.id !== recipeId)
        ));
      }
    } catch (error) {
      console.error('Failed to remove recipe:', error);
      throw error;
    }
  };
  
  const getRecipe = (recipeId: string) => {
    return recipes.find(r => r.id === recipeId);
  };
  
  const value = {
    recipes,
    addNewRecipe,
    updateExistingRecipe,
    removeRecipe,
    getRecipe,
    uniqueIngredients,
    isLoading
  };
  
  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};