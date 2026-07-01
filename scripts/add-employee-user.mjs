/**
 * Adds the `role` column to AdminUser and creates the employee account.
 * Safe to run multiple times.
 *
 * Usage:
 *   node scripts/add-employee-user.mjs
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { hash } from "bcryptjs";

function loadEnvFile(path) {
  try {
    const lines = readFileSync(path, "utf8").split("\n");
    for (const raw of lines) {
      const line = raw.startsWith("# ") ? raw.slice(2) : raw;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
      if ((key === "TURSO_DATABASE_URL" || key === "TURSO_AUTH_TOKEN") && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // file not found — skip
  }
}

if (!process.env.TURSO_DATABASE_URL) {
  loadEnvFile(".env");
  loadEnvFile(".env.local");
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

console.log("Connecting to:", url);
const db = createClient({ url, authToken });

async function columnExists(table, column) {
  const { rows } = await db.execute(`PRAGMA table_info("${table}")`);
  return rows.some((r) => r.name === column);
}

// 1. Add role column
if (!(await columnExists("AdminUser", "role"))) {
  await db.execute(`ALTER TABLE "AdminUser" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'owner'`);
  console.log("  ✓ AdminUser.role column added");
} else {
  console.log("  - AdminUser.role already exists");
}

// 2. Create or update employee user
const passwordHash = await hash("employee", 12);
const existing = await db.execute({
  sql: `SELECT id FROM "AdminUser" WHERE email = ?`,
  args: ["employee@elharba.com"],
});

if (existing.rows.length === 0) {
  await db.execute({
    sql: `INSERT INTO "AdminUser" (id, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), "employee@elharba.com", passwordHash, "employee", new Date().toISOString()],
  });
  console.log("  ✓ Created employee@elharba.com");
} else {
  await db.execute({
    sql: `UPDATE "AdminUser" SET passwordHash = ?, role = ? WHERE email = ?`,
    args: [passwordHash, "employee", "employee@elharba.com"],
  });
  console.log("  - employee@elharba.com already exists — password and role updated");
}

console.log("\nDone.\n");
