import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { LOCALES } from "@/lib/i18n";
import { localePath, localeAlternates } from "@/lib/i18n/locale-url";

export const dynamic = "force-dynamic";

type Entry = {
  path: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

/** Expands one logical page into one sitemap entry per locale, each cross-linked via hreflang. */
function expand(base: string, { path, lastModified, changeFrequency, priority }: Entry): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    Object.entries(localeAlternates(path)).map(([lang, p]) => [lang, `${base}${p}`])
  );
  return LOCALES.map((locale) => ({
    url: `${base}${localePath(locale, path)}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXTAUTH_URL ?? "https://elharba.tn").replace(/\/+$/, "");
  const now = new Date();

  const [rooms, guides] = await Promise.all([
    prisma.room.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.guide.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);

  return [
    ...expand(base, { path: "/", lastModified: now, changeFrequency: "weekly", priority: 1 }),
    ...expand(base, { path: "/rooms", lastModified: now, changeFrequency: "daily", priority: 0.9 }),
    ...expand(base, { path: "/about", lastModified: now, changeFrequency: "monthly", priority: 0.7 }),
    ...expand(base, { path: "/contact", lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    ...expand(base, { path: "/faq", lastModified: now, changeFrequency: "weekly", priority: 0.7 }),
    ...expand(base, { path: "/guides", lastModified: now, changeFrequency: "weekly", priority: 0.8 }),
    ...rooms.flatMap((r) =>
      expand(base, { path: `/rooms/${r.slug}`, lastModified: r.updatedAt, changeFrequency: "daily", priority: 0.8 })
    ),
    ...guides.flatMap((g) =>
      expand(base, { path: `/guides/${g.slug}`, lastModified: g.updatedAt, changeFrequency: "monthly", priority: 0.7 })
    ),
  ];
}
