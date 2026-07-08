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
    update: { heroImageUrl: "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/annabelle-hero.webp", tagline: "She was never just a doll. She was a doorway.", story: `Years ago, a doll maker and a missing girl vanished from the same hut, the same night. Neither was ever found. Now the hut has been reopened, and your team has been called in to investigate. You have 60 minutes to find out what happened — and to deal with whatever was left behind. The dolls don't always stay still. Past investigators didn't all make it out.\n\nThis experience is rated our most terrifying. Not recommended for those with heart conditions, severe anxiety, or a fear of the dark. You have been warned.` },
    create: {
      slug: "annabelle",
      name: "Annabelle",
      tagline: "She was never just a doll. She was a doorway.",
      story: `Years ago, a doll maker and a missing girl vanished from the same hut, the same night. Neither was ever found. Now the hut has been reopened, and your team has been called in to investigate. You have 60 minutes to find out what happened — and to deal with whatever was left behind. The dolls don't always stay still. Past investigators didn't all make it out.

This experience is rated our most terrifying. Not recommended for those with heart conditions, severe anxiety, or a fear of the dark. You have been warned.`,
      heroImageUrl: "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/annabelle-hero.webp",
      galleryImageUrls: JSON.stringify([]),
      themeColors: JSON.stringify({ primary: "#1a0a0a", secondary: "#4a0000", accent: "#cc2200" }),
      themeFont: "gothic",
      difficulty: 5,
      durationMinutes: 60,
      minPlayers: 2,
      maxPlayers: 6,
      pricePerPerson: 25,
      openHours: JSON.stringify(OPEN_HOURS),
      active: true,
      seoTitle: "Annabelle Escape Room — Face Your Darkest Fear | elharba",
      seoDescription:
        "Can you survive 60 minutes with the most haunted doll in history? Annabelle is our most terrifying escape room — for those brave enough to enter.",
    },
  });

  // Stranger Things (80s/retro sci-fi)
  await prisma.room.upsert({
    where: { slug: "stranger-things" },
    update: { heroImageUrl: "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/strangerthings-hero.jpg" },
    create: {
      slug: "stranger-things",
      name: "Stranger Things",
      tagline: "The Upside Down is real. It's bleeding through.",
      story: `Hawkins, Indiana, 1983. The lights in the Byers house are going crazy. Will is missing. A strange girl with a shaved head and nosebleeds keeps appearing at the edge of the woods. Your party of young investigators has stumbled onto something the government is desperate to keep buried — an inter-dimensional rift beneath Hawkins National Laboratory.

You have 60 minutes to rescue Will before the Demogorgon finds him. Locate Eleven's powers, crack the lab's code, and close the gate. The Mind Flayer is already aware of your presence. Ride like your life depends on it — because it does.`,
      heroImageUrl: "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/strangerthings-hero.jpg",
      galleryImageUrls: JSON.stringify([]),
      themeColors: JSON.stringify({ primary: "#0d0d1a", secondary: "#1a1a3e", accent: "#e8003d" }),
      themeFont: "retro",
      difficulty: 3,
      durationMinutes: 60,
      minPlayers: 2,
      maxPlayers: 8,
      pricePerPerson: 22,
      openHours: JSON.stringify(OPEN_HOURS),
      active: true,
      seoTitle: "Stranger Things Escape Room — Enter the Upside Down | elharba",
      seoDescription:
        "Step into Hawkins, 1983. Find Will, close the gate, and outrun the Demogorgon in our 80s retro sci-fi escape room. Groups of 2–8.",
    },
  });

  // Breaking Bad (industrial)
  await prisma.room.upsert({
    where: { slug: "breaking-bad" },
    update: { heroImageUrl: "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/breakingbad-hero.jpg" },
    create: {
      slug: "breaking-bad",
      name: "Breaking Bad",
      tagline: "I am the danger. I am the one who knocks.",
      story: `Walter White's Albuquerque superlab has been raided by the DEA. Heisenberg has gone dark. One cook's worth of Blue Sky — worth $2 million on the street — is still somewhere in the lab, and the cartel wants it back in 60 minutes or they start making calls.

You've been sent in as the cleanup crew. Find the product, scrub the evidence, and get out before Agent Schrader and his team break down the door. The chemistry doesn't lie. Neither does the clock.`,
      heroImageUrl: "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/breakingbad-hero.jpg",
      galleryImageUrls: JSON.stringify([
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
      seoTitle: "Breaking Bad Escape Room — Cook, Clean, Escape | elharba",
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
