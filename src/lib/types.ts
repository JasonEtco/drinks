export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string;
  notes?: string;
  created: string;
  updated: string;
  glass?: string;
  garnish?: string;
}

export interface BatchCalculation {
  recipe: Recipe;
  servings: number;
  dilutionPercentage: number;
  totalVolume: number;
  ingredients: {
    name: string;
    originalAmount: number;
    batchAmount: number;
    unit: string;
  }[];
  waterAmount: number;
}

export interface MilkClarificationCalculation {
  recipe: Recipe;
  clarificationPercentage: number;
  milkAmount: number;
  totalVolume: number;
}