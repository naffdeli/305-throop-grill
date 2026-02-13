import { NextRequest, NextResponse } from "next/server";
import { getRecommendations, getPopularPairings } from "@/lib/ai";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { customerId, currentItemName } = await request.json();

    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      select: { name: true, description: true, category: { select: { name: true } } },
    });

    const formattedMenu = menuItems.map((item) => ({
      name: item.name,
      description: item.description || "",
      category: item.category.name,
    }));

    if (currentItemName) {
      const pairings = await getPopularPairings(
        currentItemName,
        menuItems.map((m) => m.name)
      );
      return NextResponse.json({ recommendations: pairings, type: "pairing" });
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
              orderItems: {
                include: { menuItem: { select: { name: true } } },
              },
            },
          },
        },
      });

      if (customer && customer.orders.length > 0) {
        const history = customer.orders.flatMap((order) =>
          order.orderItems.map((item) => item.menuItem?.name || "")
        );

        const recommendations = await getRecommendations(history, formattedMenu);
        return NextResponse.json({ recommendations, type: "personalized" });
      }
    }

    const popularItems = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _count: { menuItemId: true },
      orderBy: { _count: { menuItemId: "desc" } },
      take: 5,
    });

    const popularNames = await Promise.all(
      popularItems.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
          select: { name: true },
        });
        return menuItem?.name || "";
      })
    );

    return NextResponse.json({
      recommendations: popularNames.filter(Boolean),
      type: "popular",
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ recommendations: [], type: "error" }, { status: 500 });
  }
}
