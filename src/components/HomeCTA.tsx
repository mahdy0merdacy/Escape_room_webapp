"use client";

import Link from "@/components/LocaleLink";
import { useT } from "./IntlProvider";

export default function HomeCTA() {
  const t = useT();
  return (
    <section className="py-24 text-center px-4">
      <h2 className="text-4xl font-bold text-white mb-4">{t.home.ctaH}</h2>
      <p className="text-white/60 mb-8 max-w-md mx-auto">{t.home.ctaSub}</p>
      <Link
        href="/rooms"
        className="bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors inline-block"
      >
        {t.home.ctaBtn}
      </Link>
    </section>
  );
}
