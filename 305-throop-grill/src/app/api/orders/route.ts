import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { TAX_RATE } from "@/lib/utils";
import { requireStaff } from "@/lib/auth-middleware";
import { CreateOrderSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const authResult = await requireStaff(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const date = searchParams.get("date");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        staff: true,
        orderItems: {
          include: {
            menuItem: true,
            customizations: {
              include: { modifier: true },
            },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = CreateOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const order = await prisma.$transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sequence = await tx.dailyOrderSequence.upsert({
        where: { date: today },
        update: { lastNumber: { increment: 1 } },
        create: { date: today, lastNumber: 1 },
      });

      const orderNumber = sequence.lastNumber;
      const subtotal = data.subtotal;
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax;

      let customerId = data.customerId;

      if (!customerId && data.customerName && data.customerPhone) {
        const customer = await tx.customer.upsert({
          where: { phone: data.customerPhone },
          update: {
            name: data.customerName,
            email: data.customerEmail,
            totalOrders: { increment: 1 },
          },
          create: {
            name: data.customerName,
            phone: data.customerPhone,
            email: data.customerEmail,
            totalOrders: 1,
          },
        });
        customerId = customer.id;
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          staffId: data.staffId,
          source: data.source,
          subtotal,
          tax,
          total,
          specialInstructions: data.specialInstructions,
          pickupTime: data.pickupTime ? new Date(data.pickupTime) : null,
          orderItems: {
            create: data.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes,
              customizations: {
                create: item.customizations?.map((c) => ({
                  modifierId: c.modifierId,
                  priceAdjustment: c.priceAdjustment,
                })) || [],
              },
            })),
          },
        },
        include: {
          customer: true,
          staff: true,
          orderItems: {
            include: {
              menuItem: true,
              customizations: {
                include: { modifier: true },
              },
            },
          },
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
