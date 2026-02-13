import { NextRequest, NextResponse } from "next/server";
import { getPopularPairings } from "@/lib/ai";
import prisma from "@/lib/db";
import { z } from "zod";

const RecommendationsSchema = z.object({
  currentItemName: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = RecommendationsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { currentItemName } = validation.data;

    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      select: { name: true },
    });

    if (currentItemName) {
      const pairings = await getPopularPairings(
        currentItemName,
        menuItems.map((m) => m.name)
      );
      return NextResponse.json({ recommendations: pairings, type: "pairing" });
    }

    const popularItems = await prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT mi.name, COUNT(*) as count
      FROM "OrderItem" oi
      JOIN "MenuItem" mi ON oi."menuItemId" = mi.id
      WHERE mi."isAvailable" = true
      GROUP BY mi.id, mi.name
      ORDER BY count DESC
      LIMIT 5
    `;

    return NextResponse.json({
      recommendations: popularItems.map(item => item.name),
      type: "popular",
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ recommendations: [], type: "error" }, { status: 500 });
  }
}
