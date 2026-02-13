"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Modal, Input } from "@/components/ui";
import { ItemCustomizer, OrderCart } from "@/components/order";
import { formatCurrency } from "@/lib/utils";
import { Category, MenuItem, CartItem, SelectedModifier } from "@/types";
import { ChefHat, ArrowLeft, MessageCircle, X, Send } from "lucide-react";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", email: "" });
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{ orderNumber: number } | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    const res = await fetch("/api/menu");
    const data = await res.json();
    setCategories(data);
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
          customerEmail: customerInfo.email,
          source: "ONLINE",
          subtotal,
          specialInstructions,
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
    } catch (error) {
      console.error("Failed to submit order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user" as const, content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...chatMessages, userMessage] }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble. Please ask staff." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-gray-600 mb-4">Your order number is:</p>
          <p className="text-5xl font-bold text-brand-600 mb-4">
            #{String(orderComplete.orderNumber).padStart(3, "0")}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium">Pay at counter when you pick up</p>
          </div>
          <Link href="/status">
            <Button variant="outline" className="w-full mb-3">Check Order Status</Button>
          </Link>
          <Button onClick={() => setOrderComplete(null)} className="w-full">Place Another Order</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-brand-600" />
              <h1 className="text-xl font-bold">305 Throop Grill</h1>
            </div>
          </div>
          <div className="text-sm text-gray-600">Pickup Only - Pay at Counter</div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {categories.map((category) => (
              <div key={category.id}>
                <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
                {category.description && (
                  <p className="text-gray-600 mb-4">{category.description}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {category.menuItems?.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-brand-600 font-semibold mt-1">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <OrderCart
                items={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={() => setShowCheckout(true)}
                isCheckoutDisabled={cart.length === 0}
              />
            </div>
          </div>
        </div>
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
        <div className="space-y-4">
          <Input
            label="Name *"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            placeholder="Your name"
          />
          <Input
            label="Phone *"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
          <Input
            label="Email (optional)"
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
            placeholder="email@example.com"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests for your order?"
              className="input"
              rows={3}
            />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">You will pay at counter when you pick up</p>
          </div>
          <Button
            onClick={handleSubmitOrder}
            disabled={!customerInfo.name || !customerInfo.phone || isSubmitting}
            isLoading={isSubmitting}
            className="w-full"
            size="lg"
          >
            Place Order
          </Button>
        </div>
      </Modal>

      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center z-50"
      >
        {showChat ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {showChat && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-xl border z-50">
          <div className="p-4 border-b bg-brand-600 text-white rounded-t-xl">
            <h3 className="font-semibold">Chat with us</h3>
            <p className="text-sm opacity-90">Ask about menu, allergies, etc.</p>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-gray-500 text-sm text-center">
                Hi! How can I help you today?
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-brand-100 ml-6"
                    : "bg-gray-100 mr-6"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
            {isChatLoading && (
              <div className="bg-gray-100 p-3 rounded-lg mr-6">
                <p className="text-sm text-gray-500">Typing...</p>
              </div>
            )}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button onClick={handleSendChat} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
