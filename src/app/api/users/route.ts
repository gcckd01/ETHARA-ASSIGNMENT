import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError, apiSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

// GET /api/users - List all users (Admin only, for assigning tasks)
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("Access denied", 403);

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return apiSuccess({ users });
}
