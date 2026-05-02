"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

interface Project { id: string; name: string; description: string | null; owner: { name: string }; _count: { tasks: number; members: number }; createdAt: string; }

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setLoading(false); return; }
    onCreated(); onClose();
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>✨ Create Project</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Project Name *</label>
            <input id="proj-name" className="form-input" placeholder="My Awesome Project" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea id="proj-desc" className="form-textarea" placeholder="What is this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="proj-submit" type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating…" : "Create Project"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => { setLoading(true); fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || [])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  return (
    <AppLayout>
      <div className="topbar">
        <span className="topbar-title">Projects</span>
        {user?.role === "ADMIN" && (
          <button id="open-create-project" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New Project</button>
        )}
      </div>
      <div className="page-container">
        <div className="page-header">
          <h1>Projects</h1>
          <p>{user?.role === "ADMIN" ? "Manage all projects and teams" : "Projects you are a member of"}</p>
        </div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> :
          projects.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📁</div><h3>No projects yet</h3>
              <p>{user?.role === "ADMIN" ? "Create your first project to get started" : "You haven't been added to any projects yet"}</p>
              {user?.role === "ADMIN" && <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}>Create Project</button>}
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(p => (
                <a key={p.id} href={`/projects/${p.id}`} className="project-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div className="project-card-title">{p.name}</div>
                  </div>
                  <div className="project-card-desc">{p.description || "No description provided"}</div>
                  <div className="project-card-footer">
                    <div className="project-card-stat"><span>✓</span>{p._count.tasks} tasks</div>
                    <div className="project-card-stat"><span>👥</span>{p._count.members} members</div>
                    <div className="project-card-stat" style={{ fontSize: 11 }}>{p.owner.name}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
      </div>
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </AppLayout>
  );
}
