import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const db = new Database(path.join(process.cwd(), "prisma", "dev.db"));

async function main() {
  console.log("🌱 Seeding database...");

  const adminPw = await bcrypt.hash("admin123", 12);
  const memberPw = await bcrypt.hash("member123", 12);

  const now = new Date().toISOString();
  const adminId = "seed-admin-001";
  const memberId = "seed-member-001";
  const projectId = "seed-project-001";

  // Users
  db.prepare(`INSERT OR IGNORE INTO User (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(adminId, "Admin User", "admin@ethara.io", adminPw, "ADMIN", now, now);
  db.prepare(`INSERT OR IGNORE INTO User (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(memberId, "Jane Smith", "member@ethara.io", memberPw, "MEMBER", now, now);

  // Project
  db.prepare(`INSERT OR IGNORE INTO Project (id, name, description, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`).run(projectId, "Website Redesign", "Complete overhaul of the company website", adminId, now, now);

  // Members
  db.prepare(`INSERT OR IGNORE INTO ProjectMember (id, role, joinedAt, projectId, userId) VALUES (?, ?, ?, ?, ?)`).run("pm-1", "ADMIN", now, projectId, adminId);
  db.prepare(`INSERT OR IGNORE INTO ProjectMember (id, role, joinedAt, projectId, userId) VALUES (?, ?, ?, ?, ?)`).run("pm-2", "MEMBER", now, projectId, memberId);

  // Tasks
  const tasks = [
    ["task-1", "Design new homepage mockup", "Create wireframes and hi-fi mockups", "DONE", "HIGH", null, projectId, memberId, adminId],
    ["task-2", "Implement authentication flow", "JWT-based auth with role checks", "IN_PROGRESS", "HIGH", null, projectId, memberId, adminId],
    ["task-3", "Write API documentation", "Document all REST endpoints with examples", "TODO", "MEDIUM", null, projectId, memberId, adminId],
    ["task-4", "Set up CI/CD pipeline", "GitHub Actions for automated deployment", "TODO", "LOW", null, projectId, adminId, adminId],
    ["task-5", "Performance optimization", "Lighthouse score > 90", "TODO", "MEDIUM", "2026-04-01T00:00:00.000Z", projectId, memberId, adminId],
  ];

  for (const [id, title, description, status, priority, dueDate, proj, assignee, creator] of tasks) {
    db.prepare(`INSERT OR IGNORE INTO Task (id, title, description, status, priority, dueDate, projectId, assigneeId, creatorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, title, description, status, priority, dueDate, proj, assignee, creator, now, now);
  }

  console.log("✅ Seed complete!");
  console.log("   Admin:  admin@ethara.io / admin123");
  console.log("   Member: member@ethara.io / member123");
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
