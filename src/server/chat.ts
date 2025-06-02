import { Request, Response, Router } from "express";
import { database } from "../lib/database.js";
import { streamText, generateObject, ChatRequest } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

// Schema for recipe generation
const IngredientSchema = z.object({
  name: z.string().describe("The name of the ingredient"),
  amount: z.number().describe("The amount/quantity of the ingredient"),
  unit: z.string().describe("The unit of measurement (e.g., 'oz', 'dash', 'splash', 'ml')")
});

const RecipeSchema = z.object({
  name: z.string().describe("The name of the cocktail recipe"),
  ingredients: z.array(IngredientSchema).describe("List of ingredients with amounts and units"),
  instructions: z.string().describe("Step-by-step instructions for making the cocktail"),
  glass: z.string().optional().describe("Type of glass to serve in (e.g., 'Coupe', 'Rocks', 'Martini')"),
  garnish: z.string().optional().describe("Garnish for the cocktail"),
  category: z.string().optional().describe("Category of the cocktail (e.g., 'Classic', 'Modern', 'Tropical')")
});

const RecipeGenerationSchema = z.object({
  recipes: z.array(RecipeSchema).describe("Array of cocktail recipes extracted from the conversation"),
  reasoning: z.string().describe("Explanation of why these recipes were chosen based on the conversation")
});

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

  // Recipe generation endpoint that analyzes chat history
  router.post("/generate-recipe", async (req: Request, res: Response) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        console.error("GitHub token not configured");
        res.status(500).json({ error: "AI service temporarily unavailable" });
        return;
      }

      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Messages array is required" });
        return;
      }

      if (messages.length === 0) {
        res.status(400).json({ error: "At least one message is required to generate recipes" });
        return;
      }

      const githubModels = createOpenAI({
        apiKey: githubToken,
        baseURL: "https://models.github.ai/inference",
      });

      // Build conversation context from messages
      const conversationText = messages
        .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      const systemPrompt = `You are an expert cocktail recipe developer. Analyze the following conversation and extract specific cocktail recipes that were discussed, suggested, or would be appropriate based on the conversation context.

Your task is to:
1. Identify concrete cocktail recipes from the conversation
2. Extract or infer complete recipe information including ingredients with measurements
3. If recipes were only partially discussed, use your expertise to complete them with standard proportions
4. Only include recipes that make sense given the conversation context
5. Provide 1-3 recipes maximum to avoid overwhelming the user

Guidelines:
- Use standard cocktail measurements (prefer oz, ml, dashes, splashes)
- Include realistic and balanced recipes that would taste good
- If a recipe was mentioned but not fully specified, complete it with classic proportions
- Include appropriate glass types and garnishes
- Focus on recipes that were the main topic of discussion

Conversation to analyze:
${conversationText}`;

      const result = await generateObject({
        model: githubModels(process.env.CHAT_MODEL || "openai/gpt-4o"),
        system: systemPrompt,
        prompt: "Based on this conversation, extract or suggest appropriate cocktail recipes with complete details.",
        schema: RecipeGenerationSchema,
        schemaName: "cocktail_recipes",
        schemaDescription: "Cocktail recipes extracted from conversation with complete ingredient lists and instructions"
      });

      res.json(result.object);
    } catch (error) {
      console.error("Error generating recipe:", error);
      res.status(500).json({ error: "Failed to generate recipe from conversation" });
    }
  });

  return router;
}
