import { Database as SqliteDB } from 'sqlite3';
import { Recipe, GlassType, Ingredient } from '../lib/types';
import { generateId } from '../lib/recipe-utils';

/**
 * Test database utility class for creating and managing test databases
 */
export class TestDatabase {
  private db: SqliteDB | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use in-memory database for tests
      this.db = new SqliteDB(':memory:', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE recipes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT,
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

  async insertTestRecipe(recipe: Partial<Recipe> & { name: string; instructions: string; ingredients: Ingredient[] }): Promise<Recipe> {
    const fullRecipe: Recipe = {
      id: recipe.id || generateId(),
      name: recipe.name,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      category: recipe.category || 'cocktail',
      glass: recipe.glass || GlassType.COUPE,
      garnish: recipe.garnish || '',
      tags: recipe.tags || [],
      createdAt: recipe.createdAt || new Date().toISOString(),
      updatedAt: recipe.updatedAt || new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO recipes (id, name, category, glass, garnish, instructions, ingredients, tags, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db!.run(
        sql,
        [
          fullRecipe.id,
          fullRecipe.name,
          fullRecipe.category,
          fullRecipe.glass,
          fullRecipe.garnish,
          fullRecipe.instructions,
          JSON.stringify(fullRecipe.ingredients),
          JSON.stringify(fullRecipe.tags),
          fullRecipe.createdAt,
          fullRecipe.updatedAt,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(fullRecipe);
          }
        }
      );
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db!.run('DELETE FROM recipes', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getDb(): SqliteDB | null {
    return this.db;
  }
}

/**
 * Sample test data
 */
export const createTestRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: generateId(),
  name: 'Test Margarita',
  category: 'cocktail',
  glass: GlassType.COUPE,
  garnish: 'Lime wheel',
  instructions: 'Shake all ingredients with ice and strain over fresh ice.',
  ingredients: [
    { id: generateId(), name: 'Tequila', amount: 2, unit: 'oz' },
    { id: generateId(), name: 'Cointreau', amount: 1, unit: 'oz' },
    { id: generateId(), name: 'Fresh lime juice', amount: 1, unit: 'oz' },
  ],
  tags: ['classic', 'citrus'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestIngredient = (overrides: Partial<Ingredient> = {}): Ingredient => ({
  id: generateId(),
  name: 'Test Ingredient',
  amount: 1,
  unit: 'oz',
  ...overrides,
});