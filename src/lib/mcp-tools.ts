import { z } from "zod";
import { tool } from "ai";
import { database } from "./database.js";
import { CreateRecipeSchema, UpdateRecipeSchema } from "./validation.js";
import { GlassType, Recipe } from "./types.js";

export type RecipeToolCallResult = {
  success: true
  message: string
  recipe: Recipe
} | {
  success: false
  message: string
  error: string
}

// MCP Tool Schema for creating recipes
const createRecipeToolSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, "Ingredient name is required"),
      amount: z.number().positive("Ingredient amount must be positive"),
      unit: z.string().min(1, "Ingredient unit is required"),
    })
  ).min(1, "At least one ingredient is required"),
  instructions: z.string().min(1, "Instructions are required"),
  glass: z.enum(GlassType),
  garnish: z.string(),
  tags: z.array(z.string()),
}).required();

// MCP Tool Schema for editing recipes
const editRecipeToolSchema = z.object({
  id: z.string().min(1, "Recipe ID is required"),
  name: z.string().min(1, "Recipe name is required"),
  description: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, "Ingredient name is required"),
      amount: z.number().positive("Ingredient amount must be positive"),
      unit: z.string().min(1, "Ingredient unit is required"),
    })
  ).min(1, "At least one ingredient is required"),
  instructions: z.string().min(1, "Instructions are required"),
  glass: z.enum(GlassType),
  garnish: z.string(),
  tags: z.array(z.string()),
}).required();

// MCP Tool for creating recipes
export const createRecipeTool = tool({
  description: `Create a new cocktail recipe in the database. Use this when a user asks you to save, store, or create a new recipe.
  
  Parameters:
  - name: The name of the cocktail
  - description: Optional description of the cocktail
  - ingredients: Array of ingredients with name, amount, and unit
  - instructions: Step-by-step preparation instructions
  - glass: Optional glass type (${Object.values(GlassType).join(", ")})
  - garnish: Optional garnish description
  - tags: Optional array of tags for categorization`,
  inputSchema: createRecipeToolSchema,
  execute: async (params): Promise<RecipeToolCallResult> => {
    try {
      // Prepare the recipe data for creation
      const recipeData = {
        name: params.name,
        description: params.description,
        ingredients: params.ingredients,
        instructions: params.instructions,
        glass: params.glass,
        garnish: params.garnish,
        tags: params.tags || [],
      };

      // Validate with our existing schema
      CreateRecipeSchema.parse(recipeData);

      // Create the recipe in the database  
      const createdRecipe = await database.createRecipe(recipeData as Recipe);
      
      return {
        success: true,
        recipe: createdRecipe,
        message: `Successfully created recipe "${createdRecipe.name}" with ID ${createdRecipe.id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to create recipe. Please check the recipe details and try again.",
      };
    }
  },
});

// MCP Tool for editing recipes
export const editRecipeTool = tool({
  description: `Edit an existing cocktail recipe in the database. Use this when a user asks you to modify, update, or change an existing recipe.
  
  Parameters:
  - id: The ID of the recipe to edit (required)
  - name: New name for the cocktail (optional)
  - description: New description for the cocktail (optional)
  - ingredients: New array of ingredients with name, amount, and unit (optional)
  - instructions: New step-by-step preparation instructions (optional)
  - glass: New glass type (optional, ${Object.values(GlassType).join(", ")})
  - garnish: New garnish description (optional)
  - tags: New array of tags (optional)`,
  inputSchema: editRecipeToolSchema,
  execute: async (params): Promise<RecipeToolCallResult> => {
    try {
      // Validate required ID parameter first
      if (!params.id || params.id.trim() === '') {
        return {
          success: false,
          error: "Recipe ID is required",
          message: "Failed to edit recipe. Please provide a valid recipe ID.",
        };
      }

      // Check if recipe exists
      const existingRecipe = await database.getRecipeById(params.id);
      if (!existingRecipe) {
        return {
          success: false,
          error: `Recipe with ID ${params.id} not found`,
          message: "Cannot edit recipe: Recipe not found in database.",
        };
      }

      // Prepare updates object
      const updates: any = {};
      
      if (params.name !== undefined) updates.name = params.name;
      if (params.description !== undefined) updates.description = params.description;
      if (params.instructions !== undefined) updates.instructions = params.instructions;
      if (params.glass !== undefined) updates.glass = params.glass;
      if (params.garnish !== undefined) updates.garnish = params.garnish;
      if (params.tags !== undefined) updates.tags = params.tags;
      if (params.ingredients !== undefined) updates.ingredients = params.ingredients;

      // Validate updates with our existing schema
      if (Object.keys(updates).length > 0) {
        UpdateRecipeSchema.parse(updates);
      }

      // Update the recipe in the database
      const updatedRecipe = await database.updateRecipe(params.id, updates);
      
      if (!updatedRecipe) {
        return {
          success: false,
          error: "Failed to update recipe",
          message: "Recipe update failed. Please try again.",
        };
      }

      return {
        success: true,
        recipe: updatedRecipe,
        message: `Successfully updated recipe "${updatedRecipe.name}" (ID: ${updatedRecipe.id})`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to edit recipe. Please check the recipe details and try again.",
      };
    }
  },
});

// Export all tools as a collection
export const mcpTools = {
  create_recipe: createRecipeTool,
  edit_recipe: editRecipeTool,
};
