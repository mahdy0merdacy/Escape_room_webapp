import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.execute(`
  CREATE TABLE IF NOT EXISTS "ScheduleConfig" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "openHour"     INTEGER NOT NULL DEFAULT 11,
    "closeHour"    INTEGER NOT NULL DEFAULT 1,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

await client.execute(`
  INSERT OR IGNORE INTO "ScheduleConfig" ("id", "openHour", "closeHour", "breakMinutes", "updatedAt")
  VALUES ('default', 11, 1, 0, CURRENT_TIMESTAMP)
`);

console.log("ScheduleConfig table ready.");
client.close();
