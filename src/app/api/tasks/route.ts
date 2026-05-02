import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError, apiSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

// GET /api/tasks - List tasks
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status");
  const assigneeId = url.searchParams.get("assigneeId");

  const where: Record<string, unknown> = {};

  if (user.role !== "ADMIN") {
    // Members only see tasks in their projects
    where.OR = [
      { assigneeId: user.userId },
      {
        project: {
          OR: [
            { ownerId: user.userId },
            { members: { some: { userId: user.userId } } },
          ],
        },
      },
    ];
  }

  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return apiSuccess({ tasks });
}

// POST /api/tasks - Create task (Admin only)
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("Only admins can create tasks", 403);

  const body = await req.json();
  const { title, description, status, priority, dueDate, projectId, assigneeId } = body;

  if (!title || title.trim().length === 0) return apiError("Task title is required");
  if (!projectId) return apiError("Project ID is required");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return apiError("Project not found", 404);

  const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];

  if (status && !validStatuses.includes(status)) return apiError("Invalid status");
  if (priority && !validPriorities.includes(priority)) return apiError("Invalid priority");

  if (assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee) return apiError("Assignee not found", 404);
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      assigneeId: assigneeId || null,
      creatorId: user.userId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return apiSuccess({ task, message: "Task created" }, 201);
}
