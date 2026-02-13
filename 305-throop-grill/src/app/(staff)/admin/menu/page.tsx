"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Modal } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Category, MenuItem, ModifierGroup } from "@/types";
import { ArrowLeft, Plus, Edit, Trash2, ChevronDown, ChevronRight, Settings } from "lucide-react";

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingModifierGroup, setEditingModifierGroup] = useState<{ item: MenuItem; group?: ModifierGroup } | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [itemForm, setItemForm] = useState({
    name: "", description: "", price: "", imageUrl: "", categoryId: "", preparationTime: "10"
  });
  const [modifierForm, setModifierForm] = useState({
    name: "", selectionType: "SINGLE", minSelections: 0, maxSelections: 1, isRequired: false,
    modifiers: [{ name: "", priceAdjustment: 0, isDefault: false }]
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    const res = await fetch("/api/menu");
    const data = await res.json();
    setCategories(data);
  };

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedCategories(newExpanded);
  };

  const handleSaveCategory = async () => {
    const method = editingCategory ? "PUT" : "POST";
    const url = editingCategory ? `/api/menu/categories/${editingCategory.id}` : "/api/menu/categories";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });
    setShowCategoryModal(false);
    setCategoryForm({ name: "", description: "" });
    setEditingCategory(null);
    fetchMenu();
  };

  const handleSaveItem = async () => {
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/menu/${editingItem.id}` : "/api/menu";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...itemForm,
        price: parseFloat(itemForm.price),
        preparationTime: parseInt(itemForm.preparationTime),
      }),
    });
    setShowItemModal(false);
    setItemForm({ name: "", description: "", price: "", imageUrl: "", categoryId: "", preparationTime: "10" });
    setEditingItem(null);
    fetchMenu();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/menu/${id}`, { method: "DELETE" });
    fetchMenu();
  };

  const handleSaveModifierGroup = async () => {
    if (!editingModifierGroup) return;
    const method = editingModifierGroup.group ? "PUT" : "POST";
    const url = editingModifierGroup.group
      ? `/api/modifiers/${editingModifierGroup.group.id}`
      : "/api/modifiers";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...modifierForm,
        menuItemId: editingModifierGroup.item.id,
      }),
    });
    setShowModifierModal(false);
    setModifierForm({
      name: "", selectionType: "SINGLE", minSelections: 0, maxSelections: 1, isRequired: false,
      modifiers: [{ name: "", priceAdjustment: 0, isDefault: false }]
    });
    setEditingModifierGroup(null);
    fetchMenu();
  };

  const handleDeleteModifierGroup = async (id: string) => {
    if (!confirm("Delete this modifier group?")) return;
    await fetch(`/api/modifiers/${id}`, { method: "DELETE" });
    fetchMenu();
  };

  const openEditItem = (item: MenuItem, categoryId: string) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      imageUrl: item.imageUrl || "",
      categoryId,
      preparationTime: String(item.preparationTime),
    });
    setShowItemModal(true);
  };

  const openAddItem = (categoryId: string) => {
    setEditingItem(null);
    setItemForm({ name: "", description: "", price: "", imageUrl: "", categoryId, preparationTime: "10" });
    setShowItemModal(true);
  };

  const openEditModifier = (item: MenuItem, group?: ModifierGroup) => {
    setEditingModifierGroup({ item, group });
    if (group) {
      setModifierForm({
        name: group.name,
        selectionType: group.selectionType,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired,
        modifiers: group.modifiers?.map(m => ({
          name: m.name,
          priceAdjustment: Number(m.priceAdjustment),
          isDefault: m.isDefault
        })) || [{ name: "", priceAdjustment: 0, isDefault: false }]
      });
    } else {
      setModifierForm({
        name: "", selectionType: "SINGLE", minSelections: 0, maxSelections: 1, isRequired: false,
        modifiers: [{ name: "", priceAdjustment: 0, isDefault: false }]
      });
    }
    setShowModifierModal(true);
  };

  const addModifierOption = () => {
    setModifierForm({
      ...modifierForm,
      modifiers: [...modifierForm.modifiers, { name: "", priceAdjustment: 0, isDefault: false }]
    });
  };

  const removeModifierOption = (index: number) => {
    setModifierForm({
      ...modifierForm,
      modifiers: modifierForm.modifiers.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Menu Management</h1>
          </div>
          <Button onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", description: "" }); setShowCategoryModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.menuItems?.length || 0} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => openAddItem(category.id)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingCategory(category);
                    setCategoryForm({ name: category.name, description: category.description || "" });
                    setShowCategoryModal(true);
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {expandedCategories.has(category.id) && (
                <div className="border-t">
                  {category.menuItems?.map((item) => (
                    <div key={item.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                          )}
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-500">{item.description}</p>
                            <p className="text-brand-600 font-semibold">{formatCurrency(item.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModifier(item)}>
                            <Settings className="w-4 h-4 mr-1" />
                            Modifiers ({item.modifierGroups?.length || 0})
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditItem(item, category.id)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {item.modifierGroups && item.modifierGroups.length > 0 && (
                        <div className="mt-3 pl-20 space-y-2">
                          {item.modifierGroups.map((group) => (
                            <div key={group.id} className="bg-gray-50 rounded p-2 text-sm flex items-center justify-between">
                              <div>
                                <span className="font-medium">{group.name}</span>
                                <span className="text-gray-500 ml-2">
                                  ({group.modifiers?.map(m => m.name).join(", ")})
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => openEditModifier(item, group)} className="p-1 hover:bg-gray-200 rounded">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteModifierGroup(group.id)} className="p-1 hover:bg-gray-200 rounded">
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!category.menuItems || category.menuItems.length === 0) && (
                    <div className="p-8 text-center text-gray-500">
                      No items in this category
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editingCategory ? "Edit Category" : "Add Category"}>
        <div className="space-y-4">
          <Input label="Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
          <Input label="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
          <Button onClick={handleSaveCategory} className="w-full">Save</Button>
        </div>
      </Modal>

      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title={editingItem ? "Edit Item" : "Add Item"}>
        <div className="space-y-4">
          <Input label="Name *" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
          <Input label="Description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
          <Input label="Price *" type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
          <Input label="Image URL" value={itemForm.imageUrl} onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })} />
          <Input label="Prep Time (min)" type="number" value={itemForm.preparationTime} onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })} />
          <Button onClick={handleSaveItem} disabled={!itemForm.name || !itemForm.price} className="w-full">Save</Button>
        </div>
      </Modal>

      <Modal isOpen={showModifierModal} onClose={() => setShowModifierModal(false)} title={editingModifierGroup?.group ? "Edit Modifier Group" : "Add Modifier Group"} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Group Name *" value={modifierForm.name} onChange={(e) => setModifierForm({ ...modifierForm, name: e.target.value })} placeholder="e.g., Size, Toppings, Cooking Level" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Selection Type</label>
              <select
                value={modifierForm.selectionType}
                onChange={(e) => setModifierForm({ ...modifierForm, selectionType: e.target.value })}
                className="input"
              >
                <option value="SINGLE">Single (radio)</option>
                <option value="MULTIPLE">Multiple (checkbox)</option>
              </select>
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modifierForm.isRequired}
                  onChange={(e) => setModifierForm({ ...modifierForm, isRequired: e.target.checked })}
                />
                Required
              </label>
            </div>
          </div>
          {modifierForm.selectionType === "MULTIPLE" && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Min Selections" type="number" value={modifierForm.minSelections} onChange={(e) => setModifierForm({ ...modifierForm, minSelections: parseInt(e.target.value) || 0 })} />
              <Input label="Max Selections" type="number" value={modifierForm.maxSelections} onChange={(e) => setModifierForm({ ...modifierForm, maxSelections: parseInt(e.target.value) || 1 })} />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Options</label>
              <Button variant="outline" size="sm" onClick={addModifierOption}>
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {modifierForm.modifiers.map((mod, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Option name"
                    value={mod.name}
                    onChange={(e) => {
                      const newMods = [...modifierForm.modifiers];
                      newMods[index].name = e.target.value;
                      setModifierForm({ ...modifierForm, modifiers: newMods });
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="+$"
                    type="number"
                    step="0.01"
                    value={mod.priceAdjustment}
                    onChange={(e) => {
                      const newMods = [...modifierForm.modifiers];
                      newMods[index].priceAdjustment = parseFloat(e.target.value) || 0;
                      setModifierForm({ ...modifierForm, modifiers: newMods });
                    }}
                    className="w-24"
                  />
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={mod.isDefault}
                      onChange={(e) => {
                        const newMods = [...modifierForm.modifiers];
                        newMods[index].isDefault = e.target.checked;
                        setModifierForm({ ...modifierForm, modifiers: newMods });
                      }}
                    />
                    Default
                  </label>
                  {modifierForm.modifiers.length > 1 && (
                    <button onClick={() => removeModifierOption(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleSaveModifierGroup} disabled={!modifierForm.name || modifierForm.modifiers.every(m => !m.name)} className="w-full">
            Save Modifier Group
          </Button>
        </div>
      </Modal>
    </div>
  );
}
