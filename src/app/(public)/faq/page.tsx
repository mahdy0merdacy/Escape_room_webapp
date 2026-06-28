import type { Metadata } from "next";
import Script from "next/script";
import prisma from "@/lib/prisma";
import FaqContent from "./FaqContent";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "FAQ — elharba Escape Room",
  description: "Answers to the most common questions about elharba escape rooms in Manouba, Tunisia.",
  alternates: { canonical: "/faq" },
  openGraph: { url: "/faq" },
};

export default async function FaqPage() {
  const [items, phoneSetting] = await Promise.all([
    prisma.faqItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.siteSettings.findUnique({ where: { key: "contact.phone" } }),
  ]);

  const phone = phoneSetting?.value ?? "+216 28 720 530";

  const activeItems = items.filter((it) => it.active && it.q_en && it.a_en);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: activeItems.map((it) => ({
      "@type": "Question",
      name: it.q_en,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.a_en,
      },
    })),
  };

  return (
    <>
      {activeItems.length > 0 && (
        <Script
          id="ld-faq"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <FaqContent items={items} phone={phone} />
    </>
  );
}
