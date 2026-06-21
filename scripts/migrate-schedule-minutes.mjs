import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Add openMinute and closeMinute columns (safe to re-run — ignores if already exist)
for (const col of ["openMinute", "closeMinute"]) {
  try {
    await client.execute(
      `ALTER TABLE "ScheduleConfig" ADD COLUMN "${col}" INTEGER NOT NULL DEFAULT 0`
    );
    console.log(`Added column: ${col}`);
  } catch {
    console.log(`Column ${col} already exists — skipping`);
  }
}

console.log("Done.");
client.close();
