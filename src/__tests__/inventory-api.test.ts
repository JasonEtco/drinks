import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { inventoryRouter } from '../server/inventory';
import { TestDatabase } from './test-utils';
import { InventoryItem } from '../lib/types';

// Mock the database module
const testDb = new TestDatabase();

// Mock the database import
vi.mock('../lib/database.js', () => ({
  database: {
    listInventory: vi.fn(),
    getInventoryById: vi.fn(),
    getInventoryByBarcode: vi.fn(),
    createInventoryItem: vi.fn(),
    updateInventoryItem: vi.fn(),
    deleteInventoryItem: vi.fn(),
    searchInventory: vi.fn(),
  }
}));

import { database } from '../lib/database.js';

const app = express();
app.use(express.json());
app.use('/api/inventory', inventoryRouter());

const mockInventoryItem: InventoryItem = {
  id: '1',
  name: 'Test Gin',
  quantity: 750,
  unit: 'ml',
  barcode: '123456789012',
  category: 'spirits',
  notes: 'Premium gin',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('Inventory API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/inventory', () => {
    it('should return all inventory items', async () => {
      (database.listInventory as any).mockResolvedValue([mockInventoryItem]);

      const response = await request(app)
        .get('/api/inventory')
        .expect(200);

      expect(response.body).toEqual([mockInventoryItem]);
      expect(database.listInventory).toHaveBeenCalledOnce();
    });

    it('should handle database errors', async () => {
      (database.listInventory as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/inventory')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch inventory' });
    });
  });

  describe('GET /api/inventory/:id', () => {
    it('should return specific inventory item', async () => {
      (database.getInventoryById as any).mockResolvedValue(mockInventoryItem);

      const response = await request(app)
        .get('/api/inventory/1')
        .expect(200);

      expect(response.body).toEqual(mockInventoryItem);
      expect(database.getInventoryById).toHaveBeenCalledWith('1');
    });

    it('should return 404 when item not found', async () => {
      (database.getInventoryById as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/inventory/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Inventory item not found' });
    });
  });

  describe('GET /api/inventory/barcode/:barcode', () => {
    it('should return inventory item by barcode', async () => {
      (database.getInventoryByBarcode as any).mockResolvedValue(mockInventoryItem);

      const response = await request(app)
        .get('/api/inventory/barcode/123456789012')
        .expect(200);

      expect(response.body).toEqual(mockInventoryItem);
      expect(database.getInventoryByBarcode).toHaveBeenCalledWith('123456789012');
    });

    it('should return 404 when barcode not found', async () => {
      (database.getInventoryByBarcode as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/inventory/barcode/999999999999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Inventory item not found' });
    });
  });

  describe('POST /api/inventory', () => {
    const newItemData = {
      name: 'New Vodka',
      quantity: 1000,
      unit: 'ml',
      category: 'spirits',
    };

    it('should create new inventory item', async () => {
      const createdItem = { ...newItemData, id: '2', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' };
      (database.createInventoryItem as any).mockResolvedValue(createdItem);

      const response = await request(app)
        .post('/api/inventory')
        .send(newItemData)
        .expect(201);

      expect(response.body).toEqual(createdItem);
      expect(database.createInventoryItem).toHaveBeenCalledWith(newItemData);
    });

    it('should validate required fields', async () => {
      const invalidData = { name: 'Test' }; // missing quantity and unit

      const response = await request(app)
        .post('/api/inventory')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required fields: name, quantity, and unit are required'
      });
    });

    it('should validate positive quantity', async () => {
      const invalidData = { ...newItemData, quantity: -10 };

      const response = await request(app)
        .post('/api/inventory')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Quantity must be a positive number'
      });
    });
  });

  describe('PUT /api/inventory/:id', () => {
    const updateData = { quantity: 500, notes: 'Updated notes' };

    it('should update inventory item', async () => {
      const updatedItem = { ...mockInventoryItem, ...updateData, updatedAt: '2025-01-01T01:00:00.000Z' };
      (database.updateInventoryItem as any).mockResolvedValue(updatedItem);

      const response = await request(app)
        .put('/api/inventory/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedItem);
      expect(database.updateInventoryItem).toHaveBeenCalledWith('1', updateData);
    });

    it('should return 404 when item not found', async () => {
      (database.updateInventoryItem as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/inventory/999')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({ error: 'Inventory item not found' });
    });

    it('should validate quantity if provided', async () => {
      const invalidData = { quantity: -5 };

      const response = await request(app)
        .put('/api/inventory/1')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Quantity must be a positive number'
      });
    });
  });

  describe('DELETE /api/inventory/:id', () => {
    it('should delete inventory item', async () => {
      (database.deleteInventoryItem as any).mockResolvedValue(mockInventoryItem);

      const response = await request(app)
        .delete('/api/inventory/1')
        .expect(200);

      expect(response.body).toEqual(mockInventoryItem);
      expect(database.deleteInventoryItem).toHaveBeenCalledWith('1');
    });

    it('should return 404 when item not found', async () => {
      (database.deleteInventoryItem as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/inventory/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Inventory item not found' });
    });
  });

  describe('GET /api/inventory/search/:query', () => {
    it('should search inventory items', async () => {
      (database.searchInventory as any).mockResolvedValue([mockInventoryItem]);

      const response = await request(app)
        .get('/api/inventory/search/gin')
        .expect(200);

      expect(response.body).toEqual([mockInventoryItem]);
      expect(database.searchInventory).toHaveBeenCalledWith('gin');
    });

    it('should return empty array when no matches', async () => {
      (database.searchInventory as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/inventory/search/nonexistent')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});