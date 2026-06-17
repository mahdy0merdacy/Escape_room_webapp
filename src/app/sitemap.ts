import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const rooms = await prisma.room.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } });

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/rooms`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...rooms.map((r) => ({
      url: `${base}/rooms/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
