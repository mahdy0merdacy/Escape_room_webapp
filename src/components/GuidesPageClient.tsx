"use client";

import Link from "@/components/LocaleLink";
import { useLocale, useT } from "./IntlProvider";
import { localizeGuide, type LocalizedGuideFields } from "@/lib/guideI18n";

type Guide = LocalizedGuideFields & {
  id: string;
  slug: string;
  pillar: boolean;
  heroImageUrl: string;
};

export default function GuidesPageClient({ guides }: { guides: Guide[] }) {
  const { locale } = useLocale();
  const t = useT();

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <p className="text-red-500 uppercase tracking-[0.3em] text-sm font-semibold mb-4 text-center">
        {t.guides.eyebrow}
      </p>
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
        {t.guides.heading}
      </h1>
      <p className="text-white/60 max-w-lg mx-auto text-center mb-14">{t.guides.tagline}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide) => {
          const l = localizeGuide(guide, locale);
          return (
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
                    {t.guides.startHere}
                  </span>
                )}
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                  {l.title}
                </h2>
                <p className="text-white/60 text-sm">{l.excerpt}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
