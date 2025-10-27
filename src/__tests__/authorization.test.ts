import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticateUser, requireEditorAuth } from '../server/auth';

// Mock jose library
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: vi.fn(),
}));

describe('Authorization Middleware', () => {
  let app: express.Application;
  let mockJwtVerify: any;

  beforeEach(async () => {
    const { jwtVerify } = await import('jose');
    mockJwtVerify = jwtVerify as any;
    
    app = express();
    app.use(express.json());
    
    // Mock environment variables
    process.env.CLOUDFLARE_TEAM_DOMAIN = 'https://example.cloudflareaccess.com';
    process.env.WRITER_USERS = 'editor@example.com,admin@example.com';
    
    // Test endpoints with different auth requirements
    app.get('/public', (req, res) => {
      res.json({ message: 'public endpoint' });
    });
    
    app.get('/authenticated', authenticateUser, (req: any, res) => {
      res.json({ 
        message: 'authenticated endpoint',
        writer: req.writer
      });
    });
    
    app.post('/editor-only', requireEditorAuth, (req: any, res) => {
      res.json({ 
        message: 'editor only endpoint',
        writer: req.writer 
      });
    });
    
    app.put('/editor-only', requireEditorAuth, (req: any, res) => {
      res.json({ 
        message: 'editor only endpoint',
        writer: req.writer
      });
    });

    app.delete('/editor-only', requireEditorAuth, (req: any, res) => {
      res.json({ 
        message: 'editor only endpoint',
        writer: req.writer
      });
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Public Endpoints', () => {
    it('should allow access without CF_Authorization header', async () => {
      const response = await request(app)
        .get('/public');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('public endpoint');
    });
  });

  describe('Authentication with JWT Tokens', () => {
    it('should authenticate user with valid JWT and writer email', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'editor@example.com' }
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.writer).toBe(true);
      expect(mockJwtVerify).toHaveBeenCalledWith(
        'valid-jwt-token',
        'mock-jwks',
        { issuer: 'https://example.cloudflareaccess.com' }
      );
    });

    it('should authenticate user with valid JWT and non-writer email', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'viewer@example.com' }
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.writer).toBe(false);
    });

    it('should reject request without CF_Authorization header', async () => {
      const response = await request(app)
        .get('/authenticated');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing CF_Authorization header');
    });

    it('should reject request with invalid JWT token', async () => {
      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'invalid-jwt-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header');
    });

    it('should reject JWT without email payload', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: 'user-id' } // Missing email
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'jwt-without-email');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header');
    });

    it('should reject JWT with non-string email', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 123 } // Email is not a string
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'jwt-with-invalid-email');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header');
    });
  });

  describe('Editor Authorization', () => {
    it('should allow writer users to access editor endpoints', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'admin@example.com' }
      });

      const response = await request(app)
        .post('/editor-only')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.writer).toBe(true);
    });

    it('should deny non-writer users access to editor endpoints', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'viewer@example.com' }
      });

      const response = await request(app)
        .post('/editor-only')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
      expect(response.body.message).toBe('Editor role required for this operation');
    });

    it('should handle PUT requests for writer users', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'editor@example.com' }
      });

      const response = await request(app)
        .put('/editor-only')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.writer).toBe(true);
    });

    it('should handle DELETE requests for writer users', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'editor@example.com' }
      });

      const response = await request(app)
        .delete('/editor-only')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.writer).toBe(true);
    });

    it('should deny DELETE requests for non-writer users', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'viewer@example.com' }
      });

      const response = await request(app)
        .delete('/editor-only')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('Multiple Writer Emails', () => {
    it('should recognize first writer email in list', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'editor@example.com' }
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.writer).toBe(true);
    });

    it('should recognize second writer email in list', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'admin@example.com' }
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.writer).toBe(true);
    });

    it('should not recognize email not in writer list', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { email: 'stranger@example.com' }
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.writer).toBe(false);
    });
  });
});