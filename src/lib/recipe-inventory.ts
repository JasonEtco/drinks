import { Recipe, InventoryItem, Ingredient } from "./types";

export interface RecipeAvailability {
  recipe: Recipe;
  canMake: boolean;
  missingIngredients: Ingredient[];
  availableIngredients: Ingredient[];
  partialMatch: boolean;
}

/**
 * Check which recipes can be made with current inventory
 */
export function analyzeRecipeAvailability(
  recipes: Recipe[],
  inventory: InventoryItem[]
): RecipeAvailability[] {
  return recipes.map(recipe => {
    const missingIngredients: Ingredient[] = [];
    const availableIngredients: Ingredient[] = [];
    
    recipe.ingredients.forEach(ingredient => {
      // Find matching inventory items by name (case-insensitive)
      const matchingItems = inventory.filter(item =>
        item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(item.name.toLowerCase())
      );
      
      // Check if we have enough quantity
      const totalAvailable = matchingItems.reduce((sum, item) => {
        // Simple unit conversion - this could be made more sophisticated
        if (item.unit === ingredient.unit) {
          return sum + item.quantity;
        }
        // Basic conversions
        if (item.unit === "ml" && ingredient.unit === "oz") {
          return sum + (item.quantity / 30); // 1 oz ≈ 30ml
        }
        if (item.unit === "oz" && ingredient.unit === "ml") {
          return sum + (item.quantity * 30);
        }
        if (item.unit === "l" && ingredient.unit === "ml") {
          return sum + (item.quantity * 1000);
        }
        if (item.unit === "ml" && ingredient.unit === "l") {
          return sum + (item.quantity / 1000);
        }
        // If units don't match and we can't convert, assume we have it if quantity > 0
        return sum + (item.quantity > 0 ? ingredient.amount : 0);
      }, 0);
      
      if (totalAvailable >= ingredient.amount) {
        availableIngredients.push(ingredient);
      } else {
        missingIngredients.push(ingredient);
      }
    });
    
    const canMake = missingIngredients.length === 0;
    const partialMatch = availableIngredients.length > 0 && missingIngredients.length > 0;
    
    return {
      recipe,
      canMake,
      missingIngredients,
      availableIngredients,
      partialMatch,
    };
  });
}

/**
 * Find recipes that can be made with current inventory
 */
export function getAvailableRecipes(
  recipes: Recipe[],
  inventory: InventoryItem[]
): Recipe[] {
  return analyzeRecipeAvailability(recipes, inventory)
    .filter(analysis => analysis.canMake)
    .map(analysis => analysis.recipe);
}

/**
 * Find recipes that can be partially made with current inventory
 */
export function getPartialRecipes(
  recipes: Recipe[],
  inventory: InventoryItem[]
): RecipeAvailability[] {
  return analyzeRecipeAvailability(recipes, inventory)
    .filter(analysis => analysis.partialMatch)
    .sort((a, b) => b.availableIngredients.length - a.availableIngredients.length);
}

/**
 * Get ingredient suggestions based on current inventory
 */
export function getIngredientSuggestions(
  recipes: Recipe[],
  inventory: InventoryItem[]
): { ingredient: string; recipeCount: number; recipes: Recipe[] }[] {
  const missingIngredients: Record<string, { count: number; recipes: Recipe[] }> = {};
  
  analyzeRecipeAvailability(recipes, inventory).forEach(analysis => {
    if (analysis.partialMatch || analysis.missingIngredients.length > 0) {
      analysis.missingIngredients.forEach(ingredient => {
        const key = ingredient.name.toLowerCase();
        if (!missingIngredients[key]) {
          missingIngredients[key] = { count: 0, recipes: [] };
        }
        missingIngredients[key].count++;
        if (!missingIngredients[key].recipes.some(r => r.id === analysis.recipe.id)) {
          missingIngredients[key].recipes.push(analysis.recipe);
        }
      });
    }
  });
  
  return Object.entries(missingIngredients)
    .map(([ingredient, data]) => ({
      ingredient,
      recipeCount: data.count,
      recipes: data.recipes,
    }))
    .sort((a, b) => b.recipeCount - a.recipeCount)
    .slice(0, 10); // Top 10 suggestions
}