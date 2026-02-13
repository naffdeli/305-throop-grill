import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type UserRole = "ADMIN" | "CASHIER" | "KITCHEN";

export async function requireAuth(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      ),
    };
  }
  
  return { authorized: true, user: session.user };
}

export async function requireRole(request: NextRequest, allowedRoles: UserRole[]) {
  const session = await auth();
  
  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      ),
    };
  }
  
  const userRole = session.user.role as UserRole;
  
  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      ),
    };
  }
  
  return { authorized: true, user: session.user };
}

export async function requireAdmin(request: NextRequest) {
  return requireRole(request, ["ADMIN"]);
}

export async function requireStaff(request: NextRequest) {
  return requireRole(request, ["ADMIN", "CASHIER", "KITCHEN"]);
}
