"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  ChefHat, LayoutDashboard, UtensilsCrossed, Users, AlertTriangle,
  BarChart3, Package, Settings, ArrowLeft, TrendingUp, TrendingDown,
  ShoppingBag, DollarSign, Clock, UserX
} from "lucide-react";

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  noShowRate: number;
  noShowCount: number;
  topItems: { name: string; count: number; revenue: number }[];
  ordersBySource: { source: string; _count: number }[];
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    const res = await fetch(`/api/analytics?period=${period}`);
    const data = await res.json();
    setAnalytics(data);
  };

  const navItems = [
    { href: "/admin/menu", icon: UtensilsCrossed, label: "Menu Management" },
    { href: "/admin/customers", icon: Users, label: "Customers" },
    { href: "/admin/no-shows", icon: AlertTriangle, label: "No-Shows" },
    { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/admin/inventory", icon: Package, label: "Inventory" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <ChefHat className="w-8 h-8 text-brand-600" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">305 Throop Grill</p>
            </div>
          </div>
          <div className="flex gap-2">
            {["today", "week", "month"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  period === p ? "bg-brand-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-blue-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-500 text-sm">Total Orders</p>
            <p className="text-3xl font-bold">{analytics?.totalOrders || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-gray-500 text-sm">Avg Order Value</p>
            <p className="text-3xl font-bold">{formatCurrency(analytics?.averageOrderValue || 0)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <UserX className="w-8 h-8 text-red-500" />
              {(analytics?.noShowRate || 0) > 5 && <TrendingDown className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-gray-500 text-sm">No-Show Rate</p>
            <p className="text-3xl font-bold">{(analytics?.noShowRate || 0).toFixed(1)}%</p>
            <p className="text-sm text-gray-400">{analytics?.noShowCount || 0} orders</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                <item.icon className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold">{item.label}</h3>
                <p className="text-sm text-gray-500">Manage {item.label.toLowerCase()}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Top Selling Items</h3>
            <div className="space-y-3">
              {analytics?.topItems?.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{item.count} sold</span>
                    <span className="text-gray-400 ml-2">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))}
              {(!analytics?.topItems || analytics.topItems.length === 0) && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Orders by Source</h3>
            <div className="space-y-3">
              {analytics?.ordersBySource?.map((item, index) => {
                const total = analytics.totalOrders || 1;
                const percentage = ((item._count / total) * 100).toFixed(1);
                const colors: Record<string, string> = {
                  POS: "bg-blue-500",
                  KIOSK: "bg-green-500",
                  ONLINE: "bg-purple-500",
                };
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span>{item.source}</span>
                      <span className="text-sm text-gray-500">{item._count} orders ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[item.source] || "bg-gray-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!analytics?.ordersBySource || analytics.ordersBySource.length === 0) && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
