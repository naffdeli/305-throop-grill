"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, CustomerFlagBadge, Modal } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { Customer } from "@/types";
import { ArrowLeft, Search, User, Phone, Mail, ShoppingBag, AlertTriangle } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, [showFlaggedOnly]);

  const fetchCustomers = async () => {
    const params = new URLSearchParams();
    if (showFlaggedOnly) params.append("flagged", "true");
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data);
  };

  const handleSearch = async () => {
    if (!search) {
      fetchCustomers();
      return;
    }
    const res = await fetch(`/api/customers?phone=${search}`);
    const data = await res.json();
    setCustomers(data);
  };

  const handleViewDetails = async (customerId: string) => {
    const res = await fetch(`/api/customers/${customerId}`);
    const data = await res.json();
    setSelectedCustomer(data);
  };

  const handleToggleFlag = async (customer: Customer) => {
    await fetch(`/api/customers/${customer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFlagged: !customer.isFlagged }),
    });
    fetchCustomers();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Customers</h1>
              <p className="text-sm text-gray-500">{customers.length} customers</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showFlaggedOnly}
                onChange={(e) => setShowFlaggedOnly(e.target.checked)}
              />
              Flagged only
            </label>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Search by phone number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Contact</th>
                <th className="text-center p-4 font-medium">Orders</th>
                <th className="text-center p-4 font-medium">No-Shows</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-600" />
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </span>
                      {customer.email && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Mail className="w-3 h-3" /> {customer.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-medium">{customer._count?.orders || customer.totalOrders}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={customer.noShowCount > 0 ? "text-red-600 font-medium" : ""}>
                      {customer.noShowCount}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <CustomerFlagBadge isFlagged={customer.isFlagged} noShowCount={customer.noShowCount} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(customer.id)}>
                        View
                      </Button>
                      <Button
                        variant={customer.isFlagged ? "secondary" : "danger"}
                        size="sm"
                        onClick={() => handleToggleFlag(customer)}
                      >
                        {customer.isFlagged ? "Unflag" : "Flag"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No customers found
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Customer Details" size="lg">
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-brand-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                <p className="text-gray-600">{selectedCustomer.phone}</p>
                {selectedCustomer.email && <p className="text-gray-500">{selectedCustomer.email}</p>}
              </div>
              {selectedCustomer.isFlagged && (
                <div className="ml-auto">
                  <CustomerFlagBadge isFlagged={true} noShowCount={selectedCustomer.noShowCount} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <ShoppingBag className="w-6 h-6 mx-auto mb-1 text-brand-600" />
                <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                <p className="text-sm text-gray-500">Total Orders</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-500" />
                <p className="text-2xl font-bold text-red-600">{selectedCustomer.noShowCount}</p>
                <p className="text-sm text-gray-500">No-Shows</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {selectedCustomer.totalOrders > 0
                    ? ((selectedCustomer.noShowCount / selectedCustomer.totalOrders) * 100).toFixed(0)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500">No-Show Rate</p>
              </div>
            </div>

            {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Recent Orders</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCustomer.orders.map((order: any) => (
                    <div key={order.id} className="bg-gray-50 rounded p-3 flex justify-between items-center">
                      <div>
                        <span className="font-medium">#{order.orderNumber}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-sm text-gray-600">
                          {order.orderItems?.map((i: any) => i.menuItem?.name).join(", ")}
                        </span>
                      </div>
                      <span className={`text-sm ${order.status === "NO_SHOW" ? "text-red-600" : "text-gray-500"}`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
