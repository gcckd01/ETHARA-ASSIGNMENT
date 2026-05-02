import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError, apiSuccess } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Unauthorized", 401);

  const now = new Date();

  let taskWhere: Record<string, unknown> = {};
  let projectWhere: Record<string, unknown> = {};

  if (user.role !== "ADMIN") {
    taskWhere = {
      OR: [
        { assigneeId: user.userId },
        {
          project: {
            OR: [
              { ownerId: user.userId },
              { members: { some: { userId: user.userId } } },
            ],
          },
        },
      ],
    };
    projectWhere = {
      OR: [
        { ownerId: user.userId },
        { members: { some: { userId: user.userId } } },
      ],
    };
  }

  const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, totalProjects, recentTasks] =
    await Promise.all([
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: "TODO" } }),
      prisma.task.count({ where: { ...taskWhere, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...taskWhere, status: "DONE" } }),
      prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: { lt: now },
          status: { not: "DONE" },
        },
      }),
      prisma.project.count({ where: projectWhere }),
      prisma.task.findMany({
        where: taskWhere,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const stats = {
    totalTasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    overdueTasks,
    totalProjects,
    completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
  };

  return apiSuccess({ stats, recentTasks });
}
