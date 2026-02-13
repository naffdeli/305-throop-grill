"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Modal } from "@/components/ui";
import { Inventory } from "@/types";
import { ArrowLeft, Plus, Edit, AlertTriangle, Package } from "lucide-react";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [form, setForm] = useState({
    name: "", quantity: "0", unit: "unit", minThreshold: "10", costPerUnit: "0"
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const res = await fetch("/api/inventory");
    if (res.ok) {
      const data = await res.json();
      setInventory(data);
    }
  };

  const handleSave = async () => {
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        quantity: parseInt(form.quantity),
        unit: form.unit,
        minThreshold: parseInt(form.minThreshold),
        costPerUnit: parseFloat(form.costPerUnit),
      }),
    });
    setShowModal(false);
    setForm({ name: "", quantity: "0", unit: "unit", minThreshold: "10", costPerUnit: "0" });
    setEditingItem(null);
    fetchInventory();
  };

  const openEdit = (item: Inventory) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      minThreshold: String(item.minThreshold),
      costPerUnit: String(item.costPerUnit),
    });
    setShowModal(true);
  };

  const lowStockItems = inventory.filter((i) => i.quantity <= i.minThreshold);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Inventory Management</h1>
              <p className="text-sm text-gray-500">{inventory.length} items tracked</p>
            </div>
          </div>
          <Button onClick={() => { setEditingItem(null); setForm({ name: "", quantity: "0", unit: "unit", minThreshold: "10", costPerUnit: "0" }); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <span key={item.id} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  {item.name}: {item.quantity} {item.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Item</th>
                <th className="text-center p-4 font-medium">Quantity</th>
                <th className="text-center p-4 font-medium">Unit</th>
                <th className="text-center p-4 font-medium">Min Threshold</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.map((item) => {
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${isLow ? "bg-red-50" : ""}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Package className={`w-5 h-5 ${isLow ? "text-red-500" : "text-gray-400"}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${isLow ? "text-red-600" : ""}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-500">{item.unit}</td>
                    <td className="p-4 text-center text-gray-500">{item.minThreshold}</td>
                    <td className="p-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {inventory.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No inventory items. Add items to start tracking.</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? "Edit Item" : "Add Item"}>
        <div className="space-y-4">
          <Input label="Item Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g., lbs, bags, boxes" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Threshold" type="number" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })} />
            <Input label="Cost per Unit ($)" type="number" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} />
          </div>
          <Button onClick={handleSave} disabled={!form.name} className="w-full">Save</Button>
        </div>
      </Modal>
    </div>
  );
}
