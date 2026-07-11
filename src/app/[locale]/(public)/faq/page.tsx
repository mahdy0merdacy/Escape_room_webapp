import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import FaqContent from "./FaqContent";
import { localePath, localeAlternates } from "@/lib/i18n/locale-url";
import type { Locale } from "@/lib/i18n/types";

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "FAQ — Escape Room Tunisia",
    description: "Answers to the most common questions about elharba escape rooms in Manouba, Tunisia.",
    alternates: { canonical: localePath(locale as Locale, "/faq"), languages: localeAlternates("/faq") },
    openGraph: { url: localePath(locale as Locale, "/faq") },
  };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  const [items, phoneSetting] = await Promise.all([
    prisma.faqItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.siteSettings.findUnique({ where: { key: "contact.phone" } }),
  ]);

  const phone = phoneSetting?.value ?? "+216 28 720 530";

  const lang = locale as "en" | "fr" | "ar";
  const activeItems = items.filter((it) => it.active && it.q_en && it.a_en);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: activeItems.map((it) => ({
      "@type": "Question",
      name: it[`q_${lang}`] || it.q_en,
      acceptedAnswer: {
        "@type": "Answer",
        text: it[`a_${lang}`] || it.a_en,
      },
    })),
  };

  return (
    <>
      {activeItems.length > 0 && (
        <script
          id="ld-faq"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <FaqContent items={items} phone={phone} />
    </>
  );
}
