import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError, apiSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

async function checkProjectAccess(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return await prisma.project.findUnique({ where: { id: projectId } });
  }
  return await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
  });
}

// GET /api/projects/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const project = await checkProjectAccess(id, user.userId, user.role === "ADMIN");
  if (!project) return apiError("Project not found", 404);

  const fullProject = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return apiSuccess({ project: fullProject });
}

// PUT /api/projects/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("Only admins can update projects", 403);

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return apiError("Project not found", 404);

  const body = await req.json();
  const { name, description } = body;

  if (name !== undefined && name.trim().length === 0) {
    return apiError("Project name cannot be empty");
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  return apiSuccess({ project: updated, message: "Project updated" });
}

// DELETE /api/projects/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("Only admins can delete projects", 403);

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return apiError("Project not found", 404);

  await prisma.project.delete({ where: { id } });
  return apiSuccess({ message: "Project deleted" });
}
