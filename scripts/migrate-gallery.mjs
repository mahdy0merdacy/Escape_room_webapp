import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.execute(`
  CREATE TABLE IF NOT EXISTS GalleryAlbum (
    id        TEXT NOT NULL PRIMARY KEY,
    label     TEXT NOT NULL,
    sub       TEXT NOT NULL DEFAULT '',
    accent    TEXT NOT NULL DEFAULT '#e11d48',
    featured  INTEGER NOT NULL DEFAULT 0,
    "order"   INTEGER NOT NULL DEFAULT 0,
    active    INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log("✓ GalleryAlbum table created (or already exists)");

// Seed default albums if the table is empty
const { rows } = await client.execute("SELECT COUNT(*) as n FROM GalleryAlbum");
if (Number(rows[0].n) === 0) {
  const seeds = [
    { label: "The Horror Room",  sub: "Can you handle the dark?",       accent: "#e11d48", featured: 1, order: 0 },
    { label: "Sci-Fi Escape",    sub: "Team photo after escaping 👾",    accent: "#7c3aed", featured: 0, order: 1 },
    { label: "Crime Scene",      sub: "We solved it in 47 min!",         accent: "#0891b2", featured: 0, order: 2 },
    { label: "Group of 6",       sub: "Birthday escape 🎉",               accent: "#d97706", featured: 0, order: 3 },
    { label: "Corporate team",   sub: "Company outing — great fun!",     accent: "#059669", featured: 0, order: 4 },
  ];
  for (const s of seeds) {
    await client.execute({
      sql: `INSERT INTO GalleryAlbum (id, label, sub, accent, featured, "order") VALUES (?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), s.label, s.sub, s.accent, s.featured, s.order],
    });
  }
  console.log("✓ Seeded 5 default albums");
} else {
  console.log("  Albums already exist, skipping seed");
}

console.log("Done.");
process.exit(0);
