/**
 * Creates the Guide table (if missing) and seeds/updates the initial
 * SEO guides content ("escape room" keyword hub) directly against Turso.
 * Safe to run multiple times — upserts by slug.
 *
 * Usage:
 *   node scripts/add-guides.mjs
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

function loadEnvFile(path) {
  try {
    const lines = readFileSync(path, "utf8").split("\n");
    for (const raw of lines) {
      const line = raw.startsWith("# ") ? raw.slice(2) : raw;
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
  process.exit(1);
}

console.log("Connecting to:", url);
const db = createClient({ url, authToken });

async function tableExists(table) {
  const { rows } = await db.execute({
    sql: `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
    args: [table],
  });
  return rows.length > 0;
}

async function columnExists(table, column) {
  const { rows } = await db.execute(`PRAGMA table_info("${table}")`);
  return rows.some((r) => r.name === column);
}

// 1. Create the Guide table if it doesn't exist yet
if (!(await tableExists("Guide"))) {
  await db.execute(`
    CREATE TABLE "Guide" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "slug" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "excerpt" TEXT NOT NULL DEFAULT '',
      "content" TEXT NOT NULL DEFAULT '',
      "titleFr" TEXT NOT NULL DEFAULT '',
      "excerptFr" TEXT NOT NULL DEFAULT '',
      "contentFr" TEXT NOT NULL DEFAULT '',
      "titleAr" TEXT NOT NULL DEFAULT '',
      "excerptAr" TEXT NOT NULL DEFAULT '',
      "contentAr" TEXT NOT NULL DEFAULT '',
      "heroImageUrl" TEXT NOT NULL DEFAULT '',
      "pillar" BOOLEAN NOT NULL DEFAULT false,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "order" INTEGER NOT NULL DEFAULT 0,
      "seoTitle" TEXT NOT NULL DEFAULT '',
      "seoDescription" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);
  await db.execute(`CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug")`);
  console.log("  ✓ Guide table created");
} else {
  console.log("  - Guide table already exists");
  // 1b. Add translation columns if this table predates them
  for (const col of ["titleFr", "excerptFr", "contentFr", "titleAr", "excerptAr", "contentAr"]) {
    if (!(await columnExists("Guide", col))) {
      await db.execute(`ALTER TABLE "Guide" ADD COLUMN "${col}" TEXT NOT NULL DEFAULT ''`);
      console.log(`  ✓ Guide.${col} column added`);
    }
  }
}

const LOGO_URL = "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png";
const ANNABELLE_URL = "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/annabelle-hero.webp";

const guides = [
  {
    slug: "escape-room-tunisie",
    title: "Escape Room in Tunis, Tunisia — The Complete Guide",
    excerpt:
      "Everything you need to know about booking an escape room in Tunis, Tunisia — themes, pricing, group sizes, and how to pick your first room.",
    pillar: true,
    order: 0,
    heroImageUrl: LOGO_URL,
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
    titleFr: "Escape Room à Tunis, Tunisie — Le Guide Complet",
    excerptFr:
      "Tout ce qu'il faut savoir pour réserver une escape room à Tunis, Tunisie — thèmes, tarifs, taille des groupes, et comment choisir sa première salle.",
    contentFr: `Vous cherchez la meilleure escape room à Tunis, en Tunisie ? Vous êtes au bon endroit. Une escape room est une aventure de puzzle physique et immersive : votre groupe est enfermé dans un espace à thème et dispose de 60 minutes pour trouver des indices, déchiffrer des codes et accomplir une mission avant la fin du compte à rebours. C'est à la fois une soirée jeu, un moment de théâtre et un sport d'équipe — et c'est devenu l'une des activités les plus populaires en Tunisie, que ce soit entre amis, en famille, en couple ou entre collègues.

## Pourquoi la scène des escape rooms explose en Tunisie

Les escape rooms ont connu un essor mondial ces dix dernières années, et la Tunisie n'est pas en reste. Aujourd'hui, une escape room à Tunis est un choix évident pour un anniversaire, un enterrement de vie de garçon ou de jeune fille, une journée de team building en entreprise, ou tout simplement une soirée entre amis. Contrairement au cinéma ou au restaurant, une escape room oblige tout le monde à réellement participer — il n'y a pas de spectateurs passifs, seulement des joueurs.

## À quoi s'attendre dans une escape room

Chaque escape room, y compris les nôtres, repose sur trois éléments :

- Un thème et une histoire — horreur, science-fiction, crime, mystère, selon la salle
- Une série de puzzles physiques et logiques cachés dans l'espace
- Une limite de temps stricte, généralement 60 minutes, qui maintient la tension

Aucune compétence particulière n'est nécessaire. Un bon maître du jeu vous briefe avant de commencer, et peut vous donner des indices si votre groupe est bloqué. La plupart des débutants ne s'échappent pas dès leur premier essai — et c'est tout à fait normal, ça fait partie du plaisir.

## Comment choisir la bonne escape room à Tunis

Toutes les escape rooms ne se valent pas, voici les critères à considérer :

- Le thème — les salles d'horreur sont intenses et effrayantes ; les thèmes science-fiction et crime sont tendus mais pas terrifiants
- La taille du groupe — la plupart des escape rooms en Tunisie fonctionnent mieux avec 2 à 8 joueurs
- La difficulté — certaines salles sont adaptées aux débutants, d'autres pensées pour les joueurs expérimentés
- L'emplacement — la proximité de Tunis, le parking et les horaires d'ouverture comptent pour organiser une session

Chez elharba, nous proposons trois escape rooms à thème en Tunisie — une salle horreur, une salle science-fiction rétro années 80, et une salle crime — pour que vous puissiez choisir le niveau d'intensité adapté à votre groupe.

## Comment réserver

Réserver une escape room à Tunis prend moins de deux minutes : choisissez une salle, sélectionnez votre date et votre créneau, ajoutez vos coordonnées, et c'est fait. Aucun paiement n'est requis à l'avance — vous payez sur place.

Prêt à savoir si vous pouvez vous échapper ? Parcourez nos salles et réservez votre session dès aujourd'hui.`,
    titleAr: "غرفة الهروب في تونس — الدليل الشامل",
    excerptAr:
      "كل ما تحتاج معرفته لحجز غرفة هروب (Escape Room) في تونس — الأنواع، الأسعار، حجم المجموعات، وكيفية اختيار غرفتك الأولى.",
    contentAr: `هل تبحث عن أفضل غرفة هروب في تونس؟ أنت في المكان الصحيح. غرفة الهروب هي مغامرة ألغاز حقيقية وتفاعلية: يُحبس فريقك داخل غرفة ذات طابع خاص، ولديكم 60 دقيقة لإيجاد الأدلة وفك الرموز وإنجاز المهمة قبل نفاد الوقت. إنها مزيج بين ليلة ألعاب ومسرحية وتحدٍّ جماعي — وأصبحت من أكثر الأنشطة رواجًا في تونس بين الأصدقاء والعائلات والأزواج وزملاء العمل.

## لماذا يزدهر قطاع غرف الهروب في تونس

انتشرت غرف الهروب عالميًا خلال العقد الأخير، ولحقت بها تونس بسرعة. اليوم، أصبحت غرفة الهروب في تونس خيارًا مفضلًا لأعياد الميلاد، وحفلات العزوبية، وأيام بناء الفريق في الشركات، أو ببساطة أمسية ممتعة مع الأصدقاء. وعلى عكس السينما أو المطعم، تجبر غرفة الهروب الجميع على المشاركة الفعلية — لا يوجد جمهور سلبي، بل لاعبون فقط.

## ما الذي يمكن توقعه داخل غرفة الهروب

تُبنى كل غرفة هروب، بما فيها غرفنا، على ثلاثة عناصر:

- قصة وطابع مميز — رعب، خيال علمي، جريمة، غموض، حسب الغرفة
- مجموعة من الألغاز المادية والمنطقية المخفية في المكان
- حد زمني صارم، عادة 60 دقيقة، يحافظ على التوتر

لست بحاجة لأي مهارة خاصة. يقدم لكم مدير اللعبة إحاطة قبل البدء، ويمكنه مساعدتكم بتلميحات إذا واجه فريقكم صعوبة. معظم اللاعبين الجدد لا ينجحون في الهروب من المحاولة الأولى — وهذا أمر طبيعي تمامًا وجزء من المتعة.

## كيف تختار غرفة الهروب المناسبة في تونس

ليست كل غرف الهروب متشابهة، لذا يستحق الأمر التفكير في:

- الطابع — غرف الرعب مكثفة ومخيفة؛ طابعا الخيال العلمي والجريمة متوتران لكن غير مرعبين
- حجم المجموعة — تعمل معظم غرف الهروب في تونس بشكل أفضل مع 2 إلى 8 لاعبين
- مستوى الصعوبة — بعض الغرف مناسبة للمبتدئين، وأخرى مصممة للاعبين المحترفين
- الموقع — القرب من تونس العاصمة، وتوفر مواقف السيارات، وساعات العمل كلها عوامل مهمة عند التخطيط لجلسة

في إلحربة (elharba)، نُدير ثلاث غرف هروب بطوابع مختلفة في تونس — غرفة رعب، وغرفة خيال علمي بطابع الثمانينات، وغرفة جريمة — لتختاروا مستوى الإثارة الذي يناسب مجموعتكم.

## كيفية الحجز

حجز غرفة هروب في تونس يستغرق أقل من دقيقتين: اختر غرفة، حدد التاريخ والوقت، أدخل بياناتك، وانتهى الأمر. لا حاجة لأي دفع مسبق — تدفع في يوم اللعب.

مستعد لتكتشف هل يمكنك الهروب؟ تصفح غرفنا واحجز جلستك اليوم.`,
  },
  {
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
    titleFr: "Les Meilleures Raisons d'Essayer une Escape Room en Tunisie",
    excerptFr:
      "Du team building aux anniversaires — voici les meilleures raisons de réserver une escape room en Tunisie ce mois-ci.",
    contentFr: `Si vous n'avez jamais essayé une escape room, il est facile de se demander ce qui fait tout ce bruit. Voici les principales raisons pour lesquelles les joueurs en Tunisie reviennent sans cesse.

## 1. C'est un véritable sport d'équipe

Une escape room ne fonctionne que si votre groupe travaille réellement ensemble. Quelqu'un repère un indice, quelqu'un d'autre le relie à un cadenas, une troisième personne se souvient d'un détail vu dix minutes plus tôt — c'est un véritable effort collectif, et ça révèle un côté de vos amis, de votre famille ou de vos collègues que vous ne voyez pas d'habitude.

## 2. Aucune session ne se ressemble

Même la même escape room se joue différemment à chaque fois selon qui compose votre groupe. Une salle qu'une équipe termine en 40 minutes peut en prendre 60 à une autre — les puzzles sont fixes, mais l'expérience ne l'est jamais.

## 3. Une montée d'adrénaline instantanée

Un chrono qui tourne, une porte verrouillée, une histoire qui vous happe — une escape room procure une véritable tension dans un environnement totalement sûr. Pour les salles à thème horreur en particulier, le mélange de puzzles et d'ambiance crée une décharge d'adrénaline qu'une simple soirée jeu ne peut pas égaler.

## 4. Adapté à presque toutes les occasions

- Anniversaires — une alternative mémorable au dîner-cinéma classique
- Enterrements de vie de garçon ou de jeune fille — une activité de groupe fun et active
- Team building en entreprise — résoudre des puzzles sous pression reflète le vrai travail d'équipe
- Soirée en couple — une façon de se rapprocher autrement qu'assis face à face
- Sorties en famille — la plupart des salles accueillent des groupes d'âges mixtes

## 5. Plus accessible qu'on ne le pense

Pas besoin d'expérience, d'équipement particulier, ni même d'une équipe complète de 8 personnes — la plupart des escape rooms en Tunisie acceptent des groupes à partir de 2 joueurs, et un maître du jeu vous briefe et peut vous donner des indices en cas de blocage.

## Prêt à tenter l'expérience ?

Que vous cherchiez une montée d'adrénaline, organisiez un anniversaire, ou cherchiez simplement une sortie vraiment différente, une escape room en Tunisie offre quelque chose qu'un restaurant ou un cinéma ne peut pas offrir : une histoire à laquelle vous participez réellement.`,
    titleAr: "أهم أسباب تجربة غرفة هروب في تونس",
    excerptAr:
      "من بناء الفريق إلى حفلات أعياد الميلاد — إليك أفضل الأسباب لحجز غرفة هروب في تونس هذا الشهر.",
    contentAr: `إذا لم تجرّب غرفة هروب من قبل، فمن الطبيعي أن تتساءل عن سبب كل هذا الحماس حولها. إليك أهم الأسباب التي تجعل اللاعبين في تونس يعودون مرارًا وتكرارًا.

## 1. إنها رياضة جماعية حقيقية

لا تنجح غرفة الهروب إلا إذا عمل فريقك معًا فعليًا. شخص يلاحظ دليلًا، وآخر يربطه بقفل، وثالث يتذكر تفصيلًا من عشر دقائق مضت — إنه مجهود جماعي حقيقي، ويكشف لك جانبًا من أصدقائك أو عائلتك أو زملائك لا تراه عادة.

## 2. لا توجد جلسة تشبه الأخرى

حتى نفس غرفة الهروب تُلعب بشكل مختلف في كل مرة حسب أعضاء فريقك. غرفة أنهاها فريق في 40 دقيقة قد تستغرق فريقًا آخر الستين دقيقة كاملة — الألغاز ثابتة، لكن التجربة أبدًا لا تتكرر.

## 3. جرعة أدرينالين فورية

عقارب ساعة تدق، باب مغلق، وقصة تشدّك — تمنحك غرفة الهروب توترًا حقيقيًا في بيئة آمنة تمامًا. وبالنسبة لغرف الرعب تحديدًا، يخلق مزيج الألغاز والأجواء إحساسًا لا يمكن لأي أمسية ألعاب عادية أن توازيه.

## 4. تناسب تقريبًا أي مناسبة

- أعياد الميلاد — بديل لا يُنسى عن العشاء والسينما
- حفلات العزوبية — نشاط جماعي ممتع وحيوي
- بناء فريق العمل — حل الألغاز تحت الضغط يعكس العمل الجماعي الحقيقي
- سهرة رومانسية — طريقة للتقارب غير الجلوس وجهًا لوجه فقط
- خرجات عائلية — تستقبل معظم الغرف مجموعات من أعمار مختلفة

## 5. أسهل منالًا مما تتخيل

لست بحاجة لخبرة، ولا معدات خاصة، ولا حتى فريق كامل من 8 أشخاص — تقبل معظم غرف الهروب في تونس مجموعات تبدأ من لاعبين اثنين، ويقدم لك مدير اللعبة إحاطة ويمكنه مساعدتك بتلميحات عند الحاجة.

## مستعد للتجربة؟

سواء كنت تبحث عن جرعة أدرينالين، تخطط لعيد ميلاد، أو تبحث ببساطة عن خرجة مختلفة حقًا، تمنحك غرفة الهروب في تونس ما لا يمكن لمطعم أو سينما تقديمه: قصة تشارك فيها فعليًا.`,
  },
  {
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
    titleFr: "Qu'est-ce qu'une Escape Room ? Le Guide du Débutant",
    excerptFr:
      "Nouveau dans les escape rooms ? Voici exactement ce qui se passe à l'intérieur, comment fonctionnent les puzzles, et à quoi s'attendre lors de votre première visite.",
    contentFr: `Une escape room est un jeu de puzzle physique et immersif. Un groupe de joueurs est « enfermé » dans une salle à thème et dispose d'un temps limité — généralement 60 minutes — pour trouver des indices cachés, résoudre des puzzles et accomplir un objectif final avant la fin du temps imparti.

## Comment ça fonctionne réellement

À votre arrivée, un maître du jeu vous fait un bref briefing : l'histoire, les règles, et comment fonctionnent les indices. Une fois le chrono lancé, votre groupe fouille la salle à la recherche d'indices — ils peuvent être cachés dans un meuble, déguisés en décoration, ou enfermés dans une boîte qui nécessite un code pour s'ouvrir. Résoudre un puzzle en révèle généralement un autre, jusqu'au défi final qui vous permet de « vous échapper ».

## Quels types de puzzles y trouve-t-on ?

Les escape rooms combinent plusieurs types de puzzles pour rester intéressantes :

- Recherche physique — trouver des objets ou compartiments cachés
- Puzzles logiques — codes, chiffrements et séquences
- Mécanismes de verrouillage — cadenas, combinaisons, serrures électroniques
- Reconnaissance de motifs — associer des symboles, des couleurs ou des formes
- Défis d'équipe — des puzzles qui nécessitent deux personnes ou plus en même temps

## Faut-il de l'expérience ?

Non. Les escape rooms sont conçues aussi bien pour les débutants complets que pour les joueurs expérimentés. Un bon maître du jeu adapte les indices au rythme de votre groupe, pour que vous ne soyez jamais bloqué trop longtemps, et la plupart des salles ajustent leur difficulté pour que même les débutants passent un excellent moment.

## Que se passe-t-il si vous ne vous échappez pas ?

La plupart des groupes ne s'échappent pas à leur première tentative — et c'est tout à fait normal. À la fin de la session, le maître du jeu révèle généralement la solution de ce que vous avez manqué et vous explique l'histoire. L'important n'est pas tant de gagner que de vivre l'expérience de jouer ensemble sous pression.

## Est-ce effrayant ?

Cela dépend entièrement du thème de la salle. Certaines escape rooms sont purement logiques et mystérieuses, sans aucun élément effrayant ; d'autres, comme les salles à thème horreur, utilisent volontairement l'éclairage, le son, et parfois même des acteurs pour créer de la tension. Vérifiez toujours le thème et l'âge recommandé avant de réserver si vous êtes sensible aux éléments d'horreur.

## Votre première escape room

Si c'est votre première fois, choisissez une salle de difficulté modérée, venez avec un groupe de 4 à 6 personnes, et gardez l'esprit ouvert. L'important n'est pas d'être « doué » pour les puzzles, mais de bien communiquer en équipe — et c'est l'une des façons les plus amusantes de passer une heure avec des gens que vous aimez.`,
    titleAr: "ما هي غرفة الهروب؟ دليل المبتدئين",
    excerptAr:
      "جديد على غرف الهروب؟ إليك بالضبط ما يحدث بداخلها، وكيف تعمل الألغاز، وما الذي يجب توقعه في زيارتك الأولى.",
    contentAr: `غرفة الهروب هي لعبة ألغاز حقيقية وتفاعلية. يُحبس فيها مجموعة من اللاعبين داخل غرفة ذات طابع معيّن، ولديهم وقت محدد — عادة 60 دقيقة — لإيجاد أدلة مخفية، وحل الألغاز، وإنجاز هدف نهائي قبل نفاد الوقت.

## كيف تعمل فعليًا

عند وصولك، يقدم لك مدير اللعبة إحاطة قصيرة: القصة، القواعد، وكيفية عمل التلميحات. بمجرد انطلاق العد التنازلي، يبحث فريقك في الغرفة عن الأدلة — قد تكون مخفية في قطعة أثاث، متخفية كديكور، أو مقفلة داخل صندوق يحتاج رمزًا لفتحه. حل لغز واحد يكشف عادة عن التالي، وصولًا إلى التحدي الأخير الذي يتيح لكم «الهروب».

## ما أنواع الألغاز الموجودة؟

تمزج غرف الهروب بين عدة أنواع من الألغاز لتبقى ممتعة:

- البحث المادي — إيجاد أغراض أو حجرات مخفية
- الألغاز المنطقية — رموز وتشفيرات وتسلسلات
- آليات الأقفال — أقفال عادية، تركيبات رقمية، أقفال إلكترونية
- التعرف على الأنماط — مطابقة الرموز أو الألوان أو الأشكال
- تحديات جماعية — ألغاز تتطلب شخصين أو أكثر في نفس الوقت

## هل تحتاج إلى خبرة؟

لا. صُممت غرف الهروب لتناسب المبتدئين تمامًا كما تناسب اللاعبين المحترفين. يُكيّف مدير اللعبة الجيد التلميحات حسب وتيرة فريقك، حتى لا تبقوا عالقين طويلًا، وتتدرج معظم الغرف في الصعوبة ليستمتع المبتدئون أيضًا بتجربة رائعة.

## ماذا يحدث إذا لم تنجحوا في الهروب؟

معظم المجموعات لا تنجح في الهروب من المحاولة الأولى — وهذا أمر طبيعي تمامًا. في نهاية الجلسة، يكشف مدير اللعبة عادة عن الحل لما فاتكم ويشرح لكم تفاصيل القصة. الأمر لا يتعلق بالفوز بقدر ما يتعلق بتجربة اللعب الجماعي تحت الضغط.

## هل هي مخيفة؟

يعتمد ذلك كليًا على طابع الغرفة. بعض غرف الهروب منطقية وغامضة بحتة دون أي عنصر مرعب؛ بينما تستخدم غرف أخرى، كغرف الرعب، الإضاءة والصوت وحتى الممثلين الحقيقيين عمدًا لخلق التوتر. تحقق دائمًا من طابع الغرفة والعمر الموصى به قبل الحجز إذا كنت حساسًا تجاه عناصر الرعب.

## غرفة الهروب الأولى لك

إذا كانت هذه تجربتك الأولى، اختر غرفة بمستوى صعوبة متوسط، تعال بمجموعة من 4 إلى 6 أشخاص، وكن منفتح الذهن. الأمر لا يتعلق بأن تكون «بارعًا» في الألغاز بقدر ما يتعلق بالتواصل الجيد كفريق — وهي إحدى أمتع الطرق لقضاء ساعة مع أشخاص تحبهم.`,
  },
  {
    slug: "escape-room-vs-escape-game",
    title: "Escape Room vs Escape Game: What's the Difference?",
    excerpt:
      '"Escape room" and "escape game" are often used interchangeably — but are they really the same thing? Here\'s the real answer.',
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
    titleFr: "Escape Room vs Escape Game : Quelle Différence ?",
    excerptFr:
      "« Escape room » et « escape game » sont souvent utilisés indifféremment — mais s'agit-il vraiment de la même chose ? Voici la vraie réponse.",
    contentFr: `Si vous avez cherché des activités à faire à Tunis, vous avez probablement vu les deux termes — « escape room » et « escape game » — utilisés pour ce qui semble être exactement la même activité. Alors, quelle est la vraie différence ?

## Réponse courte : quasiment aucune

En pratique, « escape room » et « escape game » décrivent la même expérience : un groupe de joueurs enfermés dans un espace à thème, résolvant des puzzles contre un compte à rebours pour accomplir une mission. Les deux termes sont utilisés indifféremment dans le secteur, et vous les retrouverez tous les deux pour désigner les mêmes établissements en Tunisie comme ailleurs dans le monde.

## D'où viennent ces termes

« Escape room » met l'accent sur l'espace physique — la salle elle-même dans laquelle vous êtes enfermé. « Escape game » met l'accent sur l'activité elle-même — le jeu auquel vous jouez, quel que soit le format. Historiquement, les jeux « escape the room » sont apparus comme des jeux de puzzle en ligne, en pointer-cliquer, au début des années 2000, avant que le concept ne se transpose dans des espaces physiques réels. La version physique a repris le nom, et les deux termes sont restés.

## Le nom change-t-il votre expérience ?

Pas vraiment. Ce qui compte réellement lorsque vous choisissez où jouer, ce n'est pas l'étiquette — c'est :

- Le thème — l'histoire et l'univers plaisent-ils à votre groupe ?
- La difficulté — est-ce pensé pour les débutants ou les joueurs expérimentés ?
- La taille du groupe — correspond-elle au nombre de personnes que vous amenez ?
- Les avis — qu'ont dit les autres joueurs sur les puzzles et le maître du jeu ?

## Et « escape room » face à « puzzle room » ou « mystery room » ?

Vous pourrez aussi croiser « puzzle room » ou « mystery room » comme autres noms pour le même concept. Là encore, ce sont surtout des variations marketing autour de la même activité de base : une salle à thème, une limite de temps, et une série de puzzles entre votre groupe et la sortie.

## En résumé

Qu'un établissement se présente comme une escape room ou un escape game, vous réservez le même type d'expérience — une aventure de puzzle immersive et en direct, votre groupe contre le chrono. Ce qui compte, c'est de choisir une salle bien conçue, avec un thème, une difficulté et une taille de groupe adaptés à ce que vous recherchez.`,
    titleAr: "غرفة الهروب مقابل لعبة الهروب: ما الفرق؟",
    excerptAr:
      "غالبًا ما يُستخدم مصطلحا «غرفة الهروب» و«لعبة الهروب» بالتبادل — لكن هل هما نفس الشيء حقًا؟ إليك الإجابة الحقيقية.",
    contentAr: `إذا بحثت عن أنشطة للقيام بها في تونس، فمن المحتمل أنك رأيت المصطلحين — «غرفة الهروب» و«لعبة الهروب» — يُستخدمان لما يبدو أنه نفس النشاط تمامًا. فما هو الفرق الحقيقي إذن؟

## الجواب المختصر: لا فرق يُذكر

عمليًا، يصف كلا المصطلحين نفس التجربة: مجموعة من اللاعبين محبوسين في مكان ذي طابع خاص، يحلّون الألغاز في سباق مع الوقت لإنجاز مهمة. يُستخدم المصطلحان بالتبادل في هذا المجال، وستجدهما يُستعملان لوصف نفس الأماكن في تونس وحول العالم.

## من أين جاء المصطلحان

يُركّز مصطلح «غرفة الهروب» على المكان المادي — الغرفة نفسها التي أنت محبوس فيها. أما «لعبة الهروب» فيُركّز على النشاط نفسه — اللعبة التي تلعبها، بغض النظر عن الشكل. تاريخيًا، ظهرت ألعاب «الهروب من الغرفة» كألعاب ألغاز إلكترونية بنمط النقر والتفاعل في بداية الألفينيات، قبل أن ينتقل المفهوم إلى أماكن حقيقية وملموسة. استعارت النسخة المادية الاسم، وبقي المصطلحان معًا.

## هل يؤثر الاسم على تجربتك؟

ليس فعليًا. ما يهم حقًا عند اختيار مكان اللعب ليس التسمية، بل:

- الطابع — هل تعجب القصة والأجواء مجموعتك؟
- الصعوبة — هل صُممت للمبتدئين أم للاعبين المحترفين؟
- حجم المجموعة — هل تناسب عدد الأشخاص الذين ستحضرهم؟
- التقييمات — ماذا قال لاعبون آخرون عن الألغاز ومدير اللعبة؟

## ماذا عن «غرفة الألغاز» أو «غرفة الغموض»؟

قد تصادف أيضًا مصطلحي «غرفة الألغاز» أو «غرفة الغموض» كأسماء بديلة لنفس المفهوم. مرة أخرى، هذه في معظمها اختلافات تسويقية حول نفس النشاط الأساسي: غرفة ذات طابع خاص، ووقت محدود، ومجموعة من الألغاز تفصل بين فريقك والباب.

## الخلاصة

سواء وصف مكان ما نفسه بغرفة هروب أو لعبة هروب، فأنت تحجز نفس نوع التجربة — مغامرة ألغاز حية وتفاعلية، فريقك في سباق مع الوقت. ما يهم فعلًا هو اختيار غرفة مصممة جيدًا، بطابع وصعوبة وحجم مجموعة يناسب ما تبحث عنه.`,
  },
  {
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
    titleFr: "Pourquoi l'Escape Room est l'Activité de Team Building Ultime",
    excerptFr:
      "Fatigué des mêmes exercices de team building ? Voici pourquoi une escape room pourrait être le plus efficace que vous ayez jamais essayé.",
    contentFr: `Les chutes de confiance et les brise-glaces maladroits construisent rarement un vrai esprit d'équipe. Une escape room, si — car elle impose exactement les compétences que les entreprises veulent développer : communication, délégation et résolution de problèmes sous pression, le tout en une heure intense.

## Ce qui différencie l'escape room du team building classique

La plupart des exercices de team building sont soit trop abstraits (tests de personnalité, exercices de confiance), soit trop compétitifs (des jeux qui opposent les collègues entre eux). Une escape room ne fait ni l'un ni l'autre. Tout le monde dans la salle est dans la même équipe, poursuit le même objectif, avec un chrono qui fait de la coopération le seul chemin vers la réussite.

## Les compétences qu'une escape room teste réellement

- Communication — partager ce que l'on trouve, vite et clairement, sous pression
- Délégation — se répartir instinctivement pour couvrir plus de terrain
- Écoute — relier l'indice d'un collègue au sien sans le rejeter
- Sang-froid — rester lucide alors que le chrono défile
- Leadership — quelqu'un prend naturellement les commandes, révélant parfois des qualités de leader insoupçonnées

Contrairement à un atelier scénarisé, rien de tout cela n'est mis en scène — cela arrive naturellement parce que les puzzles l'exigent réellement.

## Organiser une session escape room en entreprise

Pour un événement de groupe, quelques points sont à anticiper :

- Taille du groupe — les grandes équipes peuvent être réparties dans plusieurs salles et comparées ensuite
- Difficulté — choisissez une salle stimulante mais pas frustrante pour un groupe au niveau hétérogène
- Débriefing — une courte discussion après coup sur ce qui a fonctionné (ou non) transforme la session en véritable exercice de team building, pas en simple sortie
- Timing — une escape room s'intègre facilement dans une pause déjeuner, une demi-journée off-site, ou un événement après le travail

## Au-delà du bureau

Les escape rooms fonctionnent aussi très bien pour les anniversaires, les enterrements de vie de garçon ou de jeune fille, et les réunions de famille — mais c'est le monde de l'entreprise qui les a de plus en plus adoptées, précisément parce que les résultats sont visibles immédiatement. Pas besoin d'un sondage pour savoir si une équipe a bien communiqué ; on peut le voir en temps réel, dans une salle verrouillée, contre le chrono.

## Réservez une session d'équipe

Si vous organisez un événement d'entreprise ou une sortie d'équipe à Tunis, une escape room offre quelque chose que la plupart des activités de team building ne peuvent pas offrir : un défi véritablement partagé et à enjeu élevé, que votre équipe résout ensemble — ou pas.`,
    titleAr: "لماذا تُعد غرفة الهروب النشاط الأمثل لبناء الفريق",
    excerptAr:
      "سئمت من أنشطة بناء الفريق التقليدية؟ إليك لماذا قد تكون غرفة الهروب الأكثر فعالية من بينها جميعًا.",
    contentAr: `نادرًا ما تبني تمارين الثقة والأنشطة التمهيدية المحرجة عملَ فريق حقيقي. أما غرفة الهروب فتفعل ذلك — لأنها تفرض بالضبط المهارات التي تريد الشركات تطويرها: التواصل، وتوزيع المهام، وحل المشكلات تحت الضغط، كل ذلك في ساعة واحدة مكثفة.

## ما الذي يميز غرفة الهروب عن أنشطة بناء الفريق التقليدية

معظم أنشطة بناء الفريق إما مجردة جدًا (اختبارات الشخصية، تمارين الثقة) أو تنافسية جدًا (ألعاب تضع الزملاء في مواجهة بعضهم). لا تفعل غرفة الهروب أيًا من ذلك. الجميع في الغرفة في نفس الفريق، يسعون لنفس الهدف، وساعة تدق تجعل التعاون الطريق الوحيد للنجاح.

## المهارات التي تختبرها غرفة الهروب فعليًا

- التواصل — مشاركة ما تجده، بسرعة ووضوح، تحت ضغط الوقت
- توزيع المهام — الانقسام بشكل غريزي لتغطية مساحة أكبر
- الإصغاء — ربط دليل زميل بدليلك دون تجاهله
- رباطة الجأش — البقاء هادئًا بينما يتقدم العد التنازلي
- القيادة — يتقدم أحدهم بشكل طبيعي لتنسيق الفريق، مما يكشف أحيانًا صفات قيادية خفية

على عكس ورشة عمل مُعدّة مسبقًا، لا شيء من هذا مُصطنع — يحدث بشكل طبيعي لأن الألغاز تتطلبه فعليًا.

## التخطيط لجلسة غرفة هروب للشركات

بالنسبة لفعالية جماعية، يستحق التخطيط المسبق لبعض النقاط:

- حجم المجموعة — يمكن تقسيم الفرق الكبيرة على عدة غرف ومقارنة النتائج لاحقًا
- الصعوبة — اختر غرفة مليئة بالتحدي لكن غير محبطة لمجموعة متفاوتة الخبرة
- التلخيص — نقاش قصير بعد الجلسة حول ما نجح (وما لم ينجح) يحوّل الجلسة إلى تمرين حقيقي لبناء الفريق، لا مجرد خرجة
- التوقيت — تتناسب غرفة الهروب بسهولة مع استراحة الغداء، أو نصف يوم خارج المكتب، أو فعالية بعد العمل

## أبعد من المكتب

تنجح غرف الهروب أيضًا في أعياد الميلاد وحفلات العزوبية ولقاءات العائلة — لكن عالم الشركات هو من تبنّاها بشكل متزايد، تحديدًا لأن نتائجها مرئية فورًا. لست بحاجة لاستبيان لتعرف أن فريقًا تواصل جيدًا؛ يمكنك رؤية ذلك في الوقت الحقيقي، داخل غرفة مقفلة، في سباق مع الساعة.

## احجز جلسة لفريقك

إذا كنت تخطط لفعالية شركة أو خرجة فريق في تونس، تمنحك غرفة الهروب ما لا تقدمه معظم أنشطة بناء الفريق: تحديًا مشتركًا وحقيقيًا وعالي الرهان، إما أن يحلّه فريقك معًا — أو لا.`,
  },
  {
    slug: "is-annabelle-the-scariest-escape-room-in-tunisia",
    title: "Is Annabelle the Scariest Escape Room in Tunisia?",
    excerpt:
      "Flickering lights, live scares, and a haunted doll — we break down what makes Annabelle one of the most intense escape room experiences in Tunisia.",
    order: 5,
    heroImageUrl: ANNABELLE_URL,
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

- Recommended minimum age: 13, due to the intensity of the scares
- Not recommended for anyone with severe anxiety, heart conditions, or a strong fear of the dark
- Best for groups who specifically want a scare, not just a puzzle challenge
- Children under 13 must be accompanied by a parent or guardian

## How It Compares to Our Other Rooms

Alongside Annabelle, elharba runs an 80s sci-fi escape room and a crime-drama escape room — both tense and immersive, but without the horror-specific scare elements. If your group is split between horror fans and people who'd rather skip the jump scares, our sci-fi and crime rooms are a great middle ground.

## Ready to Face It?

If you're looking for the most intense escape room experience in Tunisia, Annabelle is built for exactly that. Bring a steady group, expect to be scared, and remember: no one has to face it alone — you've got 60 minutes and your team.`,
    titleFr: "Annabelle Est-Elle l'Escape Room la Plus Effrayante de Tunisie ?",
    excerptFr:
      "Lumières vacillantes, frayeurs en direct et une poupée hantée — on décortique ce qui rend Annabelle l'une des expériences d'escape room les plus intenses de Tunisie.",
    contentFr: `Les escape rooms à thème horreur sont d'une autre nature. Elles ne testent pas seulement votre capacité à résoudre des puzzles — elles testent vos nerfs. Annabelle, notre escape room horreur emblématique, a été conçue précisément pour ça.

## Ce qui différencie une escape room horreur

Une escape room classique met votre cerveau à l'épreuve. Une escape room horreur met votre cerveau ET vos nerfs à l'épreuve en même temps. Lumières vacillantes, ambiance sonore oppressante, accessoires qui bougent, espaces sombres et exigus — tout cela fait grimper votre rythme cardiaque avant même d'avoir trouvé le premier indice, ce qui rend chaque puzzle plus difficile à résoudre calmement.

## À l'intérieur d'Annabelle

Annabelle s'inspire d'une des histoires d'horreur les plus tristement célèbres : une poupée hantée que l'histoire dit qu'il ne faut jamais déranger. Votre groupe dispose de 60 minutes pour survivre à la salle, en utilisant à parts égales logique et nerfs solides. L'ambiance est volontairement intense — ce n'est pas une salle pour les joueurs en quête d'une session de puzzle douce et familiale.

## Qui devrait (et ne devrait pas) y jouer

Annabelle est vraiment intense, voici donc ce qu'il faut savoir avant de vous lancer :

- Âge minimum recommandé : 13 ans, en raison de l'intensité des frayeurs
- Déconseillé aux personnes souffrant d'anxiété sévère, de problèmes cardiaques, ou d'une forte peur du noir
- Idéal pour les groupes qui recherchent spécifiquement une frayeur, pas seulement un défi de puzzles
- Les enfants de moins de 13 ans doivent être accompagnés d'un parent ou tuteur

## Comparaison avec nos autres salles

En plus d'Annabelle, elharba propose une escape room science-fiction années 80 et une escape room crime — toutes deux tendues et immersives, mais sans les éléments de frayeur propres à l'horreur. Si votre groupe est partagé entre fans d'horreur et personnes qui préfèrent éviter les sursauts, nos salles science-fiction et crime sont un excellent compromis.

## Prêt à l'affronter ?

Si vous cherchez l'expérience d'escape room la plus intense de Tunisie, Annabelle est faite pour ça. Venez avec un groupe solide, attendez-vous à avoir peur, et souvenez-vous : personne n'affronte ça seul — vous avez 60 minutes et votre équipe.`,
    titleAr: "هل آنابيل هي أكثر غرفة هروب رعبًا في تونس؟",
    excerptAr:
      "أضواء متذبذبة، مفاجآت حية، ودمية مسكونة — نكشف ما يجعل آنابيل واحدة من أكثر تجارب غرف الهروب كثافة في تونس.",
    contentAr: `غرف الهروب ذات طابع الرعب من فئة مختلفة تمامًا. فهي لا تختبر قدرتك على حل الألغاز فحسب — بل تختبر أعصابك أيضًا. آنابيل، غرفة الرعب الرائدة لدينا، صُممت خصيصًا لهذا الغرض.

## ما الذي يميز غرفة هروب بطابع الرعب

تختبر غرفة الهروب العادية عقلك. أما غرفة هروب الرعب فتختبر عقلك وأعصابك في آن واحد. أضواء متذبذبة، تصميم صوتي مقلق، أغراض تتحرك، ومساحات ضيقة ومظلمة — كلها ترفع نبضات قلبك حتى قبل أن تجد الدليل الأول، مما يجعل حل كل لغز أصعب وأنت هادئ.

## داخل آنابيل

تستوحي آنابيل طابعها من إحدى أشهر قصص الرعب: دمية مسكونة يقول التاريخ إنه لا يجب إزعاجها أبدًا. لدى فريقك 60 دقيقة للنجاة من الغرفة، مستخدمًا المنطق ورباطة الجأش بقدر متساوٍ. الأجواء مكثفة عمدًا — هذه ليست غرفة للاعبين الباحثين عن جلسة ألغاز هادئة وعائلية.

## من يجب (ومن لا يجب) أن يلعب

آنابيل مكثفة فعلًا، لذا من المهم معرفة ما تُقدم عليه:

- الحد الأدنى الموصى به للعمر: 13 سنة، بسبب شدة المفاجآت
- غير مستحسنة لمن يعاني من قلق شديد، أو مشاكل قلبية، أو خوف شديد من الظلام
- مثالية للمجموعات التي تبحث تحديدًا عن الخوف، لا فقط عن تحدي الألغاز
- يجب مرافقة الأطفال دون سن 13 من قبل أحد الوالدين أو الوصي

## مقارنة بغرفنا الأخرى

إلى جانب آنابيل، تُدير إلحربة غرفة خيال علمي بطابع الثمانينات وغرفة جريمة — كلتاهما متوترتان وغامرتان، لكن دون عناصر الرعب الخاصة بآنابيل. إذا كانت مجموعتكم منقسمة بين محبي الرعب ومن يفضل تجنب لحظات الفزع المفاجئة، فإن غرفتَي الخيال العلمي والجريمة خيار وسط ممتاز.

## مستعد لمواجهتها؟

إذا كنت تبحث عن أكثر تجربة غرفة هروب كثافة في تونس، فآنابيل صُممت لهذا الغرض بالضبط. تعال بمجموعة ثابتة الأعصاب، توقع أن تشعر بالخوف، وتذكر: لا أحد يواجه هذا وحده — لديك 60 دقيقة وفريقك.`,
  },
];

// 2. Upsert each guide by slug — inserts new guides, refreshes content on existing ones
for (const g of guides) {
  const existing = await db.execute({
    sql: `SELECT id FROM "Guide" WHERE slug = ?`,
    args: [g.slug],
  });
  const now = new Date().toISOString();

  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO "Guide"
        (id, slug, title, excerpt, content, titleFr, excerptFr, contentFr, titleAr, excerptAr, contentAr, heroImageUrl, pillar, active, "order", seoTitle, seoDescription, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        g.slug,
        g.title,
        g.excerpt,
        g.content,
        g.titleFr ?? "",
        g.excerptFr ?? "",
        g.contentFr ?? "",
        g.titleAr ?? "",
        g.excerptAr ?? "",
        g.contentAr ?? "",
        g.heroImageUrl ?? "",
        g.pillar ? 1 : 0,
        1,
        g.order ?? 0,
        g.seoTitle,
        g.seoDescription,
        now,
        now,
      ],
    });
    console.log(`  ✓ Created guide: ${g.slug}`);
  } else {
    await db.execute({
      sql: `UPDATE "Guide" SET
        title = ?, excerpt = ?, content = ?,
        titleFr = ?, excerptFr = ?, contentFr = ?,
        titleAr = ?, excerptAr = ?, contentAr = ?,
        heroImageUrl = ?, pillar = ?, "order" = ?,
        seoTitle = ?, seoDescription = ?, updatedAt = ?
        WHERE slug = ?`,
      args: [
        g.title,
        g.excerpt,
        g.content,
        g.titleFr ?? "",
        g.excerptFr ?? "",
        g.contentFr ?? "",
        g.titleAr ?? "",
        g.excerptAr ?? "",
        g.contentAr ?? "",
        g.heroImageUrl ?? "",
        g.pillar ? 1 : 0,
        g.order ?? 0,
        g.seoTitle,
        g.seoDescription,
        now,
        g.slug,
      ],
    });
    console.log(`  ✓ Updated guide: ${g.slug}`);
  }
}

console.log("\nDone.\n");
