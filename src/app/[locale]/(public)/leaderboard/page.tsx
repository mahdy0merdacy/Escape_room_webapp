import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import LeaderboardContent from "@/components/LeaderboardContent";
import { localePath, localeAlternates } from "@/lib/i18n/locale-url";
import type { Locale } from "@/lib/i18n/types";

export const revalidate = 60;

const SEO: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Leaderboard — Fastest Escape Times | Escape Room Elharba",
    description:
      "See the top 20 fastest teams to beat each escape room at Escape Room Elharba in Tunis, Tunisia. Think your team can top the board?",
  },
  fr: {
    title: "Classement — Meilleurs Temps | Escape Room Elharba",
    description:
      "Découvrez les 20 équipes les plus rapides à avoir vaincu chaque escape room chez Escape Room Elharba à Tunis, Tunisie.",
  },
  ar: {
    title: "لوحة الصدارة — أسرع الأوقات | Escape Room Elharba",
    description: "شاهد أفضل 20 فريقاً الأسرع في اجتياز كل غرفة هروب لدى Escape Room Elharba في تونس.",
  },
};

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const l = (locale as Locale) in SEO ? (locale as Locale) : "en";
  const seo = SEO[l];
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: localePath(l, "/leaderboard"), languages: localeAlternates("/leaderboard") },
    openGraph: { title: seo.title, url: localePath(l, "/leaderboard") },
  };
}

export default async function LeaderboardPage() {
  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      slug: true,
      name: true,
      themeColors: true,
      successRate: true,
      leaderboardEntries: {
        orderBy: { timeSpentSec: "asc" },
        take: 20,
        select: { id: true, groupName: true, partySize: true, timeSpentSec: true, completedAt: true },
      },
    },
  });

  const leaderboardRooms = rooms.map((r) => ({
    slug: r.slug,
    name: r.name,
    themeColors: r.themeColors,
    successRate: r.successRate,
    entries: r.leaderboardEntries.map((e) => ({ ...e, completedAt: e.completedAt.toISOString() })),
  }));

  return <LeaderboardContent initialRooms={leaderboardRooms} />;
}
