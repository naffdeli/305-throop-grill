"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, TrendingUp, Clock, DollarSign, ShoppingBag, UserX } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  noShowRate: number;
  noShowCount: number;
  topItems: { name: string; count: number; revenue: number }[];
  ordersByHour: { hour: number; count: number }[];
  ordersBySource: { source: string; _count: number }[];
  ordersByStatus: { status: string; _count: number }[];
}

const COLORS = ["#ed751b", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
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

  const formatHour = (hour: number) => {
    if (hour === 0) return "12am";
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
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
              <h1 className="text-xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">Menu performance & sales data</p>
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
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">Orders</span>
            </div>
            <p className="text-2xl font-bold">{analytics?.totalOrders || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-500">Avg Order</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(analytics?.averageOrderValue || 0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-500">No-Show Rate</span>
            </div>
            <p className="text-2xl font-bold">{(analytics?.noShowRate || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-500">No-Shows</span>
            </div>
            <p className="text-2xl font-bold">{analytics?.noShowCount || 0}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Orders by Hour</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.ordersByHour || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={formatHour} fontSize={12} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(h) => formatHour(h as number)}
                    formatter={(value) => [value, "Orders"]}
                  />
                  <Bar dataKey="count" fill="#ed751b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Orders by Source</h3>
            <div className="h-64 flex items-center justify-center">
              {analytics?.ordersBySource && analytics.ordersBySource.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.ordersBySource.map((s) => ({ name: s.source, value: s._count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {analytics.ordersBySource.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Top Selling Items</h3>
            <div className="space-y-3">
              {analytics?.topItems?.map((item, index) => {
                const maxCount = analytics.topItems[0]?.count || 1;
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-medium">{item.count}</span>
                        <span className="text-gray-400 ml-2">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!analytics?.topItems || analytics.topItems.length === 0) && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Order Status Distribution</h3>
            <div className="space-y-3">
              {analytics?.ordersByStatus?.map((item, index) => {
                const total = analytics.totalOrders || 1;
                const percentage = ((item._count / total) * 100).toFixed(1);
                const statusColors: Record<string, string> = {
                  PENDING: "bg-yellow-500",
                  PREPARING: "bg-blue-500",
                  READY: "bg-green-500",
                  PICKED_UP: "bg-gray-500",
                  NO_SHOW: "bg-red-500",
                  CANCELLED: "bg-gray-400",
                };
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="capitalize">{item.status.toLowerCase().replace("_", " ")}</span>
                      <span className="text-sm text-gray-500">{item._count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusColors[item.status] || "bg-gray-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!analytics?.ordersByStatus || analytics.ordersByStatus.length === 0) && (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
