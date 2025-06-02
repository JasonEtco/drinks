import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { chatRouter } from '../server/chat.js';

// Mock environment variables
process.env.GITHUB_TOKEN = 'mock-token';
process.env.CHAT_MODEL = 'openai/gpt-4o';

// Mock the AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      recipes: [
        {
          name: "Test Cocktail",
          ingredients: [
            { name: "Gin", amount: 2, unit: "oz" },
            { name: "Lemon juice", amount: 0.75, unit: "oz" }
          ],
          instructions: "Shake with ice and strain into coupe glass",
          glass: "Coupe",
          garnish: "Lemon twist",
          category: "Classic"
        }
      ],
      reasoning: "Based on the conversation about refreshing drinks, I suggested a classic gin cocktail."
    }
  }),
  streamText: vi.fn().mockReturnValue({
    pipeDataStreamToResponse: vi.fn()
  })
}));

// Mock database
vi.mock('../lib/database.js', () => ({
  database: {
    listRecipes: vi.fn().mockResolvedValue([])
  }
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter());
  return app;
}

describe('Recipe Generation API', () => {
  it('should generate recipes from chat messages', async () => {
    const app = createTestApp();
    
    const messages = [
      { role: "user", content: "I want something refreshing with gin" },
      { role: "assistant", content: "I'd recommend a classic Gin & Tonic or perhaps a Gimlet!" }
    ];
    
    const response = await request(app)
      .post('/api/chat/generate-recipe')
      .send({ messages });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('recipes');
    expect(response.body).toHaveProperty('reasoning');
    expect(Array.isArray(response.body.recipes)).toBe(true);
    expect(response.body.recipes.length).toBeGreaterThan(0);
    
    const recipe = response.body.recipes[0];
    expect(recipe).toHaveProperty('name');
    expect(recipe).toHaveProperty('ingredients');
    expect(recipe).toHaveProperty('instructions');
    expect(Array.isArray(recipe.ingredients)).toBe(true);
  });

  it('should handle missing messages', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat/generate-recipe')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Messages array is required');
  });

  it('should handle empty messages array', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat/generate-recipe')
      .send({ messages: [] });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('At least one message is required to generate recipes');
  });

  it('should handle invalid messages format', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat/generate-recipe')
      .send({ messages: "not an array" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Messages array is required');
  });

  it('should include proper recipe structure in response', async () => {
    const app = createTestApp();
    
    const messages = [
      { role: "user", content: "Can you suggest a margarita recipe?" },
      { role: "assistant", content: "Here's a classic margarita: 2 oz tequila, 1 oz lime juice, 0.75 oz triple sec. Shake with ice." }
    ];
    
    const response = await request(app)
      .post('/api/chat/generate-recipe')
      .send({ messages });

    expect(response.status).toBe(200);
    
    const recipe = response.body.recipes[0];
    expect(recipe.name).toBe("Test Cocktail");
    expect(recipe.ingredients).toHaveLength(2);
    expect(recipe.ingredients[0]).toEqual({
      name: "Gin",
      amount: 2,
      unit: "oz"
    });
    expect(recipe.instructions).toContain("Shake with ice");
    expect(recipe.glass).toBe("Coupe");
    expect(recipe.garnish).toBe("Lemon twist");
    expect(recipe.category).toBe("Classic");
  });
});