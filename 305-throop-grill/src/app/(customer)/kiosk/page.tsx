"use client";

import { useState, useEffect } from "react";
import { Button, Modal, Input } from "@/components/ui";
import { ItemCustomizer, OrderCart } from "@/components/order";
import { formatCurrency } from "@/lib/utils";
import { Category, MenuItem, CartItem, SelectedModifier } from "@/types";
import { ChefHat, RotateCcw, AlertCircle } from "lucide-react";

export default function KioskPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{ orderNumber: number } | null>(null);
  const [idleTime, setIdleTime] = useState(0);
  const [menuError, setMenuError] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdleTime((prev) => prev + 1);
    }, 1000);

    const resetIdle = () => setIdleTime(0);
    window.addEventListener("click", resetIdle);
    window.addEventListener("touchstart", resetIdle);

    return () => {
      clearInterval(timer);
      window.removeEventListener("click", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
    };
  }, []);

  useEffect(() => {
    if (idleTime > 120 && !showCheckout && cart.length === 0) {
      setOrderComplete(null);
    }
  }, [idleTime, showCheckout, cart.length]);

  const fetchMenu = async () => {
    try {
      setMenuError(null);
      const res = await fetch("/api/menu");
      if (!res.ok) {
        throw new Error("Failed to load menu");
      }
      const data = await res.json();
      setCategories(data);
      if (data.length > 0) {
        setActiveCategory(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      setMenuError("Unable to load menu. Please try again or ask staff for help.");
    }
  };

  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    selectedModifiers: SelectedModifier[],
    notes: string
  ) => {
    const basePrice = Number(item.price);
    const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
    const totalPrice = (basePrice + modifiersTotal) * quantity;
    setCart([...cart, { menuItem: item, quantity, notes, selectedModifiers, totalPrice }]);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newCart = [...cart];
    const item = newCart[index];
    const basePrice = Number(item.menuItem.price);
    const modifiersTotal = item.selectedModifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
    item.quantity = quantity;
    item.totalPrice = (basePrice + modifiersTotal) * quantity;
    setCart(newCart);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) return;
    setIsSubmitting(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          source: "KIOSK",
          subtotal,
          items: cart.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            unitPrice: Number(item.menuItem.price),
            notes: item.notes,
            customizations: item.selectedModifiers.map((mod) => ({
              modifierId: mod.modifierId,
              priceAdjustment: mod.priceAdjustment,
            })),
          })),
        }),
      });
      const order = await res.json();
      setOrderComplete({ orderNumber: order.orderNumber });
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({ name: "", phone: "" });
    } catch (error) {
      console.error("Failed to submit order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setCart([]);
    setOrderComplete(null);
    setCustomerInfo({ name: "", phone: "" });
    if (categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-brand-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Order Placed!</h1>
          <p className="text-xl text-gray-600 mb-4">Your order number is:</p>
          <p className="text-7xl font-bold text-brand-600 mb-6">
            #{String(orderComplete.orderNumber).padStart(3, "0")}
          </p>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
            <p className="text-xl text-yellow-800 font-semibold">
              Pay at counter when your order is ready
            </p>
          </div>
          <Button onClick={handleStartOver} size="lg" className="text-xl px-12">
            <RotateCcw className="w-5 h-5 mr-2" />
            Start New Order
          </Button>
        </div>
      </div>
    );
  }

  const activeMenuItems = categories.find((c) => c.id === activeCategory)?.menuItems || [];

  if (menuError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Menu Unavailable</h1>
          <p className="text-gray-600 mb-6">{menuError}</p>
          <Button onClick={fetchMenu} size="lg" className="text-xl px-8">
            <RotateCcw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-brand-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChefHat className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold">305 Throop Grill</h1>
              <p className="text-brand-100">Touch to Order - Pickup Only</p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button variant="outline" onClick={handleStartOver} className="text-white border-white hover:bg-white hover:text-brand-600">
              <RotateCcw className="w-5 h-5 mr-2" />
              Start Over
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        <nav className="w-48 bg-white shadow-lg">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full p-4 text-left font-medium transition-colors ${
                activeCategory === category.id
                  ? "bg-brand-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-bold text-lg">{item.name}</h3>
                {item.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                )}
                <p className="text-brand-600 font-bold text-xl mt-2">
                  {formatCurrency(item.price)}
                </p>
              </button>
            ))}
          </div>
        </main>

        <aside className="w-96 bg-white shadow-lg p-4">
          <OrderCart
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={() => setShowCheckout(true)}
            isCheckoutDisabled={cart.length === 0}
          />
        </aside>
      </div>

      {selectedItem && (
        <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} size="lg">
          <ItemCustomizer
            item={selectedItem}
            onAddToCart={handleAddToCart}
            onClose={() => setSelectedItem(null)}
          />
        </Modal>
      )}

      <Modal isOpen={showCheckout} onClose={() => setShowCheckout(false)} title="Complete Your Order" size="md">
        <div className="space-y-6">
          <Input
            label="Your Name *"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            placeholder="Enter your name"
            className="text-lg p-4"
          />
          <Input
            label="Phone Number *"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="text-lg p-4"
          />
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-lg text-yellow-800 font-semibold text-center">
              Pay at Counter When You Pick Up
            </p>
          </div>
          <Button
            onClick={handleSubmitOrder}
            disabled={!customerInfo.name || !customerInfo.phone || isSubmitting}
            isLoading={isSubmitting}
            className="w-full text-xl"
            size="lg"
          >
            Place Order
          </Button>
        </div>
      </Modal>
    </div>
  );
}
