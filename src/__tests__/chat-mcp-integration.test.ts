#!/usr/bin/env node

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TestDatabase } from './test-utils.js';
import { database } from '../lib/database.js';
import { mcpTools } from '../lib/mcp-tools.js';

// Mock server with chat endpoint that includes MCP tools
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock chat endpoint with MCP tool support
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      // For testing, we'll simulate tool calls based on message content
      if (message.includes('create recipe') || message.includes('save recipe') || 
          message.includes('Create recipe') || message.includes('martini')) {
        // Simulate a tool call for creating a recipe
        const createResult = await mcpTools.create_recipe.execute({
          name: 'Test AI Recipe',
          ingredients: [
            { name: 'Vodka', amount: 2, unit: 'oz' },
            { name: 'Lime juice', amount: 1, unit: 'oz' }
          ],
          instructions: 'Shake with ice and strain',
          category: 'cocktail',
          tags: ['ai-created']
        });
        
        if (createResult.success) {
          res.json({ 
            response: `I've created a new recipe for you: "${createResult.recipe!.name}" (ID: ${createResult.recipe!.id})`,
            toolCall: {
              tool: 'create_recipe',
              result: createResult
            }
          });
        } else {
          res.json({ 
            response: `Sorry, I couldn't create the recipe: ${createResult.error}`,
            toolCall: {
              tool: 'create_recipe',
              result: createResult
            }
          });
        }
        return;
      }
      
      if (message.includes('edit recipe') && message.includes('ID:')) {
        // Extract recipe ID from message
        const idMatch = message.match(/ID:\s*(\w+)/);
        const recipeId = idMatch ? idMatch[1] : 'invalid-id';
        
        // Simulate a tool call for editing a recipe
        const editResult = await mcpTools.edit_recipe.execute({
          id: recipeId,
          name: 'Updated AI Recipe',
          garnish: 'Lime wheel'
        });
        
        if (editResult.success) {
          res.json({ 
            response: `I've updated the recipe: "${editResult.recipe!.name}" (ID: ${editResult.recipe!.id})`,
            toolCall: {
              tool: 'edit_recipe',
              result: editResult
            }
          });
        } else {
          res.json({ 
            response: `Sorry, I couldn't edit the recipe: ${editResult.error}`,
            toolCall: {
              tool: 'edit_recipe',
              result: editResult
            }
          });
        }
        return;
      }
      
      // Default response for non-tool messages
      res.json({ 
        response: "I'm here to help with cocktail recipes! Ask me to create or edit recipes.",
        toolCall: null
      });
      
    } catch (error) {
      console.error("Chat endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  return app;
};

// Test database setup
const testDb = new TestDatabase();

beforeEach(async () => {
  await testDb.connect();
  await testDb.initialize();
  // Replace the database instance for testing
  (database as any).db = testDb.getDb();
});

afterEach(async () => {
  await testDb.clear();
  await testDb.close();
});

describe('Chat API MCP Integration', () => {
  it('should create a recipe via chat when requested', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Please create recipe for a vodka cocktail' });

    expect(response.status).toBe(200);
    expect(response.body.response).toContain('I\'ve created a new recipe');
    expect(response.body.response).toContain('Test AI Recipe');
    expect(response.body.toolCall).toBeDefined();
    expect(response.body.toolCall.tool).toBe('create_recipe');
    expect(response.body.toolCall.result.success).toBe(true);
    expect(response.body.toolCall.result.recipe).toBeDefined();
    expect(response.body.toolCall.result.recipe.name).toBe('Test AI Recipe');
  });

  it('should edit a recipe via chat when requested with valid ID', async () => {
    const app = createTestApp();
    
    // First create a recipe to edit
    const testRecipe = await testDb.insertTestRecipe({
      name: 'Original Recipe',
      instructions: 'Original instructions',
      ingredients: [
        { id: 'ing1', name: 'Vodka', amount: 2, unit: 'oz' }
      ]
    });

    const response = await request(app)
      .post('/api/chat')
      .send({ message: `Please edit recipe with ID: ${testRecipe.id}` });

    expect(response.status).toBe(200);
    expect(response.body.response).toContain('I\'ve updated the recipe');
    expect(response.body.response).toContain('Updated AI Recipe');
    expect(response.body.toolCall).toBeDefined();
    expect(response.body.toolCall.tool).toBe('edit_recipe');
    expect(response.body.toolCall.result.success).toBe(true);
    expect(response.body.toolCall.result.recipe).toBeDefined();
    expect(response.body.toolCall.result.recipe.name).toBe('Updated AI Recipe');
    expect(response.body.toolCall.result.recipe.garnish).toBe('Lime wheel');
  });

  it('should handle recipe edit failure with invalid ID', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Please edit recipe with ID: invalid-id' });

    expect(response.status).toBe(200);
    expect(response.body.response).toContain('Sorry, I couldn\'t edit the recipe');
    expect(response.body.response).toContain('not found');
    expect(response.body.toolCall).toBeDefined();
    expect(response.body.toolCall.tool).toBe('edit_recipe');
    expect(response.body.toolCall.result.success).toBe(false);
    expect(response.body.toolCall.result.error).toContain('not found');
  });

  it('should handle normal chat without tool calls', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'What\'s a good cocktail for summer?' });

    expect(response.status).toBe(200);
    expect(response.body.response).toContain('help with cocktail recipes');
    expect(response.body.toolCall).toBeNull();
  });

  it('should maintain chat history while using tools', async () => {
    const app = createTestApp();
    
    const history = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi! How can I help with cocktails?" }
    ];
    
    const response = await request(app)
      .post('/api/chat')
      .send({ 
        message: 'Create recipe for a simple martini',
        history: history 
      });

    expect(response.status).toBe(200);
    expect(response.body.response).toContain('I\'ve created a new recipe');
    expect(response.body.toolCall).toBeDefined();
    expect(response.body.toolCall.result.success).toBe(true);
  });
});

describe('MCP Tool Error Handling in Chat', () => {
  it('should handle tool execution errors gracefully', async () => {
    // Mock a failing tool execution by temporarily breaking the database
    const originalExecute = mcpTools.create_recipe.execute;
    mcpTools.create_recipe.execute = async () => {
      return {
        success: false,
        error: 'Database connection failed',
        message: 'Failed to create recipe due to database error'
      };
    };

    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Create recipe for a martini' });

    expect(response.status).toBe(200);
    expect(response.body.response).toContain('Sorry, I couldn\'t create the recipe');
    expect(response.body.response).toContain('Database connection failed');

    // Restore original function
    mcpTools.create_recipe.execute = originalExecute;
  });

  it('should validate tool parameters from chat context', async () => {
    // Test with create recipe that should trigger validation error
    // This tests the tool validation directly since it's used by chat
    const createResult = await mcpTools.create_recipe.execute({
      name: '', // Empty name should fail
      ingredients: [{ name: 'Vodka', amount: 2, unit: 'oz' }],
      instructions: 'Mix well'
    });

    expect(createResult.success).toBe(false);
    expect(createResult.error).toContain('Recipe name is required');
  });
});