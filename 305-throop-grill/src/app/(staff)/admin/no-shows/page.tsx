"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, CustomerFlagBadge } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Customer } from "@/types";
import { ArrowLeft, AlertTriangle, Flag, CheckCircle } from "lucide-react";

export default function NoShowsPage() {
  const [noShowData, setNoShowData] = useState<{
    noShows: any[];
    totalLostRevenue: number;
    totalCount: number;
    repeatOffenders: Customer[];
  } | null>(null);

  useEffect(() => {
    fetchNoShows();
  }, []);

  const fetchNoShows = async () => {
    const res = await fetch("/api/no-shows");
    const data = await res.json();
    setNoShowData(data);
  };

  const handleUnflagCustomer = async (customerId: string) => {
    await fetch(`/api/customers/${customerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFlagged: false }),
    });
    fetchNoShows();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">No-Show Tracking</h1>
            <p className="text-sm text-gray-500">Monitor and manage no-show orders</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-500 text-sm">Total No-Shows</p>
            <p className="text-3xl font-bold">{noShowData?.totalCount || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-gray-500 text-sm">Lost Revenue</p>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(noShowData?.totalLostRevenue || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Flag className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-gray-500 text-sm">Repeat Offenders</p>
            <p className="text-3xl font-bold">{noShowData?.repeatOffenders?.length || 0}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Recent No-Shows</h2>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {noShowData?.noShows?.map((ns: any) => (
                <div key={ns.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">Order #{ns.order?.orderNumber}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{ns.customer?.name}</span>
                    </div>
                    <span className="text-red-600 font-semibold">
                      {formatCurrency(ns.orderValue)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDateTime(ns.occurredAt)}
                  </div>
                  <div className="mt-2">
                    {ns.order?.orderItems?.map((item: any, i: number) => (
                      <span key={i} className="text-sm text-gray-600">
                        {item.quantity}x {item.menuItem?.name}
                        {i < ns.order.orderItems.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {(!noShowData?.noShows || noShowData.noShows.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No no-shows recorded</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Flagged Customers (Repeat Offenders)</h2>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {noShowData?.repeatOffenders?.map((customer: Customer) => (
                <div key={customer.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{customer.name}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-gray-600">{customer.phone}</span>
                    </div>
                    <CustomerFlagBadge isFlagged={customer.isFlagged} noShowCount={customer.noShowCount} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {customer.noShowCount} no-shows out of {customer.totalOrders} orders
                    </div>
                    {customer.isFlagged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnflagCustomer(customer.id)}
                      >
                        Unflag Customer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(!noShowData?.repeatOffenders || noShowData.repeatOffenders.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No repeat offenders</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
