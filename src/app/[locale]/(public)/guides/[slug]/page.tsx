import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import GuideArticleClient from "@/components/GuideArticleClient";
import { localePath, localeAlternates } from "@/lib/i18n/locale-url";
import type { Locale } from "@/lib/i18n/types";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = await prisma.guide.findUnique({ where: { slug } });
  if (!guide || !guide.active) return {};
  const path = `/guides/${slug}`;
  return {
    title: { absolute: guide.seoTitle || guide.title },
    description: guide.seoDescription || guide.excerpt,
    alternates: { canonical: localePath(locale as Locale, path), languages: localeAlternates(path) },
    openGraph: {
      title: guide.seoTitle || guide.title,
      description: guide.seoDescription || guide.excerpt,
      url: localePath(locale as Locale, path),
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
  const { locale, slug } = await params;
  const guide = await prisma.guide.findUnique({ where: { slug } });
  if (!guide || !guide.active) notFound();

  const base = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");
  const guideUrl = `${base}${localePath(locale as Locale, `/guides/${guide.slug}`)}`;

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
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}${localePath(locale as Locale, "/")}` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${base}${localePath(locale as Locale, "/guides")}` },
      { "@type": "ListItem", position: 3, name: guide.title, item: guideUrl },
    ],
  };

  return (
    <>
      <script
        id={`ld-article-${guide.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        id={`ld-breadcrumb-${guide.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <GuideArticleClient guide={guide} />
    </>
  );
}
