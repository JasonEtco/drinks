import mysql from "mysql2/promise";
import { GlassType, Recipe } from "../types.js";
import { generateId } from "../recipe-utils.js";
import { DatabaseAdapter } from "./adapter.js";

export class MySQLAdapter extends DatabaseAdapter {
  private db: mysql.Connection | null = null;
  private connectionString: string;

  constructor(connectionString: string) {
    super();
    this.connectionString = connectionString;
  }

  async initialize(): Promise<void> {
    try {
      console.log("Initializing MySQL database connection...");
      await this.createConnection();
      await this.createTables();
      await this.seedDatabase();
      this.initialized = true;
      console.log("MySQL database initialized successfully");
    } catch (error) {
      console.error("Error initializing MySQL database:", error);
      throw error;
    }
  }

  private async createConnection(): Promise<void> {
    this.db = await mysql.createConnection(this.connectionString);
  }

  private async createTables(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        glass VARCHAR(100),
        garnish VARCHAR(255),
        instructions TEXT NOT NULL,
        ingredients JSON NOT NULL,
        tags JSON,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await this.db!.execute(createTableSQL);
  }

  private async seedDatabase(): Promise<void> {
    try {
      const existingRecipes = await this.listRecipes();
      if (existingRecipes.length > 0) {
        console.log("Database already contains recipes, skipping seed");
        return;
      }

      console.log("Seeding database with initial recipes...");
      
      const initialRecipes: Omit<Recipe, "id" | "createdAt" | "updatedAt">[] = [
        {
          name: "Classic Margarita",
          description: "A perfect balance of tequila, citrus, and orange liqueur with a salted rim",
          glass: GlassType.COUPE,
          garnish: "Lime wheel",
          instructions: "Shake all ingredients with ice and strain over fresh ice.",
          ingredients: [
            { name: "Tequila", amount: 2, unit: "oz" },
            { name: "Cointreau", amount: 1, unit: "oz" },
            { name: "Fresh lime juice", amount: 1, unit: "oz" },
          ],
          tags: ["classic", "citrus"],
        },
        {
          name: "Old Fashioned",
          description: "The quintessential whiskey cocktail - simple, strong, and timeless",
          glass: GlassType.ROCKS,
          garnish: "Orange peel",
          instructions: "Muddle sugar with bitters, add whiskey and ice, stir.",
          ingredients: [
            { name: "Bourbon whiskey", amount: 2, unit: "oz" },
            { name: "Simple syrup", amount: 0.25, unit: "oz" },
            { name: "Angostura bitters", amount: 2, unit: "dashes" },
          ],
          tags: ["classic", "whiskey"],
        },
      ];

      for (const recipe of initialRecipes) {
        await this.createRecipe(recipe);
      }
      
      console.log(`Seeded database with ${initialRecipes.length} recipes`);
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }

  // Override recipeToRow for MySQL-specific date handling
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
      createdAt: new Date(recipe.createdAt),
      updatedAt: new Date(recipe.updatedAt),
    };
  }

  // Override rowToRecipe for MySQL-specific date handling
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
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listRecipes(): Promise<Recipe[]> {
    const [rows] = await this.db!.execute("SELECT * FROM recipes ORDER BY createdAt DESC");
    return (rows as any[]).map((row) => this.rowToRecipe(row));
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    const [rows] = await this.db!.execute("SELECT * FROM recipes WHERE id = ?", [id]);
    const results = rows as any[];
    return results.length > 0 ? this.rowToRecipe(results[0]) : null;
  }

  async createRecipe(
    recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
  ): Promise<Recipe> {
    const newRecipe: Recipe = {
      ...recipe,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const row = this.recipeToRow(newRecipe);
    const sql = `
      INSERT INTO recipes (id, name, description, glass, garnish, instructions, ingredients, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db!.execute(sql, [
      row.id,
      row.name,
      row.description,
      row.glass,
      row.garnish,
      row.instructions,
      row.ingredients,
      row.tags,
      row.createdAt,
      row.updatedAt,
    ]);

    return newRecipe;
  }

  async updateRecipe(
    id: string,
    updates: Partial<Recipe>,
  ): Promise<Recipe | null> {
    const existingRecipe = await this.getRecipeById(id);
    if (!existingRecipe) {
      return null;
    }

    const updatedRecipe: Recipe = {
      ...existingRecipe,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    const row = this.recipeToRow(updatedRecipe);
    const sql = `
      UPDATE recipes 
      SET name = ?, description = ?, glass = ?, garnish = ?, instructions = ?, 
          ingredients = ?, tags = ?, updatedAt = ?
      WHERE id = ?
    `;

    await this.db!.execute(sql, [
      row.name,
      row.description,
      row.glass,
      row.garnish,
      row.instructions,
      row.ingredients,
      row.tags,
      row.updatedAt,
      id,
    ]);

    return updatedRecipe;
  }

  async deleteRecipe(id: string): Promise<Recipe | null> {
    const recipe = await this.getRecipeById(id);
    if (!recipe) {
      return null;
    }

    await this.db!.execute("DELETE FROM recipes WHERE id = ?", [id]);
    return recipe;
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const sql = `
      SELECT * FROM recipes 
      WHERE LOWER(name) LIKE ? 
         OR LOWER(JSON_EXTRACT(ingredients, '$')) LIKE ? 
         OR LOWER(JSON_EXTRACT(tags, '$')) LIKE ?
      ORDER BY createdAt DESC
    `;
    
    const [rows] = await this.db!.execute(sql, [searchTerm, searchTerm, searchTerm]);
    return (rows as any[]).map((row) => this.rowToRecipe(row));
  }

  async getRecipeCount(): Promise<number> {
    const [rows] = await this.db!.execute("SELECT COUNT(*) as count FROM recipes");
    return (rows as any[])[0].count;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.end();
      console.log("MySQL connection closed");
    }
  }
}
