import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

  // For production PostgreSQL on Railway, use standard client
  if (dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres")) {
    return new PrismaClient({ log: ["error"] });
  }

  // SQLite for local dev
  const filePath = dbUrl.replace("file:", "");
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
