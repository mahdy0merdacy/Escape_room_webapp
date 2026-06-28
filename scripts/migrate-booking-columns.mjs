/**
 * Adds columns that exist in the Prisma schema but were missing from the
 * original Booking migration:
 *   - amountPaid  (nullable float)
 *   - confirmedPlayed (boolean, default false)
 *
 * Also adds roomStatus to Room if missing.
 *
 * Safe to run multiple times — checks column list before altering.
 *
 * Usage (reads TURSO_* from .env.local automatically):
 *   node scripts/migrate-booking-columns.mjs
 *
 * Or pass credentials explicitly:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=eyJ... node scripts/migrate-booking-columns.mjs
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

// Auto-load from .env / .env.local if env vars not already set
function loadEnvFile(path) {
  try {
    const lines = readFileSync(path, "utf8").split("\n");
    for (const raw of lines) {
      const line = raw.startsWith("# ") ? raw.slice(2) : raw; // strip leading comment
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
  console.error("Make sure .env.local has these set (even if commented out), or pass them explicitly.");
  process.exit(1);
}

console.log("Connecting to:", url);

const db = createClient({ url, authToken });

async function columnExists(table, column) {
  const { rows } = await db.execute(`PRAGMA table_info("${table}")`);
  return rows.some((r) => r.name === column);
}

// ── Booking: amountPaid ────────────────────────────────────────────────────
if (!(await columnExists("Booking", "amountPaid"))) {
  await db.execute(`ALTER TABLE "Booking" ADD COLUMN "amountPaid" REAL`);
  console.log("  ✓ Booking.amountPaid added");
} else {
  console.log("  - Booking.amountPaid already exists");
}

// ── Booking: confirmedPlayed ───────────────────────────────────────────────
if (!(await columnExists("Booking", "confirmedPlayed"))) {
  await db.execute(
    `ALTER TABLE "Booking" ADD COLUMN "confirmedPlayed" BOOLEAN NOT NULL DEFAULT false`
  );
  console.log("  ✓ Booking.confirmedPlayed added");
} else {
  console.log("  - Booking.confirmedPlayed already exists");
}

// ── Room: roomStatus ───────────────────────────────────────────────────────
if (!(await columnExists("Room", "roomStatus"))) {
  await db.execute(
    `ALTER TABLE "Room" ADD COLUMN "roomStatus" TEXT NOT NULL DEFAULT 'active'`
  );
  console.log("  ✓ Room.roomStatus added");
} else {
  console.log("  - Room.roomStatus already exists");
}

console.log("\nDone — all columns are present.\n");
