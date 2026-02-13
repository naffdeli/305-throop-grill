import { NextRequest, NextResponse } from "next/server";
import { getChatResponse } from "@/lib/ai";
import prisma from "@/lib/db";
import { z } from "zod";

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(1000, "Message too long"),
  })).min(1).max(10, "Too many messages"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = ChatRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { messages } = validation.data;

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        menuItems: {
          where: { isAvailable: true },
          select: { name: true, description: true, price: true },
        },
      },
    });

    const menuContext = categories
      .map(
        (cat) =>
          `${cat.name}: ${cat.menuItems.map((item) => `${item.name} ($${item.price})`).join(", ")}`
      )
      .join("\n");

    const response = await getChatResponse(messages, menuContext);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat", message: "I'm having trouble right now. Please ask staff for help." },
      { status: 500 }
    );
  }
}
