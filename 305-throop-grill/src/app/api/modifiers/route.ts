import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-middleware";
import { CreateModifierGroupSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    const validation = CreateModifierGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const modifierGroup = await prisma.modifierGroup.create({
      data: {
        name: data.name,
        menuItemId: data.menuItemId,
        selectionType: data.selectionType || "SINGLE",
        minSelections: data.minSelections || 0,
        maxSelections: data.maxSelections || 1,
        isRequired: data.isRequired || false,
        sortOrder: data.sortOrder || 0,
        modifiers: {
          create: data.modifiers?.map((mod, index) => ({
            name: mod.name,
            priceAdjustment: mod.priceAdjustment || 0,
            isAvailable: mod.isAvailable ?? true,
            isDefault: mod.isDefault || false,
            sortOrder: index,
          })) || [],
        },
      },
      include: { modifiers: true },
    });

    return NextResponse.json(modifierGroup, { status: 201 });
  } catch (error) {
    console.error("Failed to create modifier group:", error);
    return NextResponse.json({ error: "Failed to create modifier group" }, { status: 500 });
  }
}
