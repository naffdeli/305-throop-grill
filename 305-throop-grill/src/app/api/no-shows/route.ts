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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (startDate && endDate) {
      where.occurredAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const noShows = await prisma.noShow.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      include: {
        customer: true,
        order: {
          include: {
            orderItems: {
              include: { menuItem: true },
            },
          },
        },
      },
    });

    const totalLostRevenue = noShows.reduce(
      (sum, ns) => sum + Number(ns.orderValue),
      0
    );

    const repeatOffenders = await prisma.customer.findMany({
      where: { noShowCount: { gte: 2 } },
      orderBy: { noShowCount: "desc" },
    });

    return NextResponse.json({
      noShows,
      totalLostRevenue,
      totalCount: noShows.length,
      repeatOffenders,
    });
  } catch (error) {
    console.error("Failed to fetch no-shows:", error);
    return NextResponse.json({ error: "Failed to fetch no-shows" }, { status: 500 });
  }
}
