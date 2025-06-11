import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { InventoryItem } from "../lib/types";
import { ApiService } from "../lib/api";
import { toast } from "sonner";

interface InventoryContextType {
  inventory: InventoryItem[];
  isLoading: boolean;
  addInventoryItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  searchInventory: (query: string) => Promise<InventoryItem[]>;
  getInventoryByBarcode: (barcode: string) => Promise<InventoryItem | null>;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const items = await ApiService.listInventory();
      setInventory(items);
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const addInventoryItem = async (itemData: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newItem = await ApiService.createInventoryItem(itemData);
      setInventory(prev => [newItem, ...prev]);
      toast.success("Inventory item added successfully");
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast.error("Failed to add inventory item");
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const updatedItem = await ApiService.updateInventoryItem(id, updates);
      setInventory(prev => prev.map(item => item.id === id ? updatedItem : item));
      toast.success("Inventory item updated successfully");
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast.error("Failed to update inventory item");
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await ApiService.deleteInventoryItem(id);
      setInventory(prev => prev.filter(item => item.id !== id));
      toast.success("Inventory item deleted successfully");
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast.error("Failed to delete inventory item");
      throw error;
    }
  };

  const searchInventory = async (query: string): Promise<InventoryItem[]> => {
    try {
      return await ApiService.searchInventory(query);
    } catch (error) {
      console.error("Error searching inventory:", error);
      toast.error("Failed to search inventory");
      return [];
    }
  };

  const getInventoryByBarcode = async (barcode: string): Promise<InventoryItem | null> => {
    try {
      return await ApiService.getInventoryByBarcode(barcode);
    } catch (error) {
      console.error("Error fetching inventory by barcode:", error);
      return null;
    }
  };

  const refreshInventory = async () => {
    await loadInventory();
  };

  const value: InventoryContextType = {
    inventory,
    isLoading,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    searchInventory,
    getInventoryByBarcode,
    refreshInventory,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}