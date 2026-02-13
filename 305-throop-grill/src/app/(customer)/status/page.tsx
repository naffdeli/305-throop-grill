"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, StatusBadge } from "@/components/ui";
import { formatCurrency, formatTime } from "@/lib/utils";
import { Order } from "@/types";
import { ChefHat, Search, ArrowLeft, Clock, CheckCircle } from "lucide-react";

export default function StatusPage() {
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (orderNumber) params.append("orderNumber", orderNumber);
      if (phone) params.append("phone", phone.replace(/\D/g, ""));

      const res = await fetch(`/api/orders/search?${params}`);
      if (!res.ok) {
        throw new Error("Search failed");
      }
      const results = await res.json();
      setOrders(results);
    } catch (error) {
      console.error("Failed to search orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case "PREPARING":
        return <ChefHat className="w-8 h-8 text-blue-500 animate-pulse" />;
      case "READY":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Your order has been received and is waiting to be prepared.";
      case "PREPARING":
        return "Our kitchen is preparing your order now!";
      case "READY":
        return "Your order is ready for pickup! Please come to the counter.";
      case "PICKED_UP":
        return "Order has been picked up. Enjoy!";
      case "NO_SHOW":
        return "This order was not picked up.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-brand-600" />
            <h1 className="text-xl font-bold">Order Status</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Find Your Order</h2>
          <div className="space-y-4">
            <Input
              label="Order Number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g., 47"
            />
            <div className="text-center text-gray-500">or</div>
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
            <Button
              onClick={handleSearch}
              disabled={!orderNumber && !phone}
              isLoading={isLoading}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {searched && orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-500">No orders found. Please check your order number or phone.</p>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-md p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-3xl font-bold">
                  #{String(order.orderNumber).padStart(3, "0")}
                </span>
                <p className="text-gray-500 text-sm">
                  {formatTime(order.createdAt)}
                </p>
              </div>
              {getStatusIcon(order.status)}
            </div>

            <div className="mb-4">
              <StatusBadge status={order.status.toLowerCase() as any} />
              <p className="text-gray-600 mt-2">{getStatusMessage(order.status)}</p>
            </div>

            {order.status === "READY" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold text-center">
                  Please proceed to the counter to pick up your order
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Order Items</h3>
              {order.orderItems?.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span>
                    {item.quantity}x {item.menuItem?.name}
                  </span>
                  <span className="text-gray-600">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 border-t mt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
