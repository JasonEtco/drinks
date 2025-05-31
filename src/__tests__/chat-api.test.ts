#!/usr/bin/env node

// Simple test script for the chat API endpoint
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ChatMessageSchema } from '../lib/validation';

// Mock server with just the chat endpoint for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock chat endpoint for testing
  app.post("/api/chat", async (req, res) => {
    try {
      // Validate input using Zod schema
      const validatedData = ChatMessageSchema.parse(req.body);
      const { message } = validatedData;

      // Mock response for testing (since we don't have GitHub token in tests)
      const mockResponse = `Here's a great cocktail suggestion based on your request: "${message}"\n\n**Classic Margarita**\n- 2 oz Tequila\n- 1 oz Fresh lime juice\n- 1 oz Triple sec\n\nShake with ice, strain into salt-rimmed glass. Garnish with lime wheel.`;
      
      res.json({ response: mockResponse });
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({ 
          error: "Validation failed", 
          details: (error as any).errors 
        });
        return;
      }
      console.error("Chat endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  return app;
};

describe('Chat API Endpoint', () => {
  it('should respond to chat messages with cocktail suggestions', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Suggest a refreshing summer cocktail' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
    expect(typeof response.body.response).toBe('string');
    expect(response.body.response.length).toBeGreaterThan(0);
  });

  it('should handle missing message', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('should handle empty message', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('should handle non-string message', async () => {
    const app = createTestApp();
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 123 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('should handle message that is too long', async () => {
    const app = createTestApp();
    const longMessage = 'a'.repeat(1001); // Over the 1000 char limit
    
    const response = await request(app)
      .post('/api/chat')
      .send({ message: longMessage });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });
});