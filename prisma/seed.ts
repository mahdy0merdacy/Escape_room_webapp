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

  // Guides — SEO content hub
  await prisma.guide.upsert({
    where: { slug: "escape-room-tunisie" },
    update: {},
    create: {
      slug: "escape-room-tunisie",
      title: "Escape Room in Tunis, Tunisia — The Complete Guide",
      excerpt:
        "Everything you need to know about booking an escape room in Tunis, Tunisia — themes, pricing, group sizes, and how to pick your first room.",
      pillar: true,
      order: 0,
      heroImageUrl: "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png",
      seoTitle: "Escape Room in Tunis, Tunisia — The Complete Guide | elharba",
      seoDescription:
        "Planning to try an escape room in Tunis, Tunisia? Here's everything you need to know — themes, pricing, group sizes, difficulty levels, and how to book.",
      content: `Looking for the best escape room in Tunis, Tunisia? You're in the right place. An escape room is a live, physical puzzle adventure: your group is locked in a themed space and has 60 minutes to find clues, crack codes, and complete a mission before the clock runs out. It's part game night, part theatre, and part team sport — and it has become one of the most popular things to do in Tunisia for friends, families, couples, and coworkers alike.

## Why Tunisia's Escape Room Scene Is Growing

Escape rooms exploded worldwide over the last decade, and Tunisia caught up fast. Today, an escape room in Tunis is a go-to choice for birthdays, bachelor and bachelorette parties, corporate team-building days, and just a fun Friday night with friends. Unlike a cinema or a restaurant, an escape room forces everyone to actually participate — there's no passive audience, only players.

## What to Expect From an Escape Room

Every escape room, including ours, is built around three things:

- A theme and story — horror, sci-fi, crime, mystery, whatever fits the room
- A set of physical and logic puzzles hidden throughout the space
- A strict time limit, usually 60 minutes, that keeps the tension high

You don't need any special skills or experience. A good game master briefs you before you start, and can nudge you with hints if your group gets stuck. Most first-timers don't escape on their very first try — and that's completely normal and part of the fun.

## Choosing the Right Escape Room in Tunis

Not all escape rooms are the same, so it's worth thinking about:

- Theme — horror rooms lean intense and scary; sci-fi and crime themes are tense but not frightening
- Group size — most escape rooms in Tunisia work best with 2 to 8 players
- Difficulty — some rooms are beginner-friendly, others are built for veteran players
- Location — proximity to Tunis, parking, and opening hours all matter for planning a session

At elharba, we run three themed escape rooms in Tunisia — a horror room, an 80s sci-fi room, and a crime-drama room — so you can pick the intensity level that matches your group.

## How to Book

Booking an escape room in Tunis takes less than two minutes: pick a room, choose your date and time, add your details, and you're set. No payment is required upfront — you pay on the day.

Ready to find out if you can escape? Browse our rooms and book your session today.`,
    },
  });

  await prisma.guide.upsert({
    where: { slug: "top-reasons-to-try-an-escape-room-in-tunisia" },
    update: {},
    create: {
      slug: "top-reasons-to-try-an-escape-room-in-tunisia",
      title: "Top Reasons to Try an Escape Room in Tunisia",
      excerpt:
        "From team building to birthday parties — here are the best reasons to book an escape room in Tunisia this month.",
      order: 1,
      seoTitle: "Top Reasons to Try an Escape Room in Tunisia | elharba",
      seoDescription:
        "Not sure if an escape room is for you? Here are the top reasons thousands of players in Tunisia are hooked on escape rooms.",
      content: `If you've never tried an escape room before, it's easy to wonder what the fuss is about. Here are the biggest reasons players across Tunisia keep coming back for more.

## 1. It's a Real Team Sport

An escape room only works if your group actually works together. Someone spots a clue, someone else connects it to a lock, a third person remembers a detail from ten minutes ago — it's a genuine team effort, and it shows you a side of your friends, family, or colleagues you don't usually see.

## 2. No Two Sessions Feel the Same

Even the same escape room plays differently every time depending on who's in your group. A room that took one team 40 minutes might take another team the full 60 — the puzzles are fixed, but the experience is not.

## 3. It's an Instant Adrenaline Rush

A ticking clock, a locked door, and a story that pulls you in — an escape room delivers real tension in a completely safe environment. For horror-themed rooms in particular, the combination of puzzles and atmosphere creates a rush that a regular game night simply can't match.

## 4. It Works for Almost Any Occasion

- Birthdays — a memorable alternative to dinner and a movie
- Bachelor and bachelorette parties — a fun, active group activity
- Corporate team building — puzzle-solving under pressure mirrors real teamwork
- Date night — a way to bond that isn't just sitting across a table
- Family outings — most rooms welcome mixed age groups

## 5. It's More Accessible Than You Think

You don't need experience, special equipment, or even a full team of 8 — most escape rooms in Tunisia accept groups from 2 players upward, and a game master briefs you and can offer hints if you get stuck.

## Ready to Try One?

Whether you're chasing an adrenaline rush, planning a birthday, or looking for a genuinely different night out, an escape room in Tunisia delivers something a restaurant or cinema can't: a story you actually take part in.`,
    },
  });

  await prisma.guide.upsert({
    where: { slug: "what-is-an-escape-room" },
    update: {},
    create: {
      slug: "what-is-an-escape-room",
      title: "What Is an Escape Room? A Beginner's Guide",
      excerpt:
        "New to escape rooms? Here's exactly what happens inside one, how the puzzles work, and what to expect on your first visit.",
      order: 2,
      seoTitle: "What Is an Escape Room? A Beginner's Guide | elharba",
      seoDescription:
        "Never done an escape room before? This beginner's guide explains exactly what an escape room is, how it works, and what to expect.",
      content: `An escape room is a live, physical puzzle game. A group of players is "locked" inside a themed room and has a fixed amount of time — usually 60 minutes — to find hidden clues, solve puzzles, and complete a final objective before time runs out.

## How It Actually Works

When you arrive, a game master gives you a short briefing: the story, the rules, and how hints work. Once the clock starts, your group searches the room for clues — these might be hidden in furniture, disguised as decorations, or locked inside boxes that need a code to open. Solving one puzzle usually reveals the next, building toward a final challenge that lets you "escape."

## What Kinds of Puzzles Are Inside?

Escape rooms mix several puzzle types to keep things interesting:

- Physical search — finding hidden objects or compartments
- Logic puzzles — codes, ciphers, and sequences
- Lock-and-key mechanics — padlocks, combination locks, electronic locks
- Pattern recognition — matching symbols, colors, or shapes
- Teamwork challenges — puzzles that need two or more people at once

## Do You Need Experience?

No. Escape rooms are designed for complete beginners as much as for veteran players. A good game master calibrates hints to your group's pace, so you're never stuck for too long, and most rooms scale in difficulty so first-timers can still have a great time.

## What Happens If You Don't Escape?

Most groups don't escape on their first attempt — and that's completely normal. At the end of the session, the game master usually reveals the solution to anything you missed and walks you through the story. It's less about winning and more about the experience of playing together under pressure.

## Is It Scary?

That depends entirely on the room's theme. Some escape rooms are pure logic and mystery with no scare elements at all; others, like horror-themed rooms, deliberately use lighting, sound, and even live actors to build tension. Always check a room's theme and age recommendation before booking if you're sensitive to horror elements.

## Your First Escape Room

If this is your first time, pick a room with a moderate difficulty rating, bring a group of 4–6 people, and go in with an open mind. It's less about being "good" at puzzles and more about communicating well as a team — and it's one of the most fun ways to spend an hour with people you like.`,
    },
  });

  await prisma.guide.upsert({
    where: { slug: "escape-room-vs-escape-game" },
    update: {},
    create: {
      slug: "escape-room-vs-escape-game",
      title: "Escape Room vs Escape Game: What's the Difference?",
      excerpt:
        "\"Escape room\" and \"escape game\" are often used interchangeably — but are they really the same thing? Here's the real answer.",
      order: 3,
      seoTitle: "Escape Room vs Escape Game: What's the Difference? | elharba",
      seoDescription:
        "Is an escape room the same as an escape game? We break down the terminology, the history, and what actually matters when you book.",
      content: `If you've searched for things to do in Tunis, you've probably seen both terms — "escape room" and "escape game" — used for what looks like the exact same activity. So what's the actual difference?

## Short Answer: Almost Nothing

In practice, "escape room" and "escape game" describe the same experience: a group of players locked in a themed space, solving puzzles against a countdown clock to complete a mission. The terms are used interchangeably across the industry, and you'll find both used for the same venues in Tunisia and worldwide.

## Where the Terms Come From

"Escape room" emphasizes the physical space — the actual room you're locked inside. "Escape game" emphasizes the activity itself — the game you're playing, regardless of format. Historically, "escape the room" games started as browser-based point-and-click puzzle games in the early 2000s before the concept moved into physical, real-life spaces. The physical version borrowed the name, and both terms stuck.

## Does the Naming Affect Your Experience?

Not really. What actually matters when you're choosing where to play isn't the label — it's:

- The theme — does the story and setting appeal to your group?
- The difficulty — is it built for beginners or experienced players?
- The group size — does it fit how many people you're bringing?
- The reviews — what have other players said about the puzzles and game master?

## What About "Escape Room" vs "Puzzle Room" or "Mystery Room"?

You might also see "puzzle room" or "mystery room" used as alternative names for the same concept. Again, these are largely marketing variations on the same core activity: a themed room, a time limit, and a set of puzzles standing between your group and the door.

## The Bottom Line

Whether a venue calls itself an escape room or an escape game, you're booking the same kind of experience — a live, immersive puzzle adventure with your group against the clock. What matters is picking a well-designed room with a theme, difficulty, and group size that fits what you're looking for.`,
    },
  });

  await prisma.guide.upsert({
    where: { slug: "escape-room-team-building-corporate-events" },
    update: {},
    create: {
      slug: "escape-room-team-building-corporate-events",
      title: "Why Escape Rooms Are the Ultimate Team-Building Activity",
      excerpt:
        "Tired of the same corporate team-building exercises? Here's why an escape room might be the most effective one you'll try.",
      order: 4,
      seoTitle: "Escape Rooms for Team Building & Corporate Events | elharba",
      seoDescription:
        "Looking for a corporate team-building activity that actually works? Here's why escape rooms are becoming the go-to choice for companies in Tunisia.",
      content: `Trust falls and awkward icebreakers rarely build real teamwork. An escape room does — because it forces the exact skills companies actually want to build: communication, delegation, and problem-solving under pressure, all within one intense hour.

## What Makes Escape Rooms Different From Typical Team Building

Most team-building exercises are either too abstract (personality quizzes, trust exercises) or too competitive (games that pit colleagues against each other). An escape room does neither. Everyone in the room is on the same team, working toward the same goal, with a ticking clock that makes cooperation the only path to success.

## The Skills an Escape Room Actually Tests

- Communication — sharing what you find, fast and clearly, under time pressure
- Delegation — instinctively splitting up to cover more ground
- Listening — connecting a colleague's clue to your own without dismissing it
- Composure — staying level-headed as the clock counts down
- Leadership — someone naturally steps up to coordinate, often revealing hidden leadership qualities

Unlike a scripted workshop, none of this is staged — it happens naturally because the puzzles genuinely require it.

## Planning a Corporate Escape Room Session

For a group event, a few things are worth planning ahead:

- Group size — larger teams can be split across multiple rooms and compared afterward
- Difficulty — pick a room that's challenging but not frustrating for a mixed-experience group
- Debrief — a short conversation afterward about what worked (and what didn't) turns the session into a real team-building exercise, not just an outing
- Timing — escape rooms fit neatly into a lunch break, a half-day offsite, or an after-work event

## Beyond the Office

Escape rooms also work well for birthdays, bachelor and bachelorette parties, and family gatherings — but it's the corporate world that has increasingly adopted them precisely because the results are visible immediately. You don't need a survey to tell you a team communicated well; you can see it happen in real time, in a locked room, against the clock.

## Book a Team Session

If you're planning a corporate event or team outing in Tunis, an escape room offers something most team-building activities can't: a genuinely shared, high-stakes challenge that your team either solves together — or doesn't.`,
    },
  });

  await prisma.guide.upsert({
    where: { slug: "is-annabelle-the-scariest-escape-room-in-tunisia" },
    update: {},
    create: {
      slug: "is-annabelle-the-scariest-escape-room-in-tunisia",
      title: "Is Annabelle the Scariest Escape Room in Tunisia?",
      excerpt:
        "Flickering lights, live scares, and a haunted doll — we break down what makes Annabelle one of the most intense escape room experiences in Tunisia.",
      order: 5,
      heroImageUrl: "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/annabelle-hero.webp",
      seoTitle: "Is Annabelle the Scariest Escape Room in Tunisia? | elharba",
      seoDescription:
        "Annabelle is our most intense horror escape room. Here's what makes it so terrifying — and whether you're ready to take it on.",
      content: `Horror-themed escape rooms are a different breed. They don't just test your puzzle-solving — they test your nerve. Annabelle, our flagship horror escape room, was built to do exactly that.

## What Makes a Horror Escape Room Different

A standard escape room challenges your brain. A horror escape room challenges your brain and your nerves at the same time. Flickering lights, unsettling sound design, moving props, and tight, dark spaces all raise your heart rate before you've even found the first clue — which makes every puzzle harder to solve calmly.

## Inside Annabelle

Annabelle is themed around one of horror's most infamous stories: a haunted doll history says should never be disturbed. Your group has 60 minutes to survive the room, using logic and nerve in equal measure. The atmosphere is deliberately intense — this is not a room for players looking for a gentle, family-friendly puzzle session.

## Who Should (and Shouldn't) Play

Annabelle is genuinely intense, so it's worth knowing what you're signing up for:

- Recommended minimum age: 16, due to the intensity of the scares
- Not recommended for anyone with severe anxiety, heart conditions, or a strong fear of the dark
- Best for groups who specifically want a scare, not just a puzzle challenge
- Children under 16 must be accompanied by a parent or guardian

## How It Compares to Our Other Rooms

Alongside Annabelle, elharba runs an 80s sci-fi escape room and a crime-drama escape room — both tense and immersive, but without the horror-specific scare elements. If your group is split between horror fans and people who'd rather skip the jump scares, our sci-fi and crime rooms are a great middle ground.

## Ready to Face It?

If you're looking for the most intense escape room experience in Tunisia, Annabelle is built for exactly that. Bring a steady group, expect to be scared, and remember: no one has to face it alone — you've got 60 minutes and your team.`,
    },
  });

  console.log("Seeded 6 guides.");
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
