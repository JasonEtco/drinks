import { CosmosClient, Container, Database as CosmosDatabase } from "@azure/cosmos";
import { GlassType, Recipe } from "../types.js";
import { generateId } from "../recipe-utils.js";
import { DatabaseAdapter } from "./adapter.js";

export class CosmosAdapter extends DatabaseAdapter {
  private client: CosmosClient | null = null;
  private database: CosmosDatabase | null = null;
  private container: Container | null = null;
  private connectionString: string;
  private databaseId: string = "drinks";
  private containerId: string = "recipes";

  constructor(connectionString: string) {
    super();
    this.connectionString = connectionString;
  }

  async initialize(): Promise<void> {
    try {
      console.log("Initializing Cosmos DB connection...");
      await this.createConnection();
      await this.createDatabaseAndContainer();
      await this.seedDatabase();
      this.initialized = true;
      console.log("Cosmos DB initialized successfully");
    } catch (error) {
      console.error("Error initializing Cosmos DB:", error);
      throw error;
    }
  }

  private async createConnection(): Promise<void> {
    this.client = new CosmosClient(this.connectionString);
  }

  private async createDatabaseAndContainer(): Promise<void> {
    if (!this.client) {
      throw new Error("Cosmos client not initialized");
    }

    // Create database if it doesn't exist
    const { database } = await this.client.databases.createIfNotExists({
      id: this.databaseId
    });
    this.database = database;

    // Create container if it doesn't exist
    const { container } = await this.database.containers.createIfNotExists({
      id: this.containerId,
      partitionKey: "/id"
    });
    this.container = container;
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

  // Convert Recipe object to Cosmos document
  private recipeToDocument(recipe: Recipe): any {
    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description || null,
      glass: recipe.glass || null,
      garnish: recipe.garnish || null,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      tags: recipe.tags || [],
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }

  // Convert Cosmos document to Recipe object
  private documentToRecipe(doc: any): Recipe {
    return {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      glass: doc.glass,
      garnish: doc.garnish,
      instructions: doc.instructions,
      ingredients: doc.ingredients,
      tags: doc.tags || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async listRecipes(): Promise<Recipe[]> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.createdAt DESC"
    };

    const { resources } = await this.container.items.query(querySpec).fetchAll();
    return resources.map(doc => this.documentToRecipe(doc));
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    try {
      const { resource } = await this.container.item(id, id).read();
      return resource ? this.documentToRecipe(resource) : null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async createRecipe(
    recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
  ): Promise<Recipe> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    const newRecipe: Recipe = {
      ...recipe,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const document = this.recipeToDocument(newRecipe);
    await this.container.items.create(document);
    
    return newRecipe;
  }

  async updateRecipe(
    id: string,
    updates: Partial<Recipe>,
  ): Promise<Recipe | null> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

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

    const document = this.recipeToDocument(updatedRecipe);
    await this.container.item(id, id).replace(document);
    
    return updatedRecipe;
  }

  async deleteRecipe(id: string): Promise<Recipe | null> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    const recipe = await this.getRecipeById(id);
    if (!recipe) {
      return null;
    }

    await this.container.item(id, id).delete();
    return recipe;
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    const searchTerm = query.toLowerCase();
    const querySpec = {
      query: `
        SELECT * FROM c 
        WHERE CONTAINS(LOWER(c.name), @searchTerm) 
           OR EXISTS(SELECT VALUE i FROM i IN c.ingredients WHERE CONTAINS(LOWER(i.name), @searchTerm))
           OR EXISTS(SELECT VALUE t FROM t IN c.tags WHERE CONTAINS(LOWER(t), @searchTerm))
        ORDER BY c.createdAt DESC
      `,
      parameters: [
        {
          name: "@searchTerm",
          value: searchTerm
        }
      ]
    };

    const { resources } = await this.container.items.query(querySpec).fetchAll();
    return resources.map(doc => this.documentToRecipe(doc));
  }

  async getRecipeCount(): Promise<number> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    const querySpec = {
      query: "SELECT VALUE COUNT(1) FROM c"
    };

    const { resources } = await this.container.items.query(querySpec).fetchAll();
    return resources[0] || 0;
  }

  async close(): Promise<void> {
    // Cosmos DB client doesn't need explicit closing
    console.log("Cosmos DB connection closed");
  }
}
