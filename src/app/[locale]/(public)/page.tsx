import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import GoogleReviews from "@/components/GoogleReviews";
import SocialGallery from "@/components/SocialGallery";
import HomeContent from "@/components/HomeContent";
import HomeCTA from "@/components/HomeCTA";
import { localePath, localeAlternates } from "@/lib/i18n/locale-url";
import type { Locale } from "@/lib/i18n/types";

export const revalidate = 3600;

const SEO: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Tunisia's #1 Rated Escape Room | Escape Room Elharba",
    description:
      "Tunisia's top-rated escape room on Google. Three uniquely themed rooms — Horror, 80s Sci-Fi, and Crime Drama — in Tunis. Book your 60-minute adventure today.",
  },
  fr: {
    title: "La Escape Room la Mieux Notée de Tunisie | Escape Room Elharba",
    description:
      "La escape room la mieux notée de Tunisie sur Google. Trois salles à thème uniques — Horreur, Science-Fiction 80s, et Crime — à Tunis. Réservez votre aventure de 60 minutes dès aujourd'hui.",
  },
  ar: {
    title: "أفضل غرفة هروب في تونس (الأعلى تقييمًا) | Escape Room Elharba",
    description:
      "أفضل غرفة هروب في تونس وفق تقييمات جوجل. ثلاث غرف بطوابع فريدة — رعب، خيال علمي، وجريمة — في تونس. احجز مغامرتك التي تستغرق 60 دقيقة اليوم.",
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
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: localePath(l, "/"), languages: localeAlternates("/") },
    openGraph: { title: seo.title, url: localePath(l, "/") },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      leaderboardEntries: {
        orderBy: { timeSpentSec: "asc" },
        take: 5,
        select: { id: true, groupName: true, partySize: true, timeSpentSec: true, completedAt: true },
      },
    },
  });

  const base = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");
  const logoUrl = "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${base}/#business`,
    name: "Escape Room Elharba",
    description: "Tunisia's top-rated escape room on Google — three uniquely themed rooms in Tunis: horror, retro sci-fi, and crime drama. Book your 60-minute adventure.",
    url: `${base}${localePath(locale as Locale, "/")}`,
    image: logoUrl,
    logo: logoUrl,
    telephone: "+21628720530",
    priceRange: "$$",
    currenciesAccepted: "TND",
    paymentAccepted: "Cash",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Manouba",
      addressLocality: "Manouba",
      addressRegion: "Manouba",
      addressCountry: "TN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.809,
      longitude: 10.096,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "12:00",
        closes: "01:00",
      },
    ],
    sameAs: [
      "https://www.facebook.com/p/Escape-room-elharba-61571229061181/",
      "https://www.instagram.com/escaperoomelharba/",
      "https://www.tiktok.com/@escape.room.elharba",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Escape Rooms",
      itemListElement: rooms.map((r) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: r.name,
          description: r.tagline,
          url: `${base}${localePath(locale as Locale, `/rooms/${r.slug}`)}`,
        },
      })),
    },
  };

  const roomsData = rooms.map((r) => ({
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    heroImageUrl: r.heroImageUrl,
    themeColors: r.themeColors,
    difficulty: r.difficulty,
    minPlayers: r.minPlayers,
    maxPlayers: r.maxPlayers,
    roomStatus: r.roomStatus ?? "active",
  }));

  const leaderboardRooms = rooms.map((r) => ({
    slug: r.slug,
    name: r.name,
    themeColors: r.themeColors,
    successRate: r.successRate,
    entries: r.leaderboardEntries.map((e) => ({ ...e, completedAt: e.completedAt.toISOString() })),
  }));

  return (
    <>
      <script
        id="ld-local-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent rooms={roomsData} leaderboardRooms={leaderboardRooms} />
      <GoogleReviews />
      <SocialGallery />
      <HomeCTA />
    </>
  );
}
