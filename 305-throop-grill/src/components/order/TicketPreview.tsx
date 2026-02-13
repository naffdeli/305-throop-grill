"use client";

import { Order, OrderItem } from "@/types";
import { formatCurrency, formatTime } from "@/lib/utils";

interface TicketPreviewProps {
  order: Order;
  printMode?: boolean;
}

export function TicketPreview({ order, printMode = false }: TicketPreviewProps) {
  const containerClass = printMode
    ? "font-mono text-sm bg-white p-4"
    : "font-mono text-xs bg-white p-4 rounded-lg shadow border max-w-md";

  return (
    <div className={containerClass}>
      <div className="text-center border-b-2 border-dashed pb-2 mb-2">
        <div className="text-lg font-bold">305 THROOP GRILL</div>
      </div>

      <div className="border-b-2 border-dashed pb-2 mb-2">
        <div className="flex justify-between">
          <span>Order #: {String(order.orderNumber).padStart(3, "0")}</span>
          <span>Source: {order.source}</span>
        </div>
        <div>Customer: {order.customer?.name || "Guest"}</div>
        {order.customer?.phone && <div>Phone: {order.customer.phone}</div>}
        {order.pickupTime && (
          <div>Pickup: {formatTime(order.pickupTime)}</div>
        )}
      </div>

      <div className="border-b-2 border-dashed pb-2 mb-2">
        {order.orderItems?.map((item: OrderItem, index: number) => (
          <div key={index} className="mb-3">
            <div className="font-bold">
              {item.quantity}x {item.menuItem?.name}
            </div>
            {item.customizations && item.customizations.length > 0 && (
              <div className="pl-3">
                {item.customizations.map((custom, i) => (
                  <div key={i}>- {custom.modifier?.name}</div>
                ))}
              </div>
            )}
            {item.notes && (
              <div className="pl-3 italic">&gt; Note: {item.notes}</div>
            )}
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <div className="border-b-2 border-dashed pb-2 mb-2">
          <div className="font-bold">*** SPECIAL INSTRUCTIONS ***</div>
          <div>{order.specialInstructions}</div>
        </div>
      )}

      <div className="text-right">
        <div>Subtotal: {formatCurrency(order.subtotal)}</div>
        <div>Tax: {formatCurrency(order.tax)}</div>
        <div className="font-bold text-lg">TOTAL: {formatCurrency(order.total)}</div>
      </div>

      <div className="text-center mt-2 pt-2 border-t-2 border-dashed">
        <div className="font-bold">** PAY AT COUNTER **</div>
        <div className="text-xs mt-1">Printed: {formatTime(new Date())}</div>
      </div>
    </div>
  );
}
