import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError, apiSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// POST /api/projects/[id]/members - Add a member to project
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("Only admins can manage members", 403);

  const { id: projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return apiError("Project not found", 404);

  const body = await req.json();
  const { email, memberRole } = body;

  if (!email) return apiError("Email is required");

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) return apiError("User not found with that email", 404);

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUser.id } },
  });
  if (existing) return apiError("User is already a member of this project", 409);

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: targetUser.id,
      role: memberRole === "ADMIN" ? "ADMIN" : "MEMBER",
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return apiSuccess({ member, message: "Member added successfully" }, 201);
}

// DELETE /api/projects/[id]/members - Remove a member
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("Only admins can remove members", 403);

  const { id: projectId } = await params;
  const body = await req.json();
  const { userId } = body;

  if (!userId) return apiError("userId is required");

  await prisma.projectMember.deleteMany({
    where: { projectId, userId },
  });

  return apiSuccess({ message: "Member removed" });
}

// GET /api/projects/[id]/members - List members
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);

  const { id: projectId } = await params;
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return apiSuccess({ members });
}
