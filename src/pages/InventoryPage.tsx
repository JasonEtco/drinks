import React, { useState, useMemo } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { PlusIcon, MagnifyingGlassIcon, QrCodeIcon, TrashIcon, PencilIcon } from "@phosphor-icons/react";
import InventoryForm from "../components/InventoryForm";
import { InventoryItem } from "../lib/types";

type SortField = 'name' | 'quantity' | 'category' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function InventoryPage() {
  const { inventory, isLoading, deleteInventoryItem } = useInventory();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Filter and sort inventory
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [inventory, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteInventoryItem(item.id);
      } catch (error) {
        // Error is handled by the context
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <InventoryForm
        item={editingItem}
        onClose={handleFormClose}
        onSuccess={handleFormClose}
      />
    );
  }

  return (
    <div className="container max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Bar Inventory</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBarcodeScanner(true)}
              variant="outline"
              size="sm"
            >
              <QrCodeIcon className="h-4 w-4 mr-2" />
              Scan Barcode
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedInventory.length} items
          </div>
        </div>

        {/* Inventory table */}
        {filteredAndSortedInventory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "No items match your search." : "No inventory items yet."}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowForm(true)}
                className="mt-4"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/80"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/80"
                      onClick={() => handleSort('quantity')}
                    >
                      Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/80"
                      onClick={() => handleSort('category')}
                    >
                      Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Barcode</th>
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/80"
                      onClick={() => handleSort('updatedAt')}
                    >
                      Last Updated {sortField === 'updatedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedInventory.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.notes && (
                            <div className="text-sm text-muted-foreground">{item.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-sm rounded-full ${
                          item.quantity === 0 
                            ? 'bg-red-100 text-red-800' 
                            : item.quantity < 100 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.category && (
                          <span className="inline-flex px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {item.barcode || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleEdit(item)}
                            variant="ghost"
                            size="sm"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(item)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal (placeholder for now) */}
        {showBarcodeScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Barcode Scanner</h3>
              <p className="text-muted-foreground mb-4">
                Barcode scanner integration will be implemented here.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowBarcodeScanner(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}