import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Recipe, Ingredient } from '../lib/types';
import { loadRecipes, saveRecipes, addRecipe, updateRecipe, deleteRecipe } from '../lib/storage';
import { getUniqueIngredients } from '../lib/recipe-utils';

interface RecipeContextType {
  recipes: Recipe[];
  addNewRecipe: (recipe: Recipe) => void;
  updateExistingRecipe: (recipe: Recipe) => void;
  removeRecipe: (recipeId: string) => void;
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
    const loadInitialRecipes = () => {
      setIsLoading(true);
      const loadedRecipes = loadRecipes();
      setRecipes(loadedRecipes);
      setUniqueIngredients(getUniqueIngredients(loadedRecipes));
      setIsLoading(false);
    };
    
    loadInitialRecipes();
  }, []);
  
  const addNewRecipe = (recipe: Recipe) => {
    addRecipe(recipe);
    setRecipes(prevRecipes => [...prevRecipes, recipe]);
    setUniqueIngredients(getUniqueIngredients([...recipes, recipe]));
  };
  
  const updateExistingRecipe = (recipe: Recipe) => {
    updateRecipe(recipe);
    setRecipes(prevRecipes => 
      prevRecipes.map(r => r.id === recipe.id ? recipe : r)
    );
    setUniqueIngredients(getUniqueIngredients([
      ...recipes.filter(r => r.id !== recipe.id),
      recipe
    ]));
  };
  
  const removeRecipe = (recipeId: string) => {
    deleteRecipe(recipeId);
    setRecipes(prevRecipes => prevRecipes.filter(r => r.id !== recipeId));
    setUniqueIngredients(getUniqueIngredients(
      recipes.filter(r => r.id !== recipeId)
    ));
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