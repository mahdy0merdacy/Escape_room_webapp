import type { Metadata } from "next";
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

  return <FaqContent items={items} phone={phone} />;
}
