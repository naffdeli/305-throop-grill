import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff, requireAdmin } from "@/lib/auth-middleware";
import { UpdateCustomerSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireStaff(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            orderItems: {
              include: { menuItem: true },
            },
          },
        },
        noShows: {
          orderBy: { occurredAt: "desc" },
          include: { order: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
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

    const validation = UpdateCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: data.name,
        phone: data.phone?.replace(/\D/g, ""),
        email: data.email,
        isFlagged: data.isFlagged,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
