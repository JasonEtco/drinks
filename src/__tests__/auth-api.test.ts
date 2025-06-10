import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { authRouter } from '../server/auth.js';

// Mock database
vi.mock('../lib/database.js', () => ({
  database: {
    getUserByProviderId: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

describe('Authentication API', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());
    
    // Basic session configuration for testing
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    app.use('/auth', authRouter());
  });

  describe('GET /auth/me', () => {
    it('should return null user when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(200);

      expect(response.body).toEqual({ user: null });
    });
  });

  describe('OAuth routes without credentials', () => {
    it('should return 503 for GitHub OAuth when not configured', async () => {
      // Clear environment variables
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
      
      const response = await request(app)
        .get('/auth/github')
        .expect(503);

      expect(response.body.error).toBe('GitHub OAuth not configured');
    });

    it('should return 503 for Google OAuth when not configured', async () => {
      // Clear environment variables
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      
      const response = await request(app)
        .get('/auth/google')
        .expect(503);

      expect(response.body.error).toBe('Google OAuth not configured');
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });
  });
});