"use client";

import { Order } from "@/types";
import { StatusBadge, Button } from "@/components/ui";
import { formatCurrency, formatTime } from "@/lib/utils";
import { Clock, User, Phone, Printer } from "lucide-react";

interface TicketCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: string) => void;
  onPrint: (orderId: string) => void;
}

export function TicketCard({ order, onStatusChange, onPrint }: TicketCardProps) {
  const statusColors = {
    PENDING: "border-l-yellow-500",
    PREPARING: "border-l-blue-500",
    READY: "border-l-green-500",
    PICKED_UP: "border-l-gray-400",
    NO_SHOW: "border-l-red-500",
  };

  const getNextStatus = (current: string) => {
    const flow: Record<string, string> = {
      PENDING: "PREPARING",
      PREPARING: "READY",
      READY: "PICKED_UP",
    };
    return flow[current];
  };

  const getActionLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Start Preparing",
      PREPARING: "Mark Ready",
      READY: "Mark Picked Up",
    };
    return labels[status] || "";
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-l-4 ${
        statusColors[order.status as keyof typeof statusColors] || "border-l-gray-300"
      } overflow-hidden`}
    >
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">
              #{String(order.orderNumber).padStart(3, "0")}
            </span>
            <StatusBadge status={order.status.toLowerCase() as any} />
          </div>
          <div className="text-sm text-gray-500">
            {order.source}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          {order.customer && (
            <>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {order.customer.name}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {order.customer.phone}
              </span>
            </>
          )}
          {order.pickupTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Pickup: {formatTime(order.pickupTime)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {order.orderItems?.map((item, index) => (
          <div key={index} className="mb-3 pb-3 border-b last:border-b-0 last:mb-0 last:pb-0">
            <div className="font-semibold">
              {item.quantity}x {item.menuItem?.name}
            </div>
            {item.customizations && item.customizations.length > 0 && (
              <ul className="ml-4 text-sm text-gray-600">
                {item.customizations.map((custom, i) => (
                  <li key={i}>- {custom.modifier?.name}</li>
                ))}
              </ul>
            )}
            {item.notes && (
              <p className="ml-4 text-sm text-brand-600 italic">
                Note: {item.notes}
              </p>
            )}
          </div>
        ))}

        {order.specialInstructions && (
          <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">
              Special Instructions:
            </p>
            <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
        <span className="font-bold text-lg">
          {formatCurrency(order.total)}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPrint(order.id)}
          >
            <Printer className="w-4 h-4" />
          </Button>
          {getNextStatus(order.status) && (
            <Button
              variant={order.status === "READY" ? "success" : "primary"}
              size="sm"
              onClick={() => onStatusChange(order.id, getNextStatus(order.status))}
            >
              {getActionLabel(order.status)}
            </Button>
          )}
          {order.status === "READY" && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onStatusChange(order.id, "NO_SHOW")}
            >
              No Show
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
