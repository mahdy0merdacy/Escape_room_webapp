"use client";

import Link from "@/components/LocaleLink";
import { useLocale, useT } from "./IntlProvider";
import { localizeGuide, type LocalizedGuideFields } from "@/lib/guideI18n";
import GuideContent from "./GuideContent";

type Guide = LocalizedGuideFields & {
  slug: string;
  heroImageUrl: string;
};

export default function GuideArticleClient({ guide }: { guide: Guide }) {
  const { locale } = useLocale();
  const t = useT();
  const l = localizeGuide(guide, locale);

  return (
    <article className="max-w-3xl mx-auto px-4 py-16">
      <nav className="text-sm text-white/40 mb-8">
        <Link href="/guides" className="hover:text-white transition-colors">
          {t.nav.guides}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white/60">{l.title}</span>
      </nav>

      <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">{l.title}</h1>

      {guide.heroImageUrl && (
        <div
          className="h-64 md:h-96 rounded-2xl bg-cover bg-center border border-white/10 mb-10"
          style={{ backgroundImage: `url('${guide.heroImageUrl}')` }}
          role="img"
          aria-label={l.title}
        />
      )}

      <GuideContent content={l.content} />

      <div className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{t.guides.ctaHeading}</h2>
        <p className="text-white/60 mb-6">{t.guides.ctaSub}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/rooms"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded transition-colors"
          >
            {t.guides.viewAllRooms}
          </Link>
          <Link
            href="/contact"
            className="border border-white/30 hover:border-white/60 text-white px-6 py-3 rounded transition-colors"
          >
            {t.guides.contactUs}
          </Link>
        </div>
      </div>
    </article>
  );
}
