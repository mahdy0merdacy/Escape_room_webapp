/**
 * Replaces the full-table unique index on Booking(roomId, startTime) with a
 * partial one that excludes cancelled bookings — a soft-cancelled row was
 * permanently blocking its slot from ever being rebooked. Safe to run multiple
 * times.
 *
 * Usage:
 *   node scripts/fix-booking-unique-index.mjs
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

async function indexExists(name) {
  const { rows } = await db.execute({
    sql: `SELECT name FROM sqlite_master WHERE type='index' AND name = ?`,
    args: [name],
  });
  return rows.length > 0;
}

if (await indexExists("Booking_roomId_startTime_key")) {
  await db.execute(`DROP INDEX "Booking_roomId_startTime_key"`);
  console.log("  ✓ Dropped old full-table unique index");
} else {
  console.log("  - Old index already absent, skipping drop");
}

if (!(await indexExists("Booking_roomId_startTime_active_key"))) {
  await db.execute(`
    CREATE UNIQUE INDEX "Booking_roomId_startTime_active_key"
      ON "Booking"("roomId", "startTime")
      WHERE "status" != 'cancelled'
  `);
  console.log("  ✓ Created partial unique index (excludes cancelled bookings)");
} else {
  console.log("  - Partial unique index already exists");
}

console.log("\nDone.\n");
