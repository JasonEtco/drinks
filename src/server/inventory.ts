import { Router, Request, Response } from "express";
import { database } from "../lib/database.js";
import { InventoryItem } from "../lib/types.js";

export function inventoryRouter(): Router {
  const router = Router()

  // Get all inventory items
  router.get("/", async (_: Request, res: Response) => {
    try {
      const inventory = await database.listInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Search inventory items (must come before /:id route)
  router.get("/search/:query", async (req: Request, res: Response) => {
    try {
      const { query } = req.params;
      const items = await database.searchInventory(query);
      res.json(items);
    } catch (error) {
      console.error("Error searching inventory:", error);
      res.status(500).json({ error: "Failed to search inventory" });
    }
  });

  // Get inventory item by barcode (must come before /:id route)
  router.get("/barcode/:barcode", async (req: Request, res: Response) => {
    try {
      const { barcode } = req.params;
      const item = await database.getInventoryByBarcode(barcode);
      
      if (!item) {
        res.status(404).json({ error: "Inventory item not found" });
        return;
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching inventory item by barcode:", error);
      res.status(500).json({ error: "Failed to fetch inventory item" });
    }
  });

  // Get inventory item by ID
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await database.getInventoryById(id);
      
      if (!item) {
        res.status(404).json({ error: "Inventory item not found" });
        return;
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      res.status(500).json({ error: "Failed to fetch inventory item" });
    }
  });

  // Create new inventory item
  router.post("/", async (req: Request, res: Response) => {
    try {
      const itemData = req.body;
      
      // Validate required fields
      if (!itemData.name || typeof itemData.quantity !== "number" || !itemData.unit) {
        res.status(400).json({ 
          error: "Missing required fields: name, quantity, and unit are required" 
        });
        return;
      }

      // Validate quantity is positive
      if (itemData.quantity < 0) {
        res.status(400).json({ 
          error: "Quantity must be a positive number" 
        });
        return;
      }

      const newItem = await database.createInventoryItem(itemData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ error: "Failed to create inventory item" });
    }
  });

  // Update inventory item
  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate quantity if provided
      if (updates.quantity !== undefined && (typeof updates.quantity !== "number" || updates.quantity < 0)) {
        res.status(400).json({ 
          error: "Quantity must be a positive number" 
        });
        return;
      }

      const updatedItem = await database.updateInventoryItem(id, updates);
      
      if (!updatedItem) {
        res.status(404).json({ error: "Inventory item not found" });
        return;
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  });

  // Delete inventory item
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedItem = await database.deleteInventoryItem(id);
      
      if (!deletedItem) {
        res.status(404).json({ error: "Inventory item not found" });
        return;
      }
      
      res.json(deletedItem);
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  });

  return router;
}