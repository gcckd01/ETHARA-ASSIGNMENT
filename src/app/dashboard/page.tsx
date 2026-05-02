"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Stats {
  totalTasks: number; todoTasks: number; inProgressTasks: number;
  doneTasks: number; overdueTasks: number; totalProjects: number; completionRate: number;
}
interface Task {
  id: string; title: string; status: string; priority: string; dueDate: string | null;
  project: { id: string; name: string }; assignee: { name: string } | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      setStats(d.stats); setTasks(d.recentTasks || []);
    }).finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => s === "DONE" ? "var(--green)" : s === "IN_PROGRESS" ? "var(--blue)" : "var(--text-muted)";
  const priorityBadge = (p: string) => `badge badge-${p.toLowerCase()}`;
  const isOverdue = (d: string | null, status: string) => d && new Date(d) < new Date() && status !== "DONE";

  if (loading) return <AppLayout><div className="loading-center"><div className="spinner"/></div></AppLayout>;

  return (
    <AppLayout>
      <div className="topbar">
        <span className="topbar-title">Dashboard</span>
        <div className="topbar-actions">
          <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Welcome back, <strong>{user?.name}</strong> 👋</span>
        </div>
      </div>
      <div className="page-container">
        <div className="page-header">
          <h1>Overview</h1>
          <p>Here&apos;s what&apos;s happening across your projects</p>
        </div>

        {stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card stat-purple">
                <div className="stat-icon">📁</div>
                <div className="stat-value">{stats.totalProjects}</div>
                <div className="stat-label">Total Projects</div>
              </div>
              <div className="stat-card stat-blue">
                <div className="stat-icon">✓</div>
                <div className="stat-value">{stats.totalTasks}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card stat-yellow">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{stats.inProgressTasks}</div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-card stat-green">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.doneTasks}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card stat-red">
                <div className="stat-icon">🔥</div>
                <div className="stat-value">{stats.overdueTasks}</div>
                <div className="stat-label">Overdue</div>
              </div>
              <div className="stat-card stat-green">
                <div className="stat-icon">📈</div>
                <div className="stat-value">{stats.completionRate}%</div>
                <div className="stat-label">Completion Rate</div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Overall Progress</span>
                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{stats.completionRate}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${stats.completionRate}%` }}/></div>
              <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: 13, color: "var(--text-secondary)" }}>
                <span>📝 {stats.todoTasks} Todo</span>
                <span>⚡ {stats.inProgressTasks} In Progress</span>
                <span>✅ {stats.doneTasks} Done</span>
              </div>
            </div>
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent Tasks</h2>
          <Link href="/tasks" className="btn btn-secondary btn-sm">View All →</Link>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><h3>No tasks yet</h3><p>Tasks will appear here once created</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th></tr></thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id}>
                      <td><Link href={`/tasks?id=${t.id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}>{t.title}</Link></td>
                      <td><Link href={`/projects/${t.project.id}`} style={{ color: "var(--accent-bright)", textDecoration: "none", fontSize: 13 }}>{t.project.name}</Link></td>
                      <td><span style={{ color: statusColor(t.status), fontSize: 13, fontWeight: 600 }}>{t.status.replace("_", " ")}</span></td>
                      <td><span className={priorityBadge(t.priority)}>{t.priority}</span></td>
                      <td><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.assignee?.name || "—"}</span></td>
                      <td><span style={{ fontSize: 13, color: isOverdue(t.dueDate, t.status) ? "var(--red)" : "var(--text-secondary)" }}>
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                      </span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
