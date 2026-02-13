"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { MenuItem, ModifierGroup, Modifier, SelectedModifier } from "@/types";
import { Check, Plus, Minus, X } from "lucide-react";

interface ItemCustomizerProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number, selectedModifiers: SelectedModifier[], notes: string) => void;
  onClose: () => void;
}

export function ItemCustomizer({ item, onAddToCart, onClose }: ItemCustomizerProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const modifierGroups = item.modifierGroups || [];

  useEffect(() => {
    const defaults: SelectedModifier[] = [];
    modifierGroups.forEach((group) => {
      group.modifiers?.forEach((mod) => {
        if (mod.isDefault && mod.isAvailable) {
          defaults.push({
            groupId: group.id,
            groupName: group.name,
            modifierId: mod.id,
            modifierName: mod.name,
            priceAdjustment: Number(mod.priceAdjustment),
          });
        }
      });
    });
    setSelectedModifiers(defaults);
  }, [item]);

  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    if (!modifier.isAvailable) return;

    const existing = selectedModifiers.filter((m) => m.groupId === group.id);
    const isSelected = existing.some((m) => m.modifierId === modifier.id);

    let newSelection = [...selectedModifiers];

    if (group.selectionType === "SINGLE") {
      newSelection = newSelection.filter((m) => m.groupId !== group.id);
      if (!isSelected) {
        newSelection.push({
          groupId: group.id,
          groupName: group.name,
          modifierId: modifier.id,
          modifierName: modifier.name,
          priceAdjustment: Number(modifier.priceAdjustment),
        });
      }
    } else {
      if (isSelected) {
        newSelection = newSelection.filter((m) => m.modifierId !== modifier.id);
      } else {
        if (existing.length < group.maxSelections) {
          newSelection.push({
            groupId: group.id,
            groupName: group.name,
            modifierId: modifier.id,
            modifierName: modifier.name,
            priceAdjustment: Number(modifier.priceAdjustment),
          });
        }
      }
    }

    setSelectedModifiers(newSelection);
    setErrors((prev) => ({ ...prev, [group.id]: "" }));
  };

  const validateSelections = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    modifierGroups.forEach((group) => {
      const selected = selectedModifiers.filter((m) => m.groupId === group.id);
      if (group.isRequired && selected.length < group.minSelections) {
        newErrors[group.id] = `Please select at least ${group.minSelections} option(s)`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const calculateTotal = (): number => {
    const basePrice = Number(item.price);
    const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
    return (basePrice + modifiersTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (!validateSelections()) return;
    onAddToCart(item, quantity, selectedModifiers, notes);
    onClose();
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="flex items-start gap-4 mb-6">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{item.name}</h2>
          {item.description && (
            <p className="text-gray-600 mt-1">{item.description}</p>
          )}
          <p className="text-xl font-semibold text-brand-600 mt-2">
            {formatCurrency(item.price)}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {modifierGroups.map((group) => (
        <div key={group.id} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              {group.name}
              {group.isRequired && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <span className="text-sm text-gray-500">
              {group.selectionType === "SINGLE"
                ? "Select one"
                : `Select ${group.minSelections}-${group.maxSelections}`}
            </span>
          </div>
          {errors[group.id] && (
            <p className="text-sm text-red-600 mb-2">{errors[group.id]}</p>
          )}
          <div className="space-y-2">
            {group.modifiers?.map((modifier) => {
              const isSelected = selectedModifiers.some(
                (m) => m.modifierId === modifier.id
              );
              return (
                <button
                  key={modifier.id}
                  onClick={() => handleModifierToggle(group, modifier)}
                  disabled={!modifier.isAvailable}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300",
                    !modifier.isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        isSelected
                          ? "border-brand-600 bg-brand-600"
                          : "border-gray-300"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={!modifier.isAvailable ? "line-through" : ""}>
                      {modifier.name}
                    </span>
                  </div>
                  {Number(modifier.priceAdjustment) !== 0 && (
                    <span className="text-sm text-gray-600">
                      {Number(modifier.priceAdjustment) > 0 ? "+" : ""}
                      {formatCurrency(modifier.priceAdjustment)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mb-6">
        <label className="block font-semibold mb-2">Special Instructions</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requests? (e.g., allergies, extra napkins)"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
        />
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-lg border hover:bg-gray-100"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 rounded-lg border hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Button onClick={handleAddToCart} className="w-full" size="lg">
          Add to Order - {formatCurrency(calculateTotal())}
        </Button>
      </div>
    </div>
  );
}
