import { Request, Response, Router } from "express";
import { database } from "../lib/database.js";
import { streamText, ChatRequest } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export function chatRouter(): Router {
  const router = Router();

  // Chat endpoint for AI cocktail ideas with streaming support
  router.post("/", async (req: Request, res: Response) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        console.error("GitHub token not configured");
        res.status(500).json({ error: "AI service temporarily unavailable" });
        return;
      }

      const githubModels = createOpenAI({
        apiKey: githubToken,
        baseURL: "https://models.github.ai/inference",
      });

      // Fetch existing recipes to provide context
      const existingRecipes = await database.listRecipes();

      // Format existing recipes into short definitions
      const recipeDefinitions = existingRecipes
        .map((recipe) => {
          const ingredientsList = recipe.ingredients
            .map((ing) => `${ing.amount} ${ing.unit} ${ing.name}`)
            .join(", ");
          return `${recipe.name}: ${ingredientsList} - ${recipe.instructions}`;
        })
        .join("\n");

      const systemPrompt = `You are an expert cocktail mixologist and recipe developer. Help users create and discover cocktail recipes. 
    
Your expertise includes:
- Classic and modern cocktail recipes
- Ingredient substitutions and alternatives
- Flavor profiles and pairing suggestions
- Techniques and preparation methods
- Garnish and presentation ideas

EXISTING RECIPES IN THE SYSTEM:
${recipeDefinitions}

Please provide helpful, creative, and accurate cocktail advice. When suggesting recipes, include:
- Ingredient list with measurements
- Simple preparation instructions
- Optional garnish suggestions
- Brief tasting notes

Keep responses concise but informative, and feel free to ask clarifying questions if needed. You can reference existing recipes in the system when appropriate.

Use markdown formatting for clarity, especially for ingredient lists and instructions. Use markdown headers for recipe names and sections.

If the user asks for a specific cocktail, provide a recipe that matches their request. If they ask for general cocktail ideas, suggest a few creative options based on common ingredients or themes.
`;

      // Build messages array with system prompt, history, and current message
      const result = streamText({
        model: githubModels(process.env.CHAT_MODEL || "openai/gpt-4.1"),
        system: systemPrompt,
        messages: (req.body as ChatRequest).messages,
      });

      result.pipeDataStreamToResponse(res, {
        getErrorMessage: (error) => {
          console.error("Error in chat stream:", error);
          return "An error occurred while processing your request. Please try again later.";
        },
      });
    } catch (error) {
      console.error("Error processing chat request:", error);
      res.status(500).json({ error: "Failed to process chat request" });
    }
  });

  return router;
}
