import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const dbUrl = process.env.DATABASE_URL || "";

  // PostgreSQL for production (Railway) or if explicitly provided
  if (dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres") || process.env.NODE_ENV === "production") {
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // SQLite for local dev
  const filePath = dbUrl.replace("file:", "") || "./prisma/dev.db";
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
