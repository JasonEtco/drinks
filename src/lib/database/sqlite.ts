import sqlite3 from "sqlite3";
import { GlassType, Recipe } from "../types.js";
import { generateId } from "../recipe-utils.js";
import { DatabaseAdapter } from "./adapter.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SQLiteAdapter extends DatabaseAdapter {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    super();
    this.dbPath = dbPath || process.env.DATABASE_PATH || path.join(__dirname, "../../../recipes.db");
  }

  async initialize(): Promise<void> {
    try {
      console.log("Initializing SQLite database at:", this.dbPath);
      await this.createConnection();
      await this.createTables();
      await this.migrateDatabase();
      await this.seedDatabase();
      this.initialized = true;
      console.log("SQLite database initialized successfully");
    } catch (error) {
      console.error("Error initializing SQLite database:", error);
      throw error;
    }
  }

  private async createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      sqlite3.verbose();
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS recipes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          glass TEXT,
          garnish TEXT,
          instructions TEXT NOT NULL,
          ingredients TEXT NOT NULL,
          tags TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `;

      this.db!.run(createTableSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async migrateDatabase(): Promise<void> {
    return new Promise((resolve) => {
      // Check if description column exists, if not add it
      this.db!.all("PRAGMA table_info(recipes)", (err, columns: any[]) => {
        if (err) {
          console.error("Error checking table info:", err.message);
          resolve();
          return;
        }

        const hasDescription = columns.some(col => col.name === 'description');
        if (!hasDescription) {
          console.log("Adding description column to recipes table...");
          this.db!.run("ALTER TABLE recipes ADD COLUMN description TEXT", (err) => {
            if (err) {
              console.error("Error adding description column:", err.message);
            } else {
              console.log("Description column added successfully");
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
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

  async listRecipes(): Promise<Recipe[]> {
    return new Promise((resolve, reject) => {
      this.db!.all(
        "SELECT * FROM recipes ORDER BY createdAt DESC",
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map((row) => this.rowToRecipe(row)));
          }
        },
      );
    });
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    return new Promise((resolve, reject) => {
      this.db!.get("SELECT * FROM recipes WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(this.rowToRecipe(row));
        } else {
          resolve(null);
        }
      });
    });
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

    return new Promise((resolve, reject) => {
      const row = this.recipeToRow(newRecipe);
      const sql = `
        INSERT INTO recipes (id, name, description, glass, garnish, instructions, ingredients, tags, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db!.run(
        sql,
        [
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
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(newRecipe);
          }
        },
      );
    });
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

    return new Promise((resolve, reject) => {
      const row = this.recipeToRow(updatedRecipe);
      const sql = `
        UPDATE recipes 
        SET name = ?, description = ?, glass = ?, garnish = ?, instructions = ?, 
            ingredients = ?, tags = ?, updatedAt = ?
        WHERE id = ?
      `;

      this.db!.run(
        sql,
        [
          row.name,
          row.description,
          row.glass,
          row.garnish,
          row.instructions,
          row.ingredients,
          row.tags,
          row.updatedAt,
          id,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(updatedRecipe);
          }
        },
      );
    });
  }

  async deleteRecipe(id: string): Promise<Recipe | null> {
    const recipe = await this.getRecipeById(id);
    if (!recipe) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.db!.run("DELETE FROM recipes WHERE id = ?", [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(recipe);
        }
      });
    });
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query.toLowerCase()}%`;
      const sql = `
        SELECT * FROM recipes 
        WHERE LOWER(name) LIKE ? 
           OR LOWER(ingredients) LIKE ? 
           OR LOWER(tags) LIKE ?
        ORDER BY createdAt DESC
      `;

      this.db!.all(
        sql,
        [searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map((row) => this.rowToRecipe(row)));
          }
        },
      );
    });
  }

  async getRecipeCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db!.get("SELECT COUNT(*) as count FROM recipes", (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close((err) => {
          if (err) {
            console.error("Error closing SQLite database:", err.message);
          } else {
            console.log("SQLite database connection closed");
          }
          resolve();
        });
      });
    }
  }
}
