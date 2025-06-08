import { Recipe, InventoryItem } from "./types";

const API_BASE_URL = "/api";

// API service for communicating with the server
export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get all recipes
  static async listRecipes(): Promise<Recipe[]> {
    return this.request<Recipe[]>("/recipes");
  }

  // Get recipe by ID
  static async getRecipe(id: string): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${id}`);
  }

  // Create new recipe
  static async createRecipe(
    recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
  ): Promise<Recipe> {
    return this.request<Recipe>("/recipes", {
      method: "POST",
      body: JSON.stringify(recipe),
    });
  }

  // Update recipe
  static async updateRecipe(
    id: string,
    recipe: Partial<Recipe>,
  ): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(recipe),
    });
  }

  // Delete recipe
  static async deleteRecipe(id: string): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${id}`, {
      method: "DELETE",
    });
  }

  // Search recipes
  static async searchRecipes(query: string): Promise<Recipe[]> {
    return this.request<Recipe[]>(
      `/recipes/search?q=${encodeURIComponent(query)}`,
    );
  }

  // Generate description for cocktail based on ingredients
  static async generateDescription(
    ingredients: Array<{ name: string; amount: number; unit: string }>,
    name?: string
  ): Promise<{ description: string }> {
    return this.request<{ description: string }>("/chat/generate/description", {
      method: "POST",
      body: JSON.stringify({ ingredients, name }),
    });
  }

  // Generate recipe from liked recipes
  static async generateRecipeFromLikes(
    likedRecipeIds: string[],
    passedRecipeIds: string[] = []
  ): Promise<Recipe> {
    return this.request<Recipe>("/recipes/generate-from-likes", {
      method: "POST",
      body: JSON.stringify({ likedRecipeIds, passedRecipeIds }),
    });
  }

  // Chat with AI for cocktail ideas with streaming support
  static async chatStream(
    message: string, 
    history: Array<{role: "user" | "assistant"; content: string}> = [],
    onChunk: (chunk: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                onError?.(new Error(parsed.error));
                return;
              }
              
              if (parsed.done) {
                onComplete?.();
                return;
              }
              
              if (parsed.choices[0]?.delta?.content) {
                onChunk(parsed.choices[0].delta.content);
              }
            } catch (parseError) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Legacy chat method for backwards compatibility (now deprecated)
  static async chat(message: string): Promise<{ response: string }> {
    let fullResponse = '';
    
    return new Promise((resolve, reject) => {
      this.chatStream(
        message,
        [],
        (chunk) => {
          fullResponse += chunk;
        },
        (error) => {
          reject(error);
        },
        () => {
          resolve({ response: fullResponse });
        }
      );
    });
  }

  // === INVENTORY METHODS ===

  // Get all inventory items
  static async listInventory(): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>("/inventory");
  }

  // Get inventory item by ID
  static async getInventoryItem(id: string): Promise<InventoryItem> {
    return this.request<InventoryItem>(`/inventory/${id}`);
  }

  // Get inventory item by barcode
  static async getInventoryByBarcode(barcode: string): Promise<InventoryItem> {
    return this.request<InventoryItem>(`/inventory/barcode/${barcode}`);
  }

  // Create new inventory item
  static async createInventoryItem(
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<InventoryItem> {
    return this.request<InventoryItem>("/inventory", {
      method: "POST",
      body: JSON.stringify(item),
    });
  }

  // Update inventory item
  static async updateInventoryItem(
    id: string,
    item: Partial<InventoryItem>,
  ): Promise<InventoryItem> {
    return this.request<InventoryItem>(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  }

  // Delete inventory item
  static async deleteInventoryItem(id: string): Promise<InventoryItem> {
    return this.request<InventoryItem>(`/inventory/${id}`, {
      method: "DELETE",
    });
  }

  // Search inventory items
  static async searchInventory(query: string): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(
      `/inventory/search/${encodeURIComponent(query)}`,
    );
  }

  // Health check
  static async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    recipesCount: number;
    inventoryCount: number;
  }> {
    return this.request<{
      status: string;
      timestamp: string;
      recipesCount: number;
      inventoryCount: number;
    }>("/health");
  }
}
