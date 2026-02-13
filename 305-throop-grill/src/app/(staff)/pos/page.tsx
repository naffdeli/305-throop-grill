"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Modal, Input, CustomerFlagBadge } from "@/components/ui";
import { ItemCustomizer, OrderCart, TicketPreview } from "@/components/order";
import { formatCurrency, escapeHtml } from "@/lib/utils";
import { Category, MenuItem, CartItem, SelectedModifier, Customer, Order } from "@/types";
import { ChefHat, Search, User, AlertTriangle, Printer, ArrowLeft, History } from "lucide-react";

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderComplete, setShowOrderComplete] = useState<Order | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [showRecentOrders, setShowRecentOrders] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchRecentOrders();
  }, []);

  const fetchMenu = async () => {
    const res = await fetch("/api/menu");
    const data = await res.json();
    setCategories(data);
    if (data.length > 0) setActiveCategory(data[0].id);
  };

  const fetchRecentOrders = async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(`/api/orders?date=${today}`);
    const data = await res.json();
    setRecentOrders(data.slice(0, 10));
  };

  const handleSearchCustomer = async () => {
    if (!phoneSearch) return;
    try {
      const res = await fetch(`/api/customers?phone=${phoneSearch}`);
      const customers = await res.json();
      if (customers.length > 0) {
        setCustomer(customers[0]);
        setShowCustomerSearch(false);
        setPhoneSearch("");
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error("Failed to search customer:", error);
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
    setIsSubmitting(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer?.id,
          customerName: customer?.name,
          customerPhone: customer?.phone,
          source: "POS",
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
      setShowOrderComplete(order);
      setCart([]);
      setCustomer(null);
      setSpecialInstructions("");
      setShowCheckout(false);
      fetchRecentOrders();
    } catch (error) {
      console.error("Failed to submit order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintTicket = () => {
    if (!showOrderComplete) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const order = showOrderComplete;
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${escapeHtml(String(order.orderNumber))}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: auto; }
            .center { text-align: center; }
            .border { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .bold { font-weight: bold; }
            .item { margin: 10px 0; }
            .mod { padding-left: 15px; }
          </style>
        </head>
        <body>
          <div class="center border"><h2>305 THROOP GRILL</h2></div>
          <div class="border">
            <div>Order #: ${escapeHtml(String(order.orderNumber).padStart(3, "0"))}</div>
            <div>Source: ${escapeHtml(order.source)}</div>
            <div>Customer: ${escapeHtml(order.customer?.name) || "Guest"}</div>
            ${order.customer?.phone ? `<div>Phone: ${escapeHtml(order.customer.phone)}</div>` : ""}
          </div>
          <div class="border">
            ${order.orderItems?.map((item: any) => `
              <div class="item">
                <div class="bold">${item.quantity}x ${escapeHtml(item.menuItem?.name)}</div>
                ${item.customizations?.map((c: any) => `<div class="mod">- ${escapeHtml(c.modifier?.name)}</div>`).join("") || ""}
                ${item.notes ? `<div class="mod"><i>&gt; ${escapeHtml(item.notes)}</i></div>` : ""}
              </div>
            `).join("")}
          </div>
          ${order.specialInstructions ? `<div class="border"><div class="bold">*** SPECIAL ***</div><div>${escapeHtml(order.specialInstructions)}</div></div>` : ""}
          <div class="center bold" style="font-size:1.3em">TOTAL: $${escapeHtml(Number(order.total).toFixed(2))}</div>
          <div class="center bold" style="margin-top:10px">** PAY AT COUNTER **</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const activeMenuItems = categories.find((c) => c.id === activeCategory)?.menuItems || [];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-brand-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-brand-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <ChefHat className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold">POS Terminal</h1>
              <p className="text-brand-100 text-sm">305 Throop Grill</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-brand-600"
              onClick={() => setShowRecentOrders(true)}
            >
              <History className="w-4 h-4 mr-2" />
              Recent Orders
            </Button>
            <Button
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-brand-600"
              onClick={() => setShowCustomerSearch(true)}
            >
              <User className="w-4 h-4 mr-2" />
              {customer ? customer.name : "Add Customer"}
            </Button>
          </div>
        </div>
        {customer && (
          <div className="mt-3 flex items-center gap-3 bg-brand-700 rounded-lg p-3">
            <User className="w-5 h-5" />
            <div className="flex-1">
              <span className="font-medium">{customer.name}</span>
              <span className="mx-2">|</span>
              <span>{customer.phone}</span>
            </div>
            <CustomerFlagBadge isFlagged={customer.isFlagged} noShowCount={customer.noShowCount} />
            {customer.isFlagged && (
              <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">No-Show Risk</span>
              </div>
            )}
            <button onClick={() => setCustomer(null)} className="text-brand-200 hover:text-white">
              Clear
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 flex">
        <nav className="w-40 bg-white shadow-lg flex-shrink-0">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full p-3 text-left font-medium text-sm transition-colors ${
                activeCategory === category.id
                  ? "bg-brand-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {activeMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-lg shadow p-3 text-left hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                <p className="text-brand-600 font-bold mt-1">
                  {formatCurrency(item.price)}
                </p>
              </button>
            ))}
          </div>
        </main>

        <aside className="w-80 bg-white shadow-lg p-4 flex-shrink-0">
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

      <Modal isOpen={showCustomerSearch} onClose={() => setShowCustomerSearch(false)} title="Find Customer">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="Enter phone number"
              onKeyDown={(e) => e.key === "Enter" && handleSearchCustomer()}
            />
            <Button onClick={handleSearchCustomer}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {phoneSearch && !customer && (
            <p className="text-gray-500 text-sm">No customer found. Order will be placed as guest.</p>
          )}
        </div>
      </Modal>

      <Modal isOpen={showCheckout} onClose={() => setShowCheckout(false)} title="Complete Order">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests?"
              className="input"
              rows={3}
            />
          </div>
          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="w-full"
            size="lg"
          >
            Submit Order
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!showOrderComplete} onClose={() => setShowOrderComplete(null)} title="Order Complete" size="md">
        {showOrderComplete && (
          <div className="text-center">
            <div className="text-5xl font-bold text-brand-600 mb-4">
              #{String(showOrderComplete.orderNumber).padStart(3, "0")}
            </div>
            <p className="text-gray-600 mb-4">Order has been sent to kitchen</p>
            <TicketPreview order={showOrderComplete} />
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handlePrintTicket} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print Ticket
              </Button>
              <Button onClick={() => setShowOrderComplete(null)} className="flex-1">
                New Order
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showRecentOrders} onClose={() => setShowRecentOrders(false)} title="Recent Orders" size="lg">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentOrders.map((order) => (
            <div key={order.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-bold">#{String(order.orderNumber).padStart(3, "0")}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span>{order.customer?.name || "Guest"}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="text-brand-600 font-medium">{formatCurrency(order.total)}</span>
              </div>
              <span className={`badge badge-${order.status.toLowerCase().replace("_", "-")}`}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
