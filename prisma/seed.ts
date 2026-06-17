import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

function createClient() {
  if (process.env.TURSO_DATABASE_URL) {
    const { createClient } = require("@libsql/client");
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  return new PrismaClient();
}

const prisma = createClient();

const OPEN_HOURS = {
  mon: { start: "14:00", end: "22:00" },
  tue: { start: "14:00", end: "22:00" },
  wed: { start: "14:00", end: "22:00" },
  thu: { start: "14:00", end: "22:00" },
  fri: { start: "12:00", end: "23:00" },
  sat: { start: "10:00", end: "23:00" },
  sun: { start: "10:00", end: "20:00" },
};

async function main() {
  console.log("Seeding database…");

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding");
  }
  const passwordHash = await hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  console.log(`Admin created: ${email}`);

  // Annabelle (horror)
  await prisma.room.upsert({
    where: { slug: "annabelle" },
    update: {},
    create: {
      slug: "annabelle",
      name: "Annabelle",
      tagline: "She was never just a doll. She was a doorway.",
      story: `The Warrens' artifact vault has been breached. One item is missing — the Annabelle doll. Your team has 60 minutes to locate her, contain her, and seal the ritual before she claims a new host. The paranormal investigators who tried before you never made it out. The lights flicker. The music box plays on its own. You are not alone in this room.

This experience is rated our most terrifying. Not recommended for those with heart conditions, severe anxiety, or a fear of the dark. You have been warned.`,
      heroImageUrl: "/images/annabelle-hero.jpg",
      galleryImageUrls: JSON.stringify([
        "/images/annabelle-1.jpg",
        "/images/annabelle-2.jpg",
        "/images/annabelle-3.jpg",
      ]),
      themeColors: JSON.stringify({ primary: "#1a0a0a", secondary: "#4a0000", accent: "#cc2200" }),
      themeFont: "gothic",
      difficulty: 5,
      durationMinutes: 60,
      minPlayers: 2,
      maxPlayers: 6,
      pricePerPerson: 25,
      openHours: JSON.stringify(OPEN_HOURS),
      active: true,
      seoTitle: "Annabelle Escape Room — Face Your Darkest Fear | EscapeZone",
      seoDescription:
        "Can you survive 60 minutes with the most haunted doll in history? Annabelle is our most terrifying escape room — for those brave enough to enter.",
    },
  });

  // Stranger Things (80s/retro sci-fi)
  await prisma.room.upsert({
    where: { slug: "stranger-things" },
    update: {},
    create: {
      slug: "stranger-things",
      name: "Stranger Things",
      tagline: "The Upside Down is real. It's bleeding through.",
      story: `Hawkins, Indiana, 1983. The lights in the Byers house are going crazy. Will is missing. A strange girl with a shaved head and nosebleeds keeps appearing at the edge of the woods. Your party of young investigators has stumbled onto something the government is desperate to keep buried — an inter-dimensional rift beneath Hawkins National Laboratory.

You have 60 minutes to rescue Will before the Demogorgon finds him. Locate Eleven's powers, crack the lab's code, and close the gate. The Mind Flayer is already aware of your presence. Ride like your life depends on it — because it does.`,
      heroImageUrl: "/images/stranger-things-hero.jpg",
      galleryImageUrls: JSON.stringify([
        "/images/stranger-things-1.jpg",
        "/images/stranger-things-2.jpg",
        "/images/stranger-things-3.jpg",
      ]),
      themeColors: JSON.stringify({ primary: "#0d0d1a", secondary: "#1a1a3e", accent: "#e8003d" }),
      themeFont: "retro",
      difficulty: 3,
      durationMinutes: 60,
      minPlayers: 2,
      maxPlayers: 8,
      pricePerPerson: 22,
      openHours: JSON.stringify(OPEN_HOURS),
      active: true,
      seoTitle: "Stranger Things Escape Room — Enter the Upside Down | EscapeZone",
      seoDescription:
        "Step into Hawkins, 1983. Find Will, close the gate, and outrun the Demogorgon in our 80s retro sci-fi escape room. Groups of 2–8.",
    },
  });

  // Breaking Bad (industrial)
  await prisma.room.upsert({
    where: { slug: "breaking-bad" },
    update: {},
    create: {
      slug: "breaking-bad",
      name: "Breaking Bad",
      tagline: "I am the danger. I am the one who knocks.",
      story: `Walter White's Albuquerque superlab has been raided by the DEA. Heisenberg has gone dark. One cook's worth of Blue Sky — worth $2 million on the street — is still somewhere in the lab, and the cartel wants it back in 60 minutes or they start making calls.

You've been sent in as the cleanup crew. Find the product, scrub the evidence, and get out before Agent Schrader and his team break down the door. The chemistry doesn't lie. Neither does the clock.`,
      heroImageUrl: "/images/breaking-bad-hero.jpg",
      galleryImageUrls: JSON.stringify([
        "/images/breaking-bad-1.jpg",
        "/images/breaking-bad-2.jpg",
        "/images/breaking-bad-3.jpg",
      ]),
      themeColors: JSON.stringify({ primary: "#0f0f0e", secondary: "#1c1c18", accent: "#c8a200" }),
      themeFont: "industrial",
      difficulty: 4,
      durationMinutes: 60,
      minPlayers: 2,
      maxPlayers: 6,
      pricePerPerson: 23,
      openHours: JSON.stringify(OPEN_HOURS),
      active: true,
      seoTitle: "Breaking Bad Escape Room — Cook, Clean, Escape | EscapeZone",
      seoDescription:
        "Enter Walter White's superlab before the DEA arrives. 60 minutes. Industrial-themed. The chemistry must be perfect — or you don't walk out.",
    },
  });

  console.log("Seeded 3 rooms.");
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
