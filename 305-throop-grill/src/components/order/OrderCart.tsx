"use client";

import { Button } from "@/components/ui";
import { formatCurrency, TAX_RATE } from "@/lib/utils";
import { CartItem } from "@/types";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";

interface OrderCartProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  isCheckoutDisabled?: boolean;
}

export function OrderCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isCheckoutDisabled = false,
}: OrderCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Your cart is empty</p>
        <p className="text-sm text-gray-400 mt-1">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 bg-brand-600 text-white">
        <h2 className="font-semibold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Your Order ({items.length} {items.length === 1 ? "item" : "items"})
        </h2>
      </div>

      <div className="divide-y max-h-[400px] overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-medium">{item.menuItem.name}</h3>
                {item.selectedModifiers.length > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    {item.selectedModifiers.map((mod, i) => (
                      <span key={mod.modifierId}>
                        {mod.modifierName}
                        {mod.priceAdjustment > 0 && ` (+${formatCurrency(mod.priceAdjustment)})`}
                        {i < item.selectedModifiers.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <p className="text-sm text-gray-500 italic mt-1">
                    Note: {item.notes}
                  </p>
                )}
              </div>
              <span className="font-semibold text-brand-600">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                  className="p-1 rounded border hover:bg-gray-100"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  className="p-1 rounded border hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => onRemoveItem(index)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-brand-600">{formatCurrency(total)}</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-sm text-yellow-800 font-medium">
            Pay at Counter When You Pick Up
          </p>
        </div>
        <Button
          onClick={onCheckout}
          disabled={isCheckoutDisabled}
          className="w-full mt-4"
          size="lg"
        >
          Place Order
        </Button>
      </div>
    </div>
  );
}
