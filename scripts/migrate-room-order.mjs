/**
 * Adds order column to Room table and seeds initial values by name.
 * Safe to run multiple times.
 *
 * Usage:
 *   node scripts/migrate-room-order.mjs
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

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

if (!(await columnExists("Room", "order"))) {
  await db.execute(`ALTER TABLE "Room" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0`);
  console.log("  ✓ Room.order added");
} else {
  console.log("  - Room.order already exists");
}

// Seed initial order values by current name (alphabetical) so existing rooms get a stable starting order
const { rows } = await db.execute(`SELECT id, name FROM "Room" ORDER BY name ASC`);
for (let i = 0; i < rows.length; i++) {
  await db.execute({ sql: `UPDATE "Room" SET "order" = ? WHERE id = ?`, args: [i, rows[i].id] });
  console.log(`  ✓ ${rows[i].name} → order ${i}`);
}

console.log("\nDone.\n");
