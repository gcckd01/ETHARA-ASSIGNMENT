import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const dbUrl = process.env.DATABASE_URL || "";

  // For production PostgreSQL on Railway
  if (dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres") || process.env.NODE_ENV === "production") {
    return new PrismaClient();
  }

  // SQLite for local dev (Only if needed)
  try {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const filePath = dbUrl.replace("file:", "") || "./prisma/dev.db";
    const adapter = new PrismaBetterSqlite3({ url: filePath });
    return new PrismaClient({ adapter });
  } catch (e) {
    // Fallback for environments where better-sqlite3 isn't installed (like production)
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
