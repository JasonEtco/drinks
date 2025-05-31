import { Recipe } from "./types";

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

  // Get recipes by category
  static async getRecipesByCategory(category: string): Promise<Recipe[]> {
    return this.request<Recipe[]>(
      `/recipes/category/${encodeURIComponent(category)}`,
    );
  }

  // Chat with AI for cocktail ideas
  static async chat(message: string): Promise<{ response: string }> {
    return this.request<{ response: string }>("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  // Health check
  static async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    recipesCount: number;
  }> {
    return this.request<{
      status: string;
      timestamp: string;
      recipesCount: number;
    }>("/health");
  }
}
