import { Request, Response, Router, NextFunction } from "express";
import { database } from "../lib/database.js";
import { CreateRecipeSchema, UpdateRecipeSchema } from "../lib/validation.js";
import { Ingredient, Recipe } from "../lib/types.js";
import { createGitHubModels, generateRecipeTags, generateRecipeFromLikes } from "./llm.js";
import { generateObject } from "ai";
import zod from "zod";
import { authenticateUser, requireEditorAuth, AuthenticatedRequest } from "./auth.js";

// Optional authentication middleware that doesn't block on missing auth
function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers["cf_authorization"] as string;
  
  if (authHeader) {
    // If header is present, try to authenticate but don't fail if invalid
    authenticateUser(req, res, (err) => {
      // Continue regardless of authentication result for read operations
      next();
    });
  } else {
    // No auth header, continue without user context
    next();
  }
}

export function recipesRouter(): Router {
  const router = Router()

  // Get all recipes
  router.get("/", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recipes = await database.listRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // Search recipes (must come before /:recipeId route)
  router.get("/search", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.query.q) {
        res.status(400).json({ error: "Query parameter is required" });
        return;
      }
      const filteredRecipes = await database.searchRecipes(
        req.query.q.toString()
      );
      res.json(filteredRecipes);
    } catch (error) {
      console.error("Error searching recipes:", error);
      res.status(500).json({ error: "Failed to search recipes" });
    }
  });

  // Generate recipe from likes (must come before /:recipeId route)
  router.post("/generate-from-likes", requireEditorAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { likedRecipeIds, passedRecipeIds = [] } = req.body;

      if (!likedRecipeIds || !Array.isArray(likedRecipeIds) || likedRecipeIds.length === 0) {
        res.status(400).json({ error: "likedRecipeIds array is required and must not be empty" });
        return;
      }

      // Fetch the actual recipe objects for liked recipes
      const likedRecipes: Recipe[] = [];
      for (const id of likedRecipeIds) {
        const recipe = await database.getRecipeById(id);
        if (recipe) {
          likedRecipes.push(recipe);
        }
      }

      // Fetch the actual recipe objects for passed recipes (optional)
      const passedRecipes: Recipe[] = [];
      for (const id of passedRecipeIds) {
        const recipe = await database.getRecipeById(id);
        if (recipe) {
          passedRecipes.push(recipe);
        }
      }

      if (likedRecipes.length === 0) {
        res.status(400).json({ error: "No valid liked recipes found" });
        return;
      }

      // Generate new recipe using LLM
      const generatedRecipe = await generateRecipeFromLikes({
        likedRecipes,
        passedRecipes,
      });

      // Create the recipe in the database
      const newRecipe = await database.createRecipe(generatedRecipe);

      res.status(201).json(newRecipe);
    } catch (error) {
      console.error("Error generating recipe from likes:", error);
      res.status(500).json({ error: "Failed to generate recipe from likes" });
    }
  });

  // Create new recipe
  router.post("/", requireEditorAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate input using Zod schema
      const validatedData = CreateRecipeSchema.parse(req.body);

      // Create tags using LLM
      if (validatedData.tags && validatedData.tags.length === 0) {
        validatedData.tags = await generateRecipeTags({
          name: validatedData.name,
          ingredients: validatedData.ingredients as Ingredient[],
        });
      }

      // Cast to expected type for database
      const recipeData = validatedData as Omit<
        Recipe,
        "id" | "createdAt" | "updatedAt"
      >;
      const recipe = await database.createRecipe(recipeData);
      res.status(201).json(recipe);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({
          error: "Validation failed",
          details: (error as any).errors,
        });
        return;
      }
      console.error("Error creating recipe:", error);
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  // Get recipe by ID (must come after specific routes)
  router.get("/:recipeId", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recipe = await database.getRecipeById(req.params.recipeId);
      if (!recipe) {
        res.status(404).json({ error: "Recipe not found" });
        return;
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // Update recipe
  router.put("/:recipeId", requireEditorAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate input using Zod schema
      const validatedData = UpdateRecipeSchema.parse(req.body);

      // Create tags using LLM
      if (validatedData.tags && validatedData.tags.length === 0) {
        validatedData.tags = await generateRecipeTags({
          name: validatedData.name,
          ingredients: validatedData.ingredients as Ingredient[],
        });
      }

      // Cast to expected type for database
      const updateData = validatedData as Partial<Recipe>;
      const updatedRecipe = await database.updateRecipe(
        req.params.recipeId,
        updateData
      );
      if (!updatedRecipe) {
        res.status(404).json({ error: "Recipe not found" });
        return;
      }
      res.json(updatedRecipe);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({
          error: "Validation failed",
          details: (error as any).errors,
        });
        return;
      }
      console.error("Error updating recipe:", error);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  // Delete recipe
  router.delete("/:recipeId", requireEditorAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deletedRecipe = await database.deleteRecipe(req.params.recipeId);
      if (!deletedRecipe) {
        res.status(404).json({ error: "Recipe not found" });
        return;
      }
      res.json(deletedRecipe);
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  return router;
}
