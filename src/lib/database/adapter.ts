import { Recipe } from "../types.js";

export abstract class DatabaseAdapter {
  protected initialized: boolean = false;

  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;

  // Recipe CRUD operations
  abstract listRecipes(): Promise<Recipe[]>;
  abstract getRecipeById(id: string): Promise<Recipe | null>;
  abstract createRecipe(recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">): Promise<Recipe>;
  abstract updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null>;
  abstract deleteRecipe(id: string): Promise<Recipe | null>;
  abstract searchRecipes(query: string): Promise<Recipe[]>;
  abstract getRecipeCount(): Promise<number>;

  // Utility methods
  async waitForInit(): Promise<void> {
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waited = 0;

    while (!this.initialized && waited < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (!this.initialized) {
      throw new Error("Database initialization timeout");
    }
  }

  // Convert Recipe object to database row (can be overridden)
  protected recipeToRow(recipe: Recipe): any {
    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description || null,
      glass: recipe.glass || null,
      garnish: recipe.garnish || null,
      instructions: recipe.instructions,
      ingredients: JSON.stringify(recipe.ingredients),
      tags: JSON.stringify(recipe.tags || []),
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }

  // Convert database row to Recipe object (can be overridden)
  protected rowToRecipe(row: any): Recipe {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      glass: row.glass,
      garnish: row.garnish,
      instructions: row.instructions,
      ingredients: JSON.parse(row.ingredients),
      tags: JSON.parse(row.tags || "[]"),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
