export interface ProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  ingredients?: string[];
  imageUrl?: string;
  size?: string;
  alcoholContent?: string;
}

export interface ProductLookupService {
  lookupProduct(barcode: string): Promise<ProductInfo | null>;
}

// Open Food Facts API service for food and beverage products
class OpenFoodFactsService implements ProductLookupService {
  private readonly baseUrl = 'https://world.openfoodfacts.org/api/v0/product';

  async lookupProduct(barcode: string): Promise<ProductInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${barcode}.json`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.status !== 1 || !data.product) {
        return null;
      }

      const product = data.product;
      
      return {
        barcode,
        name: product.product_name || product.product_name_en || 'Unknown Product',
        brand: product.brands || undefined,
        category: product.categories || undefined,
        ingredients: product.ingredients_text ? [product.ingredients_text] : undefined,
        imageUrl: product.image_front_url || product.image_url || undefined,
        size: product.quantity || undefined,
        alcoholContent: product.alcohol_100g ? `${product.alcohol_100g}%` : undefined,
      };
    } catch (error) {
      console.error('Error fetching from Open Food Facts:', error);
      return null;
    }
  }
}

// UPC Item DB service as a fallback
class UPCItemDBService implements ProductLookupService {
  private readonly baseUrl = 'https://api.upcitemdb.com/prod/trial/lookup';

  async lookupProduct(barcode: string): Promise<ProductInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}?upc=${barcode}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return null;
      }

      const item = data.items[0];
      
      return {
        barcode,
        name: item.title || 'Unknown Product',
        brand: item.brand || undefined,
        category: item.category || undefined,
        imageUrl: item.images?.[0] || undefined,
        size: item.size || undefined,
      };
    } catch (error) {
      console.error('Error fetching from UPC Item DB:', error);
      return null;
    }
  }
}

// Composite service that tries multiple APIs
class CompositeProductLookupService implements ProductLookupService {
  private services: ProductLookupService[] = [
    new OpenFoodFactsService(),
    new UPCItemDBService(),
  ];

  async lookupProduct(barcode: string): Promise<ProductInfo | null> {
    for (const service of this.services) {
      try {
        const result = await service.lookupProduct(barcode);
        if (result) {
          return result;
        }
      } catch (error) {
        console.error(`Service failed for barcode ${barcode}:`, error);
        // Continue to next service
      }
    }
    
    return null;
  }
}

// Export the main service instance
export const productLookupService = new CompositeProductLookupService();

// Utility function to suggest category and unit based on product info
export function suggestInventoryDetails(productInfo: ProductInfo): {
  category: string;
  unit: string;
  defaultQuantity: number;
} {
  const name = productInfo.name.toLowerCase();
  const category = productInfo.category?.toLowerCase() || '';
  
  // Detect alcoholic beverages
  if (
    name.includes('wine') ||
    name.includes('beer') ||
    name.includes('whiskey') ||
    name.includes('whisky') ||
    name.includes('vodka') ||
    name.includes('gin') ||
    name.includes('rum') ||
    name.includes('tequila') ||
    name.includes('brandy') ||
    name.includes('liqueur') ||
    name.includes('champagne') ||
    name.includes('prosecco') ||
    name.includes('cognac') ||
    name.includes('bourbon') ||
    name.includes('scotch') ||
    productInfo.alcoholContent
  ) {
    // Detect bottle sizes
    const size = productInfo.size?.toLowerCase() || '';
    let defaultQuantity = 750; // Default wine/spirits bottle
    
    if (size.includes('375ml') || size.includes('375 ml')) {
      defaultQuantity = 375;
    } else if (size.includes('750ml') || size.includes('750 ml')) {
      defaultQuantity = 750;
    } else if (size.includes('1l') || size.includes('1 l') || size.includes('1000ml')) {
      defaultQuantity = 1000;
    } else if (size.includes('1.75l') || size.includes('1750ml')) {
      defaultQuantity = 1750;
    } else if (name.includes('beer') || name.includes('ale') || name.includes('lager')) {
      defaultQuantity = 330; // Beer bottle/can
    }
    
    return {
      category: 'Spirits',
      unit: 'ml',
      defaultQuantity,
    };
  }
  
  // Detect mixers and soft drinks
  if (
    name.includes('tonic') ||
    name.includes('soda') ||
    name.includes('cola') ||
    name.includes('ginger ale') ||
    name.includes('club soda') ||
    name.includes('sparkling water') ||
    name.includes('juice') ||
    name.includes('syrup') ||
    category.includes('beverage')
  ) {
    return {
      category: 'Mixers',
      unit: 'ml',
      defaultQuantity: 500,
    };
  }
  
  // Detect garnishes and ingredients
  if (
    name.includes('lime') ||
    name.includes('lemon') ||
    name.includes('orange') ||
    name.includes('cherry') ||
    name.includes('olive') ||
    name.includes('salt') ||
    name.includes('sugar') ||
    name.includes('bitters') ||
    category.includes('fruit') ||
    category.includes('spice')
  ) {
    return {
      category: 'Garnishes',
      unit: 'piece',
      defaultQuantity: 1,
    };
  }
  
  // Default case
  return {
    category: 'Other',
    unit: 'piece',
    defaultQuantity: 1,
  };
}