/**
 * Read-only: dumps Room.successRate and the most recent LeaderboardEntry rows
 * from Turso, to sanity-check what the desktop app actually wrote.
 *
 * Usage:
 *   node scripts/inspect-leaderboard.mjs
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

const db = createClient({ url, authToken });

console.log("\n=== Room success rates ===");
const { rows: rooms } = await db.execute(
  `SELECT "slug", "name", "successRate" FROM "Room" ORDER BY "order" ASC`
);
console.table(rooms);

console.log("\n=== Last 10 LeaderboardEntry rows ===");
const { rows: entries } = await db.execute(`
  SELECT le."groupName", le."partySize", le."timeSpentSec", le."completedAt", r."slug" AS room
  FROM "LeaderboardEntry" le
  JOIN "Room" r ON r."id" = le."roomId"
  ORDER BY le."createdAt" DESC
  LIMIT 10
`);
console.table(entries);
