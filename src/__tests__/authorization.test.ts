import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { UserRole, authenticateUser, requireEditor, requireEditorAuth } from '../server/auth';

// Mock fetch for Cloudflare public key
global.fetch = vi.fn();

// Mock crypto module
vi.mock('crypto', () => ({
  default: {
    createVerify: vi.fn(() => ({
      update: vi.fn(),
      verify: vi.fn(() => true), // Default to valid signature
    })),
  },
}));

describe('Authorization Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock environment variables
    process.env.CLOUDFLARE_PUBLIC_SIGNING_KEY_URL = 'https://example.com/public-key';
    
    // Mock fetch to return a valid public key
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('-----BEGIN PUBLIC KEY-----\nMOCK_PUBLIC_KEY\n-----END PUBLIC KEY-----'),
    });
    
    // Test endpoints with different auth requirements
    app.get('/public', (req, res) => {
      res.json({ message: 'public endpoint' });
    });
    
    app.get('/authenticated', authenticateUser, (req: any, res) => {
      res.json({ 
        message: 'authenticated endpoint',
        user: req.user 
      });
    });
    
    app.post('/editor-only', requireEditorAuth, (req: any, res) => {
      res.json({ 
        message: 'editor only endpoint',
        user: req.user 
      });
    });
    
    app.put('/editor-only', requireEditorAuth, (req: any, res) => {
      res.json({ 
        message: 'editor only endpoint',
        user: req.user 
      });
    });
    
    app.delete('/editor-only', requireEditorAuth, (req: any, res) => {
      res.json({ 
        message: 'editor only endpoint',
        user: req.user 
      });
    });
    
    // Reset mocks
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

  describe('CF_Authorization Header Parsing', () => {
    it('should parse simple user identifier', async () => {
      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('test-user');
      expect(response.body.user.role).toBe(UserRole.VIEWER); // default role
    });

    it('should parse user:role format', async () => {
      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'test-user:editor');

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('test-user');
      expect(response.body.user.role).toBe(UserRole.EDITOR);
    });

    it('should parse JSON format', async () => {
      const authData = JSON.stringify({ user: 'test-user', role: 'editor' });
      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', authData);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('test-user');
      expect(response.body.user.role).toBe(UserRole.EDITOR);
    });

    it('should parse valid JWT token', async () => {
      // Create a mock JWT token (header.payload.signature)
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: 'jwt-user', 
        role: 'editor',
        exp: Math.floor(Date.now() / 1000) + 3600 // expires in 1 hour
      }));
      const signature = 'mock-signature';
      const jwtToken = `${header}.${payload}.${signature}`;

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', jwtToken);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('jwt-user');
      expect(response.body.user.role).toBe(UserRole.EDITOR);
    });

    it('should reject JWT with invalid signature', async () => {
      // Mock crypto to return false for signature verification
      const crypto = await import('crypto');
      const mockVerify = vi.fn().mockReturnValue(false);
      crypto.default.createVerify = vi.fn(() => ({
        update: vi.fn(),
        verify: mockVerify,
      })) as any;

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: 'jwt-user', 
        role: 'editor',
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      const signature = 'invalid-signature';
      const jwtToken = `${header}.${payload}.${signature}`;

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', jwtToken);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header format');
    });

    it('should reject expired JWT token', async () => {
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: 'jwt-user', 
        role: 'editor',
        exp: Math.floor(Date.now() / 1000) - 3600 // expired 1 hour ago
      }));
      const signature = 'mock-signature';
      const jwtToken = `${header}.${payload}.${signature}`;

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', jwtToken);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header format');
    });

    it('should handle JWT with unsupported algorithm', async () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); // Wrong algorithm
      const payload = btoa(JSON.stringify({ 
        sub: 'jwt-user', 
        role: 'editor',
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      const signature = 'mock-signature';
      const jwtToken = `${header}.${payload}.${signature}`;

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', jwtToken);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header format');
    });

    it('should handle JWT with missing user identifier', async () => {
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        role: 'editor',
        exp: Math.floor(Date.now() / 1000) + 3600
        // No sub, email, preferred_username, or name
      }));
      const signature = 'mock-signature';
      const jwtToken = `${header}.${payload}.${signature}`;

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', jwtToken);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header format');
    });

    it('should handle failure to fetch Cloudflare public key', async () => {
      // Mock fetch to fail
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: 'jwt-user', 
        role: 'editor',
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      const signature = 'mock-signature';
      const jwtToken = `${header}.${payload}.${signature}`;

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', jwtToken);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header format');
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', '{"invalid": json}');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid CF_Authorization header format');
    });

    it('should use default role mapping for known users', async () => {
      // Set up environment variable for this test
      process.env.USER_ROLE_MAPPING = JSON.stringify({
        'admin': 'editor',
        'guest': 'viewer'
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('admin');
      expect(response.body.user.role).toBe(UserRole.EDITOR);
      
      // Clean up
      delete process.env.USER_ROLE_MAPPING;
    });
  });

  describe('Authentication Requirements', () => {
    it('should reject requests without CF_Authorization header', async () => {
      const response = await request(app)
        .get('/authenticated');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing CF_Authorization header');
    });

    it('should accept valid CF_Authorization header', async () => {
      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'valid-user');

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('valid-user');
    });
  });

  describe('Role-Based Authorization', () => {
    it('should allow editor to access editor-only endpoints', async () => {
      const response = await request(app)
        .post('/editor-only')
        .set('CF_Authorization', 'test-user:editor')
        .send({ data: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('editor only endpoint');
      expect(response.body.user.role).toBe(UserRole.EDITOR);
    });

    it('should deny viewer access to editor-only POST endpoint', async () => {
      const response = await request(app)
        .post('/editor-only')
        .set('CF_Authorization', 'test-user:viewer')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
      expect(response.body.message).toBe('Editor role required for this operation');
    });

    it('should deny viewer access to editor-only PUT endpoint', async () => {
      const response = await request(app)
        .put('/editor-only')
        .set('CF_Authorization', 'test-user:viewer')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should deny viewer access to editor-only DELETE endpoint', async () => {
      const response = await request(app)
        .delete('/editor-only')
        .set('CF_Authorization', 'test-user:viewer');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .post('/editor-only')
        .send({ data: 'test' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing CF_Authorization header');
    });
  });

  describe('Default Role Assignment', () => {
    it('should assign viewer role by default for unknown users', async () => {
      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'unknown-user');

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe(UserRole.VIEWER);
    });

    it('should respect explicit role over default mapping', async () => {
      process.env.USER_ROLE_MAPPING = JSON.stringify({
        'test-user': 'viewer'
      });

      const response = await request(app)
        .get('/authenticated')
        .set('CF_Authorization', 'test-user:editor');

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe(UserRole.EDITOR);
      
      delete process.env.USER_ROLE_MAPPING;
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.CLOUDFLARE_PUBLIC_SIGNING_KEY_URL;
    delete process.env.USER_ROLE_MAPPING;
    
    // Reset mocks
    vi.clearAllMocks();
  });
});