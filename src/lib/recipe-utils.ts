import { Recipe, BatchCalculation, MilkClarificationCalculation, Ingredient, GlassType } from './types';

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Calculate total volume of a recipe in ounces
export const calculateTotalVolume = (recipe: Recipe): number => {
  return recipe.ingredients.reduce((total, ingredient) => {
    return total + (ingredient.unit === 'oz' ? ingredient.amount : 0);
  }, 0);
};

// Calculate batch recipe with dilution
export const calculateBatch = (
  recipe: Recipe,
  servings: number,
  dilutionPercentage: number
): BatchCalculation => {
  const totalBaseVolume = calculateTotalVolume(recipe);
  const totalBatchVolume = totalBaseVolume * servings;
  const waterAmount = (totalBatchVolume * dilutionPercentage) / (100 - dilutionPercentage);
  const totalVolumeWithDilution = totalBatchVolume + waterAmount;
  
  const batchedIngredients = recipe.ingredients.map(ingredient => ({
    name: ingredient.name,
    originalAmount: ingredient.amount,
    batchAmount: ingredient.amount * servings,
    unit: ingredient.unit
  }));
  
  return {
    recipe,
    servings,
    dilutionPercentage,
    totalVolume: totalVolumeWithDilution,
    ingredients: batchedIngredients,
    waterAmount
  };
};

// Calculate milk clarification amounts
export const calculateMilkClarification = (
  recipe: Recipe,
  clarificationPercentage: number
): MilkClarificationCalculation => {
  const totalVolume = calculateTotalVolume(recipe);
  const milkAmount = (totalVolume * clarificationPercentage) / 100;
  
  return {
    recipe,
    clarificationPercentage,
    milkAmount,
    totalVolume
  };
};

// Get unique ingredients from saved recipes
export const getUniqueIngredients = (recipes: Recipe[]): string[] => {
  const ingredientsSet = new Set<string>();
  
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ingredient => {
      ingredientsSet.add(ingredient.name.toLowerCase());
    });
  });
  
  return Array.from(ingredientsSet).sort();
};

// Filter ingredients by search term
export const filterIngredients = (ingredients: string[], searchTerm: string): string[] => {
  if (!searchTerm) return ingredients;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return ingredients.filter(ingredient => 
    ingredient.toLowerCase().includes(lowerSearchTerm)
  );
};

// Create a new ingredient
export const createIngredient = (name: string, amount: number, unit: string): Ingredient => {
  return {
    id: generateId(),
    name,
    amount,
    unit
  };
};

// Create a new recipe
export const createRecipe = (
  name: string,
  ingredients: Ingredient[],
  instructions: string,
  glass?: GlassType,
  garnish?: string,
  notes?: string,
  category?: string
): Recipe => {
  const now = new Date().toISOString();
  
  return {
    id: generateId(),
    name,
    ingredients,
    instructions,
    glass,
    garnish,
    notes,
    category,
    created: now,
    updated: now
  };
};