export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export enum GlassType {
  COUPE = "Coupe",
  MARTINI = "Martini",
  ROCKS = "Rocks",
  DOUBLE_ROCKS = "Double Rocks",
  COLLINS = "Collins",
  HIGHBALL = "Highball",
  NICK_AND_NORA = "Nick and Nora",
  WINE = "Wine",
  FLUTE = "Flute",
  HURRICANE = "Hurricane",
  TIKI = "Tiki",
  COPPER_MUG = "Copper Mug",
  JULEP = "Julep",
  OTHER = "Other",
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string;
  glass?: GlassType;
  garnish?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  barcode?: string;
  category?: string;
  expiryDate?: string;
  purchaseDate?: string;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
