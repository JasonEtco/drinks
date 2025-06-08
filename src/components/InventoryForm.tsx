import React, { useState, useEffect } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { InventoryItem } from "../lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

interface InventoryFormProps {
  item?: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryForm({ item, onClose, onSuccess }: InventoryFormProps) {
  const { addInventoryItem, updateInventoryItem } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    unit: "ml",
    barcode: "",
    category: "",
    expiryDate: "",
    purchaseDate: "",
    cost: "",
    notes: "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        barcode: item.barcode || "",
        category: item.category || "",
        expiryDate: item.expiryDate || "",
        purchaseDate: item.purchaseDate || "",
        cost: item.cost?.toString() || "",
        notes: item.notes || "",
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    if (formData.quantity < 0) {
      toast.error("Quantity must be positive");
      return;
    }

    if (!formData.unit.trim()) {
      toast.error("Unit is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        quantity: formData.quantity,
        unit: formData.unit.trim(),
        barcode: formData.barcode.trim() || undefined,
        category: formData.category.trim() || undefined,
        expiryDate: formData.expiryDate || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (item) {
        await updateInventoryItem(item.id, submitData);
      } else {
        await addInventoryItem(submitData);
      }
      
      onSuccess();
    } catch (error) {
      // Error is handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const commonUnits = ["ml", "l", "oz", "bottle", "can", "package", "g", "kg", "piece"];
  const commonCategories = ["spirits", "liqueurs", "wine", "beer", "mixers", "garnish", "tools", "other"];

  return (
    <div className="container max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {item ? "Edit Inventory Item" : "Add Inventory Item"}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Hendrick's Gin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {commonCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {commonUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleChange("barcode", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Scan or enter barcode"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange("purchaseDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleChange("cost", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about this item..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              <FloppyDiskIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : (item ? "Update Item" : "Add Item")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}