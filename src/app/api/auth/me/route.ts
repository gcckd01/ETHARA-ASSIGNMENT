import { getAuthUser, apiError, apiSuccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!dbUser) return apiError("User not found", 404);
  return apiSuccess({ user: dbUser });
}
