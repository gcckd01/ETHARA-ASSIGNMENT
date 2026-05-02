"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

interface Task { id: string; title: string; description: string | null; status: string; priority: string; dueDate: string | null; project: { id: string; name: string }; assignee: { id: string; name: string } | null; creator: { name: string } | null; updatedAt: string; }

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/tasks?${params}`).then(r => r.json()).then(d => setTasks(d.tasks || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const isOverdue = (d: string | null, s: string) => d && new Date(d) < new Date() && s !== "DONE";

  const filtered = tasks.filter(t => !priorityFilter || t.priority === priorityFilter);

  const updateStatus = async (taskId: string, newStatus: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    load();
  };

  return (
    <AppLayout>
      <div className="topbar">
        <span className="topbar-title">All Tasks</span>
      </div>
      <div className="page-container">
        <div className="page-header">
          <h1>Tasks</h1>
          <p>Track and manage all tasks across projects</p>
        </div>

        <div className="filters">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <span style={{ color: "var(--text-muted)", fontSize: 13, marginLeft: "auto" }}>{filtered.length} tasks</span>
        </div>

        {loading ? <div className="loading-center"><div className="spinner"/></div> :
          filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✅</div><h3>No tasks found</h3><p>Adjust filters or create tasks from a project</p></div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Title</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th>{user?.role !== "ADMIN" && <th>Update Status</th>}</tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
                          {t.description && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.description.slice(0, 60)}…</div>}
                        </td>
                        <td>
                          <a href={`/projects/${t.project.id}`} style={{ color: "var(--accent-bright)", textDecoration: "none", fontSize: 13 }}>{t.project.name}</a>
                        </td>
                        <td>
                          <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status.replace("_", " ")}</span>
                        </td>
                        <td><span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                        <td>
                          {t.assignee ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="mini-avatar">{t.assignee.name[0]}</span>
                              <span style={{ fontSize: 13 }}>{t.assignee.name}</span>
                            </div>
                          ) : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>}
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: isOverdue(t.dueDate, t.status) ? "var(--red)" : "var(--text-secondary)" }}>
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                            {isOverdue(t.dueDate, t.status) && " ⚠️"}
                          </span>
                        </td>
                        {user?.role !== "ADMIN" && t.assignee?.id === user?.id && (
                          <td>
                            <select className="filter-select" style={{ fontSize: 12, padding: "4px 8px" }}
                              value={t.status} onChange={e => updateStatus(t.id, e.target.value)}>
                              <option value="TODO">Todo</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                          </td>
                        )}
                        {user?.role !== "ADMIN" && t.assignee?.id !== user?.id && <td />}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </AppLayout>
  );
}
