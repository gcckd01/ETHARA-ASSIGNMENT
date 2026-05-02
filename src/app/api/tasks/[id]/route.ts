import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError, apiSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!task) return apiError("Task not found", 404);

  // Access check for members
  if (user.role !== "ADMIN") {
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: user.userId },
    });
    const isAssignee = task.assigneeId === user.userId;
    const isOwner = (await prisma.project.findFirst({
      where: { id: task.projectId, ownerId: user.userId },
    })) !== null;

    if (!isMember && !isAssignee && !isOwner) {
      return apiError("Access denied", 403);
    }
  }

  return apiSuccess({ task });
}

// PUT /api/tasks/[id] - Update task
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return apiError("Task not found", 404);

  const body = await req.json();
  const { title, description, status, priority, dueDate, assigneeId } = body;

  // Members can only update the status of tasks assigned to them
  if (user.role !== "ADMIN") {
    if (task.assigneeId !== user.userId) {
      return apiError("You can only update your own assigned tasks", 403);
    }
    if (Object.keys(body).some((k) => k !== "status")) {
      return apiError("Members can only update task status", 403);
    }
  }

  const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];
  if (status && !validStatuses.includes(status)) return apiError("Invalid status");
  if (priority && !validPriorities.includes(priority)) return apiError("Invalid priority");

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return apiSuccess({ task: updated, message: "Task updated" });
}

// DELETE /api/tasks/[id] - Admin only
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("Only admins can delete tasks", 403);

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return apiError("Task not found", 404);

  await prisma.task.delete({ where: { id } });
  return apiSuccess({ message: "Task deleted" });
}
