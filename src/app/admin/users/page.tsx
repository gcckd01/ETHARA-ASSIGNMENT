"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

interface User { id: string; name: string; email: string; role: string; createdAt: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || [])).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="topbar"><span className="topbar-title">User Management</span></div>
      <div className="page-container">
        <div className="page-header">
          <h1>Users</h1>
          <p>All registered users in the system</p>
        </div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="mini-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{u.name[0]}</div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div></td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{u.email}</td>
                      <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
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
