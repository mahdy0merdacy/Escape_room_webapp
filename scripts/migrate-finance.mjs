import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

for (const sql of [
  `ALTER TABLE Booking ADD COLUMN amountPaid REAL`,
  `ALTER TABLE Booking ADD COLUMN confirmedPlayed INTEGER NOT NULL DEFAULT 0`,
]) {
  try {
    await client.execute(sql);
    console.log(`✓ ${sql}`);
  } catch (e) {
    if (String(e).includes("duplicate column")) {
      console.log(`  already exists: ${sql.split(" ").slice(-1)[0]}`);
    } else {
      throw e;
    }
  }
}

console.log("Done.");
process.exit(0);
