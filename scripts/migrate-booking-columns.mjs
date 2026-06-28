/**
 * Adds columns that exist in the Prisma schema but were missing from the
 * original Booking migration:
 *   - amountPaid  (nullable float)
 *   - confirmedPlayed (boolean, default false)
 *
 * Also adds roomStatus to Room if missing.
 *
 * Safe to run multiple times — uses IF NOT EXISTS / checks column list first.
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate-booking-columns.mjs
 */
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

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
