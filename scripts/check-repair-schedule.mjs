/**
 * Diagnostic + repair script for the schedule feature.
 * Run with your Turso credentials:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/check-repair-schedule.mjs
 * Or uncomment the TURSO_* lines in .env.local and run:
 *   node -r dotenv/config scripts/check-repair-schedule.mjs dotenv_config_path=.env.local
 */
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const db = createClient({ url, authToken });

// ── 1. List all tables ─────────────────────────────────────────────────────
const { rows: tableRows } = await db.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
console.log("\nTables in Turso database:");
tableRows.forEach((r) => console.log("  -", r.name));

const tableNames = tableRows.map((r) => r.name);

// ── 2. Check ScheduleConfig ────────────────────────────────────────────────
if (!tableNames.includes("ScheduleConfig")) {
  console.log("\n⚠  ScheduleConfig is MISSING — creating it now...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "ScheduleConfig" (
      "id"           TEXT     NOT NULL PRIMARY KEY,
      "openHour"     INTEGER  NOT NULL DEFAULT 11,
      "openMinute"   INTEGER  NOT NULL DEFAULT 0,
      "closeHour"    INTEGER  NOT NULL DEFAULT 1,
      "closeMinute"  INTEGER  NOT NULL DEFAULT 0,
      "breakMinutes" INTEGER  NOT NULL DEFAULT 0,
      "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ScheduleConfig created ✓");
} else {
  const { rows } = await db.execute('SELECT * FROM "ScheduleConfig"');
  console.log("\n✓  ScheduleConfig exists. Rows:", rows.length ? rows : "(empty — defaults will be used on first save)");
}

// ── 3. Check BlockedSlot ───────────────────────────────────────────────────
if (!tableNames.includes("BlockedSlot")) {
  console.log("\n⚠  BlockedSlot is MISSING — creating it now...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "BlockedSlot" (
      "id"        TEXT     NOT NULL PRIMARY KEY,
      "roomId"    TEXT     NOT NULL,
      "slotStart" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("roomId", "slotStart")
    )
  `);
  console.log("  BlockedSlot created ✓");
} else {
  const { rows } = await db.execute(
    'SELECT COUNT(*) as cnt FROM "BlockedSlot"'
  );
  console.log(`\n✓  BlockedSlot exists. Row count: ${rows[0].cnt}`);
}

// ── 4. Column details for ScheduleConfig ──────────────────────────────────
const { rows: cols } = await db.execute(
  'PRAGMA table_info("ScheduleConfig")'
);
console.log("\nScheduleConfig columns:");
cols.forEach((c) => console.log(`  ${c.cid}  ${c.name}  ${c.type}  notnull=${c.notnull}  dflt=${c.dflt_value}`));

console.log("\nDone.\n");
