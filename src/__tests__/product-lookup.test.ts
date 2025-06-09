import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productLookupService, suggestInventoryDetails, ProductInfo } from '../lib/productLookup';

// Mock fetch globally
global.fetch = vi.fn();

describe('Product Lookup Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('productLookupService', () => {
    it('should return product info from Open Food Facts API', async () => {
      const mockResponse = {
        status: 1,
        product: {
          product_name: 'Grey Goose Vodka',
          brands: 'Grey Goose',
          categories: 'Spirits',
          ingredients_text: 'Vodka',
          image_front_url: 'https://example.com/image.jpg',
          quantity: '750ml',
          alcohol_100g: '40'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await productLookupService.lookupProduct('1234567890');

      expect(result).toEqual({
        barcode: '1234567890',
        name: 'Grey Goose Vodka',
        brand: 'Grey Goose',
        category: 'Spirits',
        ingredients: ['Vodka'],
        imageUrl: 'https://example.com/image.jpg',
        size: '750ml',
        alcoholContent: '40%'
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://world.openfoodfacts.org/api/v0/product/1234567890.json'
      );
    });

    it('should fallback to UPC Item DB when Open Food Facts fails', async () => {
      const mockUPCResponse = {
        items: [{
          title: 'Johnnie Walker Black Label',
          brand: 'Johnnie Walker',
          category: 'Whisky',
          images: ['https://example.com/jw.jpg'],
          size: '750ml'
        }]
      };

      // First call (Open Food Facts) fails
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0 })
      });

      // Second call (UPC Item DB) succeeds
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUPCResponse)
      });

      const result = await productLookupService.lookupProduct('0987654321');

      expect(result).toEqual({
        barcode: '0987654321',
        name: 'Johnnie Walker Black Label',
        brand: 'Johnnie Walker',
        category: 'Whisky',
        imageUrl: 'https://example.com/jw.jpg',
        size: '750ml'
      });

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return null when no product is found', async () => {
      // Open Food Facts fails
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0 })
      });

      // UPC Item DB fails
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] })
      });

      const result = await productLookupService.lookupProduct('invalid');

      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await productLookupService.lookupProduct('1234567890');

      expect(result).toBeNull();
    });
  });

  describe('suggestInventoryDetails', () => {
    it('should suggest spirits category for vodka', () => {
      const productInfo: ProductInfo = {
        barcode: '123',
        name: 'Grey Goose Vodka',
        brand: 'Grey Goose',
        size: '750ml'
      };

      const result = suggestInventoryDetails(productInfo);

      expect(result).toEqual({
        category: 'Spirits',
        unit: 'ml',
        defaultQuantity: 750
      });
    });

    it('should suggest spirits category for wine', () => {
      const productInfo: ProductInfo = {
        barcode: '123',
        name: 'Chardonnay Wine',
        size: '750ml'
      };

      const result = suggestInventoryDetails(productInfo);

      expect(result).toEqual({
        category: 'Spirits',
        unit: 'ml',
        defaultQuantity: 750
      });
    });

    it('should suggest beer quantity for beer products', () => {
      const productInfo: ProductInfo = {
        barcode: '123',
        name: 'Heineken Beer',
        size: '330ml'
      };

      const result = suggestInventoryDetails(productInfo);

      expect(result).toEqual({
        category: 'Spirits',
        unit: 'ml',
        defaultQuantity: 330
      });
    });

    it('should suggest mixers category for tonic', () => {
      const productInfo: ProductInfo = {
        barcode: '123',
        name: 'Schweppes Tonic Water',
        brand: 'Schweppes'
      };

      const result = suggestInventoryDetails(productInfo);

      expect(result).toEqual({
        category: 'Mixers',
        unit: 'ml',
        defaultQuantity: 500
      });
    });

    it('should suggest garnishes for lime', () => {
      const productInfo: ProductInfo = {
        barcode: '123',
        name: 'Fresh Lime',
        category: 'fruit'
      };

      const result = suggestInventoryDetails(productInfo);

      expect(result).toEqual({
        category: 'Garnishes',
        unit: 'piece',
        defaultQuantity: 1
      });
    });

    it('should handle products with alcohol content', () => {
      const productInfo: ProductInfo = {
        barcode: '123',
        name: 'Some Alcohol',
        alcoholContent: '40%'
      };

      const result = suggestInventoryDetails(productInfo);

      expect(result).toEqual({
        category: 'Spirits',
        unit: 'ml',
        defaultQuantity: 750
      });
    });

    it('should default to Other category for unknown products', () => {
      const productInfo: ProductInfo = {
        barcode: '123',
        name: 'Unknown Product'
      };

      const result = suggestInventoryDetails(productInfo);

      expect(result).toEqual({
        category: 'Other',
        unit: 'piece',
        defaultQuantity: 1
      });
    });

    it('should parse different bottle sizes correctly', () => {
      const testCases = [
        { size: '375ml', expected: 375 },
        { size: '750 ml', expected: 750 },
        { size: '1L', expected: 1000 },
        { size: '1.75l', expected: 1750 },
      ];

      testCases.forEach(({ size, expected }) => {
        const productInfo: ProductInfo = {
          barcode: '123',
          name: 'Test Vodka',
          size
        };

        const result = suggestInventoryDetails(productInfo);
        expect(result.defaultQuantity).toBe(expected);
      });
    });
  });
});