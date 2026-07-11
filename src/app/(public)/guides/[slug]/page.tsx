import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import prisma from "@/lib/prisma";
import GuideContent from "@/components/GuideContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await prisma.guide.findUnique({ where: { slug } });
  if (!guide || !guide.active) return {};
  return {
    title: guide.seoTitle || guide.title,
    description: guide.seoDescription || guide.excerpt,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      title: guide.seoTitle || guide.title,
      description: guide.seoDescription || guide.excerpt,
      url: `/guides/${slug}`,
      images: guide.heroImageUrl ? [{ url: guide.heroImageUrl, alt: guide.title }] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.seoTitle || guide.title,
      description: guide.seoDescription || guide.excerpt,
      images: guide.heroImageUrl ? [guide.heroImageUrl] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const guides = await prisma.guide
    .findMany({ where: { active: true }, select: { slug: true } })
    .catch(() => []);
  return guides.map((g: { slug: string }) => ({ slug: g.slug }));
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await prisma.guide.findUnique({ where: { slug } });
  if (!guide || !guide.active) notFound();

  const base = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");
  const guideUrl = `${base}/guides/${guide.slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${guideUrl}#article`,
    headline: guide.title,
    description: guide.seoDescription || guide.excerpt,
    image: guide.heroImageUrl || undefined,
    url: guideUrl,
    author: { "@type": "Organization", name: "elharba" },
    publisher: { "@type": "Organization", name: "elharba" },
    datePublished: guide.createdAt.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${base}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title, item: guideUrl },
    ],
  };

  return (
    <>
      <Script
        id={`ld-article-${guide.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <Script
        id={`ld-breadcrumb-${guide.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-16">
        <nav className="text-sm text-white/40 mb-8">
          <Link href="/guides" className="hover:text-white transition-colors">
            Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/60">{guide.title}</span>
        </nav>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {guide.title}
        </h1>

        {guide.heroImageUrl && (
          <div
            className="h-64 md:h-96 rounded-2xl bg-cover bg-center border border-white/10 mb-10"
            style={{ backgroundImage: `url('${guide.heroImageUrl}')` }}
            role="img"
            aria-label={guide.title}
          />
        )}

        <GuideContent content={guide.content} />

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to try it yourself?</h2>
          <p className="text-white/60 mb-6">
            Book one of our three themed escape rooms in Tunis, Tunisia — 60 minutes, no experience needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/rooms"
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded transition-colors"
            >
              View All Rooms
            </Link>
            <Link
              href="/contact"
              className="border border-white/30 hover:border-white/60 text-white px-6 py-3 rounded transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
