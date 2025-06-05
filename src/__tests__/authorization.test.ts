import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { UserRole, authenticateUser, requireEditor, requireEditorAuth } from '../server/auth';

describe('Authorization Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
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
});