import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

describe('Server Middleware and Error Handling', () => {
  describe('JSON Middleware', () => {
    it('should parse JSON requests correctly', async () => {
      const app = express();
      app.use(express.json());
      
      app.post('/test', (req: Request, res: Response) => {
        res.json({ received: req.body });
      });

      const testData = { name: 'Test Recipe', amount: 42 };
      
      const response = await request(app)
        .post('/test')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual(testData);
    });

    it('should handle JSON parsing errors', async () => {
      const app = express();
      app.use(express.json());
      
      app.post('/test', (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling Middleware', () => {
    it('should catch and handle thrown errors', async () => {
      const app = express();
      
      app.get('/error', (req: Request, res: Response, next: NextFunction) => {
        throw new Error('Test error');
      });

      // Error handling middleware
      app.use((err: any, req: any, res: any, next: NextFunction) => {
        res.status(500).json({ error: 'Something went wrong!' });
      });

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong!');
    });

    it('should handle async errors', async () => {
      const app = express();
      
      app.get('/async-error', async (req: Request, res: Response, next: NextFunction) => {
        try {
          throw new Error('Async error');
        } catch (error) {
          next(error);
        }
      });

      // Error handling middleware
      app.use((err: any, req: any, res: any, next: NextFunction) => {
        res.status(500).json({ error: 'Something went wrong!' });
      });

      const response = await request(app).get('/async-error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong!');
    });
  });

  describe('Route Not Found', () => {
    it('should handle requests to non-existent routes', async () => {
      const app = express();
      
      app.get('/existing', (req: Request, res: Response) => {
        res.json({ success: true });
      });

      // 404 handler
      app.use((req: Request, res: Response) => {
        res.status(404).json({ error: 'Route not found' });
      });

      const response = await request(app).get('/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('CORS and Headers', () => {
    it('should handle requests with various headers', async () => {
      const app = express();
      app.use(express.json());
      
      app.get('/headers', (req: Request, res: Response) => {
        res.json({
          userAgent: req.headers['user-agent'],
          contentType: req.headers['content-type'],
          accept: req.headers['accept']
        });
      });

      const response = await request(app)
        .get('/headers')
        .set('User-Agent', 'Test Agent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.userAgent).toBe('Test Agent');
      expect(response.body.accept).toBe('application/json');
    });
  });

  describe('Request Timeout and Large Payloads', () => {
    it('should handle request with large JSON payload', async () => {
      const app = express();
      app.use(express.json({ limit: '10mb' }));
      
      app.post('/large', (req: Request, res: Response) => {
        res.json({ 
          received: Object.keys(req.body).length,
          size: JSON.stringify(req.body).length 
        });
      });

      // Create a reasonably large object
      const largeData: any = {};
      for (let i = 0; i < 10000; i++) {
        largeData[`key${i}`] = `value${i}`.repeat(10);
      }

      const response = await request(app)
        .post('/large')
        .send(largeData);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(10000);
      expect(response.body.size).toBeGreaterThan(100000);
    });
  });

  describe('Query Parameter Parsing', () => {
    it('should handle complex query parameters', async () => {
      const app = express();
      
      app.get('/query', (req: Request, res: Response) => {
        res.json({
          query: req.query,
          searchQuery: req.query.q,
          filters: req.query.filter,
          limit: req.query.limit
        });
      });

      const response = await request(app)
        .get('/query')
        .query({
          q: 'search term',
          filter: ['active', 'featured'],
          limit: '10',
          sort: 'name'
        });

      expect(response.status).toBe(200);
      expect(response.body.searchQuery).toBe('search term');
      expect(response.body.query.sort).toBe('name');
      expect(response.body.query.limit).toBe('10');
    });

    it('should handle encoded query parameters', async () => {
      const app = express();
      
      app.get('/encoded', (req: Request, res: Response) => {
        res.json({ query: req.query });
      });

      const response = await request(app)
        .get('/encoded?q=hello%20world&special=%22quotes%22');

      expect(response.status).toBe(200);
      expect(response.body.query.q).toBe('hello world');
      expect(response.body.query.special).toBe('"quotes"');
    });
  });

  describe('HTTP Methods', () => {
    it('should support all REST methods', async () => {
      const app = express();
      app.use(express.json());
      
      const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;
      
      methods.forEach(method => {
        app[method]('/test', (req: Request, res: Response) => {
          res.json({ method: req.method.toUpperCase() });
        });
      });

      for (const method of methods) {
        const response = await request(app)[method]('/test');
        expect(response.status).toBe(200);
        expect(response.body.method).toBe(method.toUpperCase());
      }
    });

    it('should handle OPTIONS requests', async () => {
      const app = express();
      
      app.options('/test', (req: Request, res: Response) => {
        res.set('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
        res.status(200).end();
      });

      const response = await request(app).options('/test');

      expect(response.status).toBe(200);
      expect(response.headers.allow).toBe('GET, POST, PUT, DELETE, OPTIONS');
    });
  });

  describe('Content Negotiation', () => {
    it('should handle different Accept headers', async () => {
      const app = express();
      
      app.get('/content', (req: Request, res: Response) => {
        const acceptsJSON = req.accepts('json');
        const acceptsText = req.accepts('text');
        
        if (acceptsJSON) {
          res.json({ format: 'json' });
        } else if (acceptsText) {
          res.type('text').send('format: text');
        } else {
          res.status(406).send('Not Acceptable');
        }
      });

      // Test JSON accept
      const jsonResponse = await request(app)
        .get('/content')
        .set('Accept', 'application/json');

      expect(jsonResponse.status).toBe(200);
      expect(jsonResponse.body.format).toBe('json');

      // Test text accept
      const textResponse = await request(app)
        .get('/content')
        .set('Accept', 'text/plain');

      expect(textResponse.status).toBe(200);
      expect(textResponse.text).toBe('format: text');
    });
  });
});