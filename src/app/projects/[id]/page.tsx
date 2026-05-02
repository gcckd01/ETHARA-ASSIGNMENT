"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

interface Member { id: string; role: string; user: { id: string; name: string; email: string; role: string }; }
interface Task { id: string; title: string; description: string | null; status: string; priority: string; dueDate: string | null; assignee: { id: string; name: string; email: string } | null; creator: { name: string } | null; }
interface Project { id: string; name: string; description: string | null; owner: { id: string; name: string; email: string }; members: Member[]; tasks: Task[]; }

function TaskModal({ projectId, members, task, onClose, onSaved, isAdmin }: {
  projectId: string; members: Member[]; task?: Task; onClose: () => void; onSaved: () => void; isAdmin: boolean;
}) {
  const [form, setForm] = useState({ title: task?.title || "", description: task?.description || "", status: task?.status || "TODO", priority: task?.priority || "MEDIUM", dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "", assigneeId: task?.assignee?.id || "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const payload = { ...form, projectId, assigneeId: form.assigneeId || null };
    const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
    const method = task ? "PUT" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setLoading(false); return; }
    onSaved(); onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{task ? "Edit Task" : "✨ Create Task"}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required disabled={!isAdmin} /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Details…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} disabled={!isAdmin} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="TODO">Todo</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
              </select></div>
            <div className="form-group"><label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} disabled={!isAdmin}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select></div>
          </div>
          {isAdmin && <div className="form-row">
            <div className="form-group"><label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Assignee</label>
              <select className="form-select" value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
              </select></div>
          </div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving…" : task ? "Update" : "Create Task"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }: { projectId: string; onClose: () => void; onAdded: () => void }) {
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const r = await fetch(`/api/projects/${projectId}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setLoading(false); return; }
    onAdded(); onClose();
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>👥 Add Member</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Member Email</label>
            <input type="email" className="form-input" placeholder="member@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Adding…" : "Add Member"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLS = ["TODO", "IN_PROGRESS", "DONE"];
const COL_LABELS: Record<string, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTask, setShowTask] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  const [tab, setTab] = useState<"board" | "members">("board");

  const load = () => {
    setLoading(true);
    fetch(`/api/projects/${id}`).then(r => { if (!r.ok) router.push("/projects"); return r.json(); })
      .then(d => setProject(d.project)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const deleteProject = async () => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/projects");
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/projects/${id}/members`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    load();
  };

  const isOverdue = (d: string | null, s: string) => d && new Date(d) < new Date() && s !== "DONE";

  if (loading) return <AppLayout><div className="loading-center"><div className="spinner"/></div></AppLayout>;
  if (!project) return null;

  const tasksByStatus = COLS.reduce((acc, s) => { acc[s] = project.tasks.filter(t => t.status === s); return acc; }, {} as Record<string, Task[]>);

  return (
    <AppLayout>
      <div className="topbar">
        <div>
          <a href="/projects" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>Projects</a>
          <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>/</span>
          <span className="topbar-title">{project.name}</span>
        </div>
        <div className="topbar-actions">
          {user?.role === "ADMIN" && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMember(true)}>+ Member</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(undefined); setShowTask(true); }}>+ Task</button>
              <button className="btn btn-danger btn-sm" onClick={deleteProject}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="page-container">
        <div className="page-header">
          <h1>{project.name}</h1>
          <p>{project.description || "No description"} · Owner: {project.owner.name}</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["board", "members"].map(t => (
            <button key={t} onClick={() => setTab(t as "board" | "members")}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`}>
              {t === "board" ? "📋 Task Board" : "👥 Members"}
            </button>
          ))}
        </div>

        {tab === "board" && (
          <div className="task-board">
            {COLS.map(col => (
              <div key={col} className="task-col">
                <div className="task-col-header">
                  <span className="task-col-title" style={{ color: col === "DONE" ? "var(--green)" : col === "IN_PROGRESS" ? "var(--blue)" : "var(--text-secondary)" }}>{COL_LABELS[col]}</span>
                  <span className="task-col-count">{tasksByStatus[col].length}</span>
                </div>
                {tasksByStatus[col].length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No tasks</div>}
                {tasksByStatus[col].map(t => (
                  <div key={t.id} className="task-card" onClick={() => { if (user?.role === "ADMIN" || t.assignee?.id === user?.id) { setEditTask(t); setShowTask(true); } }}>
                    <div className="task-card-title">{t.title}</div>
                    <div className="task-card-meta">
                      <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                      {t.assignee && <span className="task-card-assignee"><span className="mini-avatar">{t.assignee.name[0]}</span>{t.assignee.name}</span>}
                      {t.dueDate && <span className={`task-card-due ${isOverdue(t.dueDate, t.status) ? "overdue" : ""}`}>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "members" && (
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Member</th><th>Email</th><th>System Role</th><th>Project Role</th>{user?.role === "ADMIN" && <th>Action</th>}</tr></thead>
              <tbody>
                {project.members.map(m => (
                  <tr key={m.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="mini-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{m.user.name[0]}</div>{m.user.name}</div></td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{m.user.email}</td>
                    <td><span className={`badge badge-${m.user.role.toLowerCase()}`}>{m.user.role}</span></td>
                    <td><span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span></td>
                    {user?.role === "ADMIN" && <td>
                      {m.user.id !== user?.id && <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.user.id)}>Remove</button>}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showTask && <TaskModal projectId={id} members={project.members} task={editTask} onClose={() => setShowTask(false)} onSaved={load} isAdmin={user?.role === "ADMIN"} />}
      {showMember && <AddMemberModal projectId={id} onClose={() => setShowMember(false)} onAdded={load} />}
    </AppLayout>
  );
}
