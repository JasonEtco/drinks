import { Request, Response, Router } from "express";
import { database } from "../lib/database.js";
import { ChatMessageSchema } from "../lib/validation.js";
import { Recipe } from "../lib/types.js";

export function chatRouter(): Router {
  const router = Router();

  // Chat endpoint for AI cocktail ideas with streaming support
  router.post("/", async (req: Request, res: Response) => {
    try {
      // Validate input using Zod schema
      const validatedData = ChatMessageSchema.parse(req.body);
      const { message, history } = validatedData;

      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        console.error("GitHub token not configured");
        res.status(500).json({ error: "AI service temporarily unavailable" });
        return;
      }

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

Keep responses concise but informative, and feel free to ask clarifying questions if needed. You can reference existing recipes in the system when appropriate.`;

      // Build messages array with system prompt, history, and current message
      const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ];

      // Call GitHub Models API with streaming
      const response = await fetch(
        "https://models.github.ai/inference/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            model: "openai/gpt-4.1",
            temperature: 0.7,
            max_tokens: 800,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GitHub Models API error:", response.status, errorText);
        res.status(500).json({ error: "AI service temporarily unavailable" });
        return;
      }

      // Set up streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

      if (!response.body) {
        res.write(`data: ${JSON.stringify({ error: "No response body" })}\n\n`);
        res.end();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } catch (streamError) {
        console.error("Stream processing error:", streamError);
        res.write(
          `data: ${JSON.stringify({ error: "Stream processing error" })}\n\n`
        );
      } finally {
        res.end();
      }
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({
          error: "Validation failed",
          details: (error as any).errors,
        });
        return;
      }
      console.error("Chat endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
