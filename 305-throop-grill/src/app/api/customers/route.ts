import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireStaff, requireAdmin } from "@/lib/auth-middleware";
import { CreateCustomerSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const authResult = await requireStaff(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const flaggedOnly = searchParams.get("flagged") === "true";

    const where: any = {};

    if (phone) {
      where.phone = { contains: phone.replace(/\D/g, "") };
    }

    if (flaggedOnly) {
      where.isFlagged = true;
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true, noShows: true },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaff(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    const validation = CreateCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone.replace(/\D/g, ""),
        email: data.email,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
