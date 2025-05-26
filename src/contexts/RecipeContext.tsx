import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { Recipe, Ingredient } from "../lib/types";
import { ApiService } from "../lib/api";
import { getUniqueIngredients } from "../lib/recipe-utils";

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

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [uniqueIngredients, setUniqueIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recipes on mount
  useEffect(() => {
    const loadInitialRecipes = async () => {
      setIsLoading(true);
      try {
        const loadedRecipes = await ApiService.getAllRecipes();
        setRecipes(loadedRecipes);
        setUniqueIngredients(getUniqueIngredients(loadedRecipes));
      } catch (error) {
        console.error("Error loading recipes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialRecipes();
  }, []);

  const addNewRecipe = async (
    recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const newRecipe = await ApiService.createRecipe(recipe);
      setRecipes((prevRecipes) => [...prevRecipes, newRecipe]);
      setUniqueIngredients(getUniqueIngredients([...recipes, newRecipe]));
      return newRecipe;
    } catch (error) {
      console.error("Error adding recipe:", error);
      throw error;
    }
  };

  const updateExistingRecipe = async (recipe: Recipe) => {
    try {
      const updatedRecipe = await ApiService.updateRecipe(recipe.id, recipe);
      setRecipes((prevRecipes) =>
        prevRecipes.map((r) => (r.id === recipe.id ? updatedRecipe : r))
      );
      setUniqueIngredients(
        getUniqueIngredients([
          ...recipes.filter((r) => r.id !== recipe.id),
          updatedRecipe,
        ])
      );
      return updatedRecipe;
    } catch (error) {
      console.error("Error updating recipe:", error);
      throw error;
    }
  };

  const removeRecipe = async (recipeId: string) => {
    try {
      await ApiService.deleteRecipe(recipeId);
      setRecipes((prevRecipes) => prevRecipes.filter((r) => r.id !== recipeId));
      setUniqueIngredients(
        getUniqueIngredients(recipes.filter((r) => r.id !== recipeId))
      );
    } catch (error) {
      console.error("Error deleting recipe:", error);
      throw error;
    }
  };

  const getRecipe = (recipeId: string) => {
    return recipes.find((r) => r.id === recipeId);
  };

  const value = {
    recipes,
    addNewRecipe,
    updateExistingRecipe,
    removeRecipe,
    getRecipe,
    uniqueIngredients,
    isLoading,
  };

  return (
    <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>
  );
};

export const useRecipes = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
};
