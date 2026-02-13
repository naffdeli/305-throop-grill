import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-middleware";
import { UpdateModifierGroupSchema } from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    const validation = UpdateModifierGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    await prisma.modifier.deleteMany({
      where: { modifierGroupId: params.id },
    });

    const modifierGroup = await prisma.modifierGroup.update({
      where: { id: params.id },
      data: {
        name: data.name,
        selectionType: data.selectionType,
        minSelections: data.minSelections,
        maxSelections: data.maxSelections,
        isRequired: data.isRequired,
        sortOrder: data.sortOrder,
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

    return NextResponse.json(modifierGroup);
  } catch (error) {
    console.error("Failed to update modifier group:", error);
    return NextResponse.json({ error: "Failed to update modifier group" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    await prisma.modifierGroup.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete modifier group:", error);
    return NextResponse.json({ error: "Failed to delete modifier group" }, { status: 500 });
  }
}
