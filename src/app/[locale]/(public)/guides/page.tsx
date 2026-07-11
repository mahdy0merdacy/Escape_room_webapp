import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import GuidesPageClient from "@/components/GuidesPageClient";
import { localePath, localeAlternates } from "@/lib/i18n/locale-url";
import type { Locale } from "@/lib/i18n/types";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Escape Room Guides & Tips",
    description:
      "Everything you need to know about escape rooms in Tunis, Tunisia — tips, comparisons, and guides from elharba.",
    alternates: { canonical: localePath(locale as Locale, "/guides"), languages: localeAlternates("/guides") },
    openGraph: { url: localePath(locale as Locale, "/guides") },
  };
}

export default async function GuidesPage({ params }: Props) {
  const { locale } = await params;
  const guides = await prisma.guide
    .findMany({
      where: { active: true },
      orderBy: [{ pillar: "desc" }, { order: "asc" }],
    })
    .catch(() => []);

  const base = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Escape Room Guides & Tips",
    url: `${base}${localePath(locale as Locale, "/guides")}`,
    hasPart: guides.map((g) => ({
      "@type": "Article",
      headline: g.title,
      url: `${base}${localePath(locale as Locale, `/guides/${g.slug}`)}`,
    })),
  };

  return (
    <>
      <script
        id="ld-guides-collection"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <GuidesPageClient guides={guides} />
    </>
  );
}
