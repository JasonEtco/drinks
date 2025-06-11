import sqlite3 from "sqlite3";
import { GlassType, Recipe, InventoryItem } from "./types.js";
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

    const createInventoryTableSQL = `
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        barcode TEXT,
        category TEXT,
        expiryDate TEXT,
        purchaseDate TEXT,
        cost REAL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    this.db.run(createTableSQL, (err) => {
      if (err) {
        console.error("Error creating recipes table:", err.message);
      } else {
        console.log("Recipes table ready");
        
        // Create inventory table
        this.db.run(createInventoryTableSQL, (err) => {
          if (err) {
            console.error("Error creating inventory table:", err.message);
          } else {
            console.log("Inventory table ready");
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

  // === INVENTORY METHODS ===

  // Convert InventoryItem object to database row
  private inventoryToRow(item: InventoryItem): any {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      barcode: item.barcode || null,
      category: item.category || null,
      expiryDate: item.expiryDate || null,
      purchaseDate: item.purchaseDate || null,
      cost: item.cost || null,
      notes: item.notes || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  // Convert database row to InventoryItem object
  private rowToInventory(row: any): InventoryItem {
    return {
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      unit: row.unit,
      barcode: row.barcode,
      category: row.category,
      expiryDate: row.expiryDate,
      purchaseDate: row.purchaseDate,
      cost: row.cost,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // Get all inventory items
  async listInventory(): Promise<InventoryItem[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM inventory ORDER BY name ASC",
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map((row) => this.rowToInventory(row)));
          }
        },
      );
    });
  }

  // Get inventory item by ID
  async getInventoryById(id: string): Promise<InventoryItem | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM inventory WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(this.rowToInventory(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Get inventory item by barcode
  async getInventoryByBarcode(barcode: string): Promise<InventoryItem | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM inventory WHERE barcode = ?", [barcode], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(this.rowToInventory(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Create new inventory item
  async createInventoryItem(
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const row = this.inventoryToRow(newItem);
      const sql = `
        INSERT INTO inventory (id, name, quantity, unit, barcode, category, expiryDate, purchaseDate, cost, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          row.id,
          row.name,
          row.quantity,
          row.unit,
          row.barcode,
          row.category,
          row.expiryDate,
          row.purchaseDate,
          row.cost,
          row.notes,
          row.createdAt,
          row.updatedAt,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(newItem);
          }
        },
      );
    });
  }

  // Update inventory item
  async updateInventoryItem(
    id: string,
    updates: Partial<InventoryItem>,
  ): Promise<InventoryItem | null> {
    const existingItem = await this.getInventoryById(id);
    if (!existingItem) {
      return null;
    }

    const updatedItem: InventoryItem = {
      ...existingItem,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const row = this.inventoryToRow(updatedItem);
      const sql = `
        UPDATE inventory 
        SET name = ?, quantity = ?, unit = ?, barcode = ?, category = ?, 
            expiryDate = ?, purchaseDate = ?, cost = ?, notes = ?, updatedAt = ?
        WHERE id = ?
      `;

      this.db.run(
        sql,
        [
          row.name,
          row.quantity,
          row.unit,
          row.barcode,
          row.category,
          row.expiryDate,
          row.purchaseDate,
          row.cost,
          row.notes,
          row.updatedAt,
          id,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(updatedItem);
          }
        },
      );
    });
  }

  // Delete inventory item
  async deleteInventoryItem(id: string): Promise<InventoryItem | null> {
    const item = await this.getInventoryById(id);
    if (!item) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM inventory WHERE id = ?", [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(item);
        }
      });
    });
  }

  // Search inventory items
  async searchInventory(query: string): Promise<InventoryItem[]> {
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query.toLowerCase()}%`;
      const sql = `
        SELECT * FROM inventory 
        WHERE LOWER(name) LIKE ? 
           OR LOWER(category) LIKE ? 
           OR LOWER(notes) LIKE ?
        ORDER BY name ASC
      `;

      this.db.all(
        sql,
        [searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map((row) => this.rowToInventory(row)));
          }
        },
      );
    });
  }

  // Get inventory count
  async getInventoryCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT COUNT(*) as count FROM inventory", (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
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
