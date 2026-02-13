"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TicketCard } from "@/components/kitchen";
import { Order } from "@/types";
import { escapeHtml } from "@/lib/utils";
import { ChefHat, RefreshCw, Bell, ArrowLeft } from "lucide-react";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("active");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/orders?date=${today}`);
      const data = await res.json();

      let filtered = data;
      if (filter === "active") {
        filtered = data.filter((o: Order) =>
          ["PENDING", "PREPARING", "READY"].includes(o.status)
        );
      } else if (filter !== "all") {
        filtered = data.filter((o: Order) => o.status === filter);
      }

      const sorted = filtered.sort((a: Order, b: Order) => {
        const priority: Record<string, number> = { PENDING: 0, PREPARING: 1, READY: 2 };
        return (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
      });

      setOrders(sorted);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  const handlePrint = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.orderNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .section { border-bottom: 2px dashed #000; padding: 10px 0; }
            .item { margin-bottom: 10px; }
            .modifier { padding-left: 15px; }
            .total { text-align: right; font-weight: bold; font-size: 1.2em; }
            .footer { text-align: center; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>305 THROOP GRILL</h2>
          </div>
          <div class="section">
            <div>Order #: ${String(order.orderNumber).padStart(3, "0")}</div>
            <div>Source: ${escapeHtml(order.source)}</div>
            <div>Customer: ${escapeHtml(order.customer?.name) || "Guest"}</div>
            ${order.customer?.phone ? `<div>Phone: ${escapeHtml(order.customer.phone)}</div>` : ""}
          </div>
          <div class="section">
            ${order.orderItems?.map((item) => `
              <div class="item">
                <strong>${item.quantity}x ${escapeHtml(item.menuItem?.name)}</strong>
                ${item.customizations?.map((c) => `<div class="modifier">- ${escapeHtml(c.modifier?.name)}</div>`).join("") || ""}
                ${item.notes ? `<div class="modifier" style="font-style:italic">&gt; ${escapeHtml(item.notes)}</div>` : ""}
              </div>
            `).join("")}
          </div>
          ${order.specialInstructions ? `
            <div class="section">
              <strong>*** SPECIAL INSTRUCTIONS ***</strong>
              <div>${escapeHtml(order.specialInstructions)}</div>
            </div>
          ` : ""}
          <div class="total">TOTAL: $${Number(order.total).toFixed(2)}</div>
          <div class="footer">
            <strong>** PAY AT COUNTER **</strong>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const preparingCount = orders.filter((o) => o.status === "PREPARING").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <ChefHat className="w-10 h-10 text-brand-500" />
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-gray-400 text-sm">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {[
                { value: "active", label: "Active" },
                { value: "PENDING", label: "Pending" },
                { value: "PREPARING", label: "Preparing" },
                { value: "READY", label: "Ready" },
                { value: "all", label: "All" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === opt.value
                      ? "bg-brand-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchOrders}
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span>Pending: {pendingCount}</span>
            {pendingCount > 0 && <Bell className="w-4 h-4 text-yellow-500 animate-pulse" />}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Preparing: {preparingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Ready: {readyCount}</span>
          </div>
        </div>
      </header>

      <main className="p-4">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No orders to display</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <TicketCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onPrint={handlePrint}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
