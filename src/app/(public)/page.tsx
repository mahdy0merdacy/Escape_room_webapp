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
    "Three uniquely themed escape rooms in Manouba, Tunisia. Horror, 80s Sci-Fi, and Crime Drama. Book your 60-minute adventure.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default async function HomePage() {
  const rooms = await prisma.room.findMany({ where: { active: true }, orderBy: { order: "asc" } });

  const base = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");
  const logoUrl = "https://mcgny6ysyqbf6ib9.public.blob.vercel-storage.com/Images/logo_Plan-de-travail-1.png";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${base}/#business`,
    name: "elharba",
    description: "Three uniquely themed escape rooms in Manouba, Tunisia — horror, retro sci-fi, and crime drama. Book your 60-minute adventure.",
    url: base,
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
          url: `${base}/rooms/${r.slug}`,
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
