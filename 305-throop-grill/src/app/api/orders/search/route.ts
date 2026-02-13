import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { OrderSearchSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone") || undefined;
    const orderNumber = searchParams.get("orderNumber");

    const validation = OrderSearchSchema.safeParse({
      phone,
      orderNumber: orderNumber ? parseInt(orderNumber) : undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      createdAt: {
        gte: today,
        lte: endOfDay,
      },
    };

    if (data.orderNumber) {
      where.orderNumber = data.orderNumber;
    }

    if (data.phone) {
      where.customer = {
        phone: { contains: data.phone.replace(/\D/g, "") },
      };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        orderItems: {
          select: {
            quantity: true,
            menuItem: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to search orders:", error);
    return NextResponse.json({ error: "Failed to search orders" }, { status: 500 });
  }
}
