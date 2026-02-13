import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: "CANCELLED" },
      },
      include: {
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const name = item.menuItem?.name || "Unknown";
        if (!itemCounts[name]) {
          itemCounts[name] = { name, count: 0, revenue: 0 };
        }
        itemCounts[name].count += item.quantity;
        itemCounts[name].revenue += Number(item.unitPrice) * item.quantity;
      });
    });

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const ordersByHour: Record<number, number> = {};
    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
    });

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: ordersByHour[i] || 0,
    }));

    const noShowCount = await prisma.order.count({
      where: {
        createdAt: { gte: startDate },
        status: "NO_SHOW",
      },
    });

    const noShowRate = totalOrders > 0 ? (noShowCount / totalOrders) * 100 : 0;

    const ordersBySource = await prisma.order.groupBy({
      by: ["source"],
      where: {
        createdAt: { gte: startDate },
        status: { not: "CANCELLED" },
      },
      _count: true,
    });

    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topItems,
      ordersByHour: hourlyData,
      noShowRate,
      noShowCount,
      ordersBySource,
      ordersByStatus,
      period,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
