import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Script from "next/script";
import GoogleReviews from "@/components/GoogleReviews";
import SocialGallery from "@/components/SocialGallery";
import HomeContent from "@/components/HomeContent";
import HomeCTA from "@/components/HomeCTA";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "elharba — Escape Rooms",
  description:
    "Three uniquely themed escape rooms. Horror, 80s Sci-Fi, and Crime Drama. Book your 60-minute adventure.",
};

export default async function HomePage() {
  const rooms = await prisma.room.findMany({ where: { active: true } });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "elharba",
    description: "Escape room experiences in three themed rooms.",
    url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    "@id": (process.env.NEXTAUTH_URL ?? "http://localhost:3000") + "/#business",
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Escape Rooms",
      itemListElement: rooms.map((r) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: r.name,
          description: r.tagline,
          url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/rooms/${r.slug}`,
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
  }));

  return (
    <>
      <Script
        id="ld-local-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent rooms={roomsData} />
      <GoogleReviews />
      <SocialGallery />
      <HomeCTA />
    </>
  );
}
