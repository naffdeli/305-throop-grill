import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff } from "@/lib/auth-middleware";
import { UpdateOrderSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireStaff(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireStaff(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    const validation = UpdateOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (data.status === "NO_SHOW") {
      const order = await prisma.$transaction(async (tx) => {
        const existingNoShow = await tx.noShow.findUnique({
          where: { orderId: params.id },
        });

        if (existingNoShow) {
          throw new Error("Order already marked as no-show");
        }

        const currentOrder = await tx.order.findUnique({
          where: { id: params.id },
          select: { customerId: true, total: true, status: true },
        });

        if (!currentOrder) {
          throw new Error("Order not found");
        }

        if (currentOrder.status === "NO_SHOW") {
          throw new Error("Order already marked as no-show");
        }

        if (currentOrder.customerId) {
          await tx.customer.update({
            where: { id: currentOrder.customerId },
            data: {
              noShowCount: { increment: 1 },
              isFlagged: true,
            },
          });

          await tx.noShow.create({
            data: {
              customerId: currentOrder.customerId,
              orderId: params.id,
              orderValue: currentOrder.total,
            },
          });
        }

        return tx.order.update({
          where: { id: params.id },
          data: { status: "NO_SHOW" },
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
      });

      return NextResponse.json(order);
    }

    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;

      if (data.status === "READY") {
        updateData.readyAt = new Date();
      } else if (data.status === "PICKED_UP") {
        updateData.pickedUpAt = new Date();
      }
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order:", error);
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
