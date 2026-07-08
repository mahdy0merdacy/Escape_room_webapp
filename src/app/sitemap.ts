import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");

  const [rooms, guides] = await Promise.all([
    prisma.room.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.guide.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/rooms`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/guides`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...rooms.map((r) => ({
      url: `${base}/rooms/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...guides.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified: g.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
