/**
 * Adds the leaderboard feature to the database:
 *  - Room.successRate column (percentage 0-100, pushed by the desktop app)
 *  - LeaderboardEntry table (one row per completed/won game)
 * Safe to run multiple times.
 *
 * Usage:
 *   node scripts/add-leaderboard.mjs
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

async function tableExists(table) {
  const { rows } = await db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  );
  return rows.length > 0;
}

if (!(await columnExists("Room", "successRate"))) {
  await db.execute(`ALTER TABLE "Room" ADD COLUMN "successRate" REAL NOT NULL DEFAULT 0`);
  console.log("  ✓ Room.successRate column added");
} else {
  console.log("  - Room.successRate already exists");
}

if (!(await tableExists("LeaderboardEntry"))) {
  await db.execute(`
    CREATE TABLE "LeaderboardEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "roomId" TEXT NOT NULL,
      "groupName" TEXT NOT NULL,
      "partySize" INTEGER NOT NULL,
      "timeSpentSec" INTEGER NOT NULL,
      "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "LeaderboardEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await db.execute(
    `CREATE INDEX "LeaderboardEntry_roomId_timeSpentSec_idx" ON "LeaderboardEntry"("roomId", "timeSpentSec")`
  );
  console.log("  ✓ LeaderboardEntry table created");
} else {
  console.log("  - LeaderboardEntry table already exists");
}

console.log("\nDone.\n");
