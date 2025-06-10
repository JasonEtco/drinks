import sqlite3 from "sqlite3";
import { GlassType, Recipe, User } from "./types.js";
import { generateId } from "./recipe-utils.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path (configurable via environment variable for Docker)
const DB_PATH =
  process.env.DATABASE_PATH || path.join(__dirname, "../../recipes.db");

class Database {
  private db: sqlite3.Database;

  constructor() {
    // Enable verbose mode for debugging
    sqlite3.verbose();

    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to SQLite database at:", DB_PATH);
        this.initializeDatabase();
      }
    });
  }

  private initializeDatabase(): void {
    const createRecipesTableSQL = `
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

    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        provider TEXT NOT NULL,
        providerId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(provider, providerId)
      )
    `;

    this.db.run(createRecipesTableSQL, (err) => {
      if (err) {
        console.error("Error creating recipes table:", err.message);
      } else {
        console.log("Recipes table ready");
        
        this.db.run(createUsersTableSQL, (err) => {
          if (err) {
            console.error("Error creating users table:", err.message);
          } else {
            console.log("Users table ready");
            this.migrateDatabase();
          }
        });
      }
    });
  }

  private migrateDatabase(): void {
    // Check if description column exists, if not add it
    this.db.all("PRAGMA table_info(recipes)", (err, columns: any[]) => {
      if (err) {
        console.error("Error checking table info:", err.message);
        return;
      }

      const hasDescription = columns.some(col => col.name === 'description');
      if (!hasDescription) {
        console.log("Adding description column to recipes table...");
        this.db.run("ALTER TABLE recipes ADD COLUMN description TEXT", (err) => {
          if (err) {
            console.error("Error adding description column:", err.message);
          } else {
            console.log("Description column added successfully");
          }
        });
      }
      
      this.seedDatabase();
    });
  }

  private seedDatabase(): void {
    // Check if we already have recipes
    this.db.get("SELECT COUNT(*) as count FROM recipes", (err, row: any) => {
      if (err) {
        console.error("Error checking recipe count:", err.message);
        return;
      }

      if (row.count === 0) {
        console.log("Seeding database with initial recipes...");
        const initialRecipes: Recipe[] = [
          {
            id: "1",
            name: "Classic Margarita",
            description: "A perfect balance of tequila, citrus, and orange liqueur with a salted rim",
            glass: GlassType.COUPE,
            garnish: "Lime wheel",
            instructions:
              "Shake all ingredients with ice and strain over fresh ice.",
            ingredients: [
              { name: "Tequila", amount: 2, unit: "oz" },
              { name: "Cointreau", amount: 1, unit: "oz" },
              {
                name: "Fresh lime juice",
                amount: 1,
                unit: "oz",
              },
            ],
            tags: ["classic", "citrus"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Old Fashioned",
            description: "The quintessential whiskey cocktail - simple, strong, and timeless",
            glass: GlassType.ROCKS,
            garnish: "Orange peel",
            instructions:
              "Muddle sugar with bitters, add whiskey and ice, stir.",
            ingredients: [
              {
                name: "Bourbon whiskey",
                amount: 2,
                unit: "oz",
              },
              {
                name: "Simple syrup",
                amount: 0.25,
                unit: "oz",
              },
              {
                name: "Angostura bitters",
                amount: 2,
                unit: "dashes",
              },
            ],
            tags: ["classic", "whiskey"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        initialRecipes.forEach((recipe) => {
          this.createRecipe(recipe).catch(console.error);
        });
      }
    });
  }

  // Convert Recipe object to database row
  private recipeToRow(recipe: Recipe): any {
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

  // Convert database row to Recipe object
  private rowToRecipe(row: any): Recipe {
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

  // Get all recipes
  async listRecipes(): Promise<Recipe[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
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

  // Get recipe by ID
  async getRecipeById(id: string): Promise<Recipe | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM recipes WHERE id = ?", [id], (err, row) => {
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

  // Create new recipe
  async createRecipe(
    recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
  ): Promise<Recipe> {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const row = this.recipeToRow(newRecipe);
      const sql = `
        INSERT INTO recipes (id, name, description, glass, garnish, instructions, ingredients, tags, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
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

  // Update recipe
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

      this.db.run(
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

  // Delete recipe
  async deleteRecipe(id: string): Promise<Recipe | null> {
    const recipe = await this.getRecipeById(id);
    if (!recipe) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM recipes WHERE id = ?", [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(recipe);
        }
      });
    });
  }

  // Search recipes
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

      this.db.all(
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

  // Get recipe count
  async getRecipeCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT COUNT(*) as count FROM recipes", (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  // User management methods
  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    return new Promise((resolve, reject) => {
      const id = generateId();
      const now = new Date().toISOString();
      const newUser: User = {
        id,
        ...userData,
        createdAt: now,
        updatedAt: now,
      };

      const sql = `
        INSERT INTO users (id, name, email, provider, providerId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [newUser.id, newUser.name, newUser.email, newUser.provider, newUser.providerId, newUser.createdAt, newUser.updatedAt],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(newUser);
          }
        }
      );
    });
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM users WHERE provider = ? AND providerId = ?";
      
      this.db.get(sql, [provider, providerId], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(this.rowToUser(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM users WHERE id = ?";
      
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(this.rowToUser(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  async updateUser(id: string, updates: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User> {
    return new Promise((resolve, reject) => {
      const updatedAt = new Date().toISOString();
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), updatedAt, id];

      const sql = `UPDATE users SET ${setClause}, updatedAt = ? WHERE id = ?`;

      this.db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        } else {
          // Get the updated user
          this.db.get("SELECT * FROM users WHERE id = ?", [id], (err, row: any) => {
            if (err) {
              reject(err);
            } else if (row) {
              resolve(this.rowToUser(row));
            } else {
              reject(new Error("User not found"));
            }
          });
        }
      });
    });
  }

  private rowToUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      provider: row.provider as 'github' | 'google',
      providerId: row.providerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // Close database connection
  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
    });
  }
}

// Export singleton instance
export const database = new Database();
