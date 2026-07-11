import prisma from "@/lib/prisma";
import type { Room } from "@prisma/client";
import type { Metadata } from "next";
import RoomsGrid from "@/components/RoomsGrid";
import { localePath, localeAlternates } from "@/lib/i18n/locale-url";
import type { Locale } from "@/lib/i18n/types";

const SEO: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Escape Rooms in Tunis, Tunisia",
    description:
      "Browse all three elharba escape rooms in Tunis, Tunisia — horror, retro sci-fi, and crime drama. Book your experience today.",
  },
  fr: {
    title: "Escape Rooms à Tunis, Tunisie",
    description:
      "Découvrez nos trois escape rooms à Tunis, Tunisie — horreur, science-fiction rétro et crime. Réservez votre expérience dès aujourd'hui.",
  },
  ar: {
    title: "غرف الهروب في تونس",
    description:
      "تصفح غرف الهروب الثلاث لدى إلحربة في تونس — رعب، خيال علمي، وجريمة. احجز تجربتك اليوم.",
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
    alternates: { canonical: localePath(l, "/rooms"), languages: localeAlternates("/rooms") },
    openGraph: { url: localePath(l, "/rooms") },
  };
}

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({ where: { active: true }, orderBy: { order: "asc" } });

  const roomData = rooms.map((room: Room) => ({
    slug: room.slug,
    name: room.name,
    tagline: room.tagline,
    story: room.story,
    heroImageUrl: room.heroImageUrl,
    themeColors: room.themeColors,
    durationMinutes: room.durationMinutes,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    difficulty: room.difficulty,
    roomStatus: room.roomStatus,
  }));

  return <RoomsGrid rooms={roomData} />;
}
