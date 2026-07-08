import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import prisma from "@/lib/prisma";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Escape Room Guides & Tips",
  description:
    "Everything you need to know about escape rooms in Tunis, Tunisia — tips, comparisons, and guides from elharba.",
  alternates: { canonical: "/guides" },
  openGraph: { url: "/guides" },
};

export default async function GuidesPage() {
  const guides = await prisma.guide.findMany({
    where: { active: true },
    orderBy: [{ pillar: "desc" }, { order: "asc" }],
  });

  const base = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Escape Room Guides & Tips",
    url: `${base}/guides`,
    hasPart: guides.map((g) => ({
      "@type": "Article",
      headline: g.title,
      url: `${base}/guides/${g.slug}`,
    })),
  };

  return (
    <>
      <Script
        id="ld-guides-collection"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-20">
        <p className="text-red-500 uppercase tracking-[0.3em] text-sm font-semibold mb-4 text-center">
          Escape Room Guides
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
          Escape Room Guides &amp; Tips
        </h1>
        <p className="text-white/60 max-w-lg mx-auto text-center mb-14">
          Everything you need to know about escape rooms in Tunis, Tunisia — before you book your first (or fiftieth) room.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className={`group rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:-translate-y-1 duration-300 flex flex-col ${
                guide.pillar ? "md:col-span-2 bg-white/[0.06]" : "bg-white/[0.03]"
              }`}
            >
              {guide.heroImageUrl && (
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url('${guide.heroImageUrl}')` }}
                />
              )}
              <div className="p-6">
                {guide.pillar && (
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-red-600 text-white mb-3">
                    Start Here
                  </span>
                )}
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                  {guide.title}
                </h2>
                <p className="text-white/60 text-sm">{guide.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
