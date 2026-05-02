import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError, apiSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

// GET /api/projects - List all projects the user is part of
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);

  let projects;
  if (user.role === "ADMIN") {
    // Admins see all projects
    projects = await prisma.project.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Members see only projects they belong to
    projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: user.userId },
          { members: { some: { userId: user.userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return apiSuccess({ projects });
}

// POST /api/projects - Create a new project (Admin only)
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("Only admins can create projects", 403);

  const body = await req.json();
  const { name, description } = body;

  if (!name || name.trim().length === 0) {
    return apiError("Project name is required");
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      ownerId: user.userId,
      members: {
        create: { userId: user.userId, role: "ADMIN" },
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });

  return apiSuccess({ project, message: "Project created" }, 201);
}
