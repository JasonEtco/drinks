import { Recipe } from "./types";
import type { UIMessage } from "ai";

const RECIPES_KEY = "cocktail-recipes";
const CHAT_HISTORY_KEY = "cocktail-chat-history";

// Save recipes to localStorage
export const saveRecipes = (recipes: Recipe[]): void => {
  try {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  } catch (error) {
    console.error("Error saving recipes:", error);
  }
};

// Load recipes from localStorage
export const loadRecipes = (): Recipe[] => {
  try {
    const recipes = localStorage.getItem(RECIPES_KEY);
    return recipes ? JSON.parse(recipes) : [];
  } catch (error) {
    console.error("Error loading recipes:", error);
    return [];
  }
};

// Add a new recipe
export const addRecipe = (recipe: Recipe): boolean => {
  try {
    const recipes = loadRecipes();
    recipes.push(recipe);
    saveRecipes(recipes);
    return true;
  } catch (error) {
    console.error("Error adding recipe:", error);
    return false;
  }
};

// Update an existing recipe
export const updateRecipe = (updatedRecipe: Recipe): boolean => {
  try {
    const recipes = loadRecipes();
    const index = recipes.findIndex((recipe) => recipe.id === updatedRecipe.id);

    if (index === -1) return false;

    recipes[index] = {
      ...updatedRecipe,
      updated: new Date().toISOString(),
    };

    saveRecipes(recipes);
    return true;
  } catch (error) {
    console.error("Error updating recipe:", error);
    return false;
  }
};

// Delete a recipe
export const deleteRecipe = (recipeId: string): boolean => {
  try {
    let recipes = loadRecipes();
    const initialLength = recipes.length;

    recipes = recipes.filter((recipe) => recipe.id !== recipeId);

    if (recipes.length === initialLength) return false;

    saveRecipes(recipes);
    return true;
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return false;
  }
};

// Get a recipe by ID
export const getRecipeById = (recipeId: string): Recipe | null => {
  try {
    const recipes = loadRecipes();
    return recipes.find((recipe) => recipe.id === recipeId) || null;
  } catch (error) {
    console.error("Error getting recipe:", error);
    return null;
  }
};

// Export recipes to JSON file
export const exportRecipes = (): void => {
  try {
    const recipes = loadRecipes();
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `cocktail-recipes-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  } catch (error) {
    console.error("Error exporting recipes:", error);
  }
};

// Import recipes from JSON file
export const importRecipes = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== "string") {
          reject("Invalid file format");
          return;
        }

        const importedRecipes = JSON.parse(result) as Recipe[];
        const currentRecipes = loadRecipes();

        // Merge recipes, avoiding duplicates by ID
        const mergedRecipes = [
          ...currentRecipes,
          ...importedRecipes.filter(
            (imported) =>
              !currentRecipes.some((current) => current.id === imported.id),
          ),
        ];

        saveRecipes(mergedRecipes);
        resolve(true);
      } catch (error) {
        console.error("Error parsing imported recipes:", error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject("Error reading file");
    };

    reader.readAsText(file);
  });
};

// Save chat history to localStorage
export const saveChatHistory = (messages: UIMessage[]): void => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

// Load chat history from localStorage
export const loadChatHistory = (): UIMessage[] => {
  try {
    const history = localStorage.getItem(CHAT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error loading chat history:", error);
    return [];
  }
};

// Clear chat history from localStorage
export const clearChatHistory = (): void => {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};
