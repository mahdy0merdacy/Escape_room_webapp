"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/IntlProvider";
import { useLocale } from "@/components/IntlProvider";

type FaqItemData = {
  id: string;
  active: boolean;
  q_en: string; q_fr: string; q_ar: string;
  a_en: string; a_fr: string; a_ar: string;
};

type Lang = "en" | "fr" | "ar";

function FaqAccordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white/5 hover:bg-white/8 transition-colors"
      >
        <span className="text-white font-semibold text-sm sm:text-base">{q}</span>
        <span className={`text-white/40 text-xl shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-6 py-5 bg-black/30 text-white/60 text-sm leading-relaxed border-t border-white/5">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqContent({ items, phone }: { items: FaqItemData[]; phone: string }) {
  const t = useT();
  const { locale } = useLocale();
  const lang = locale as Lang;

  const telLink = `tel:${phone.replace(/\s/g, "")}`;

  const activeItems = items
    .filter((it) => it.active)
    .filter((it) => it[`q_${lang}`] || it.q_en);

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <section className="pt-24 pb-16 px-4 text-center border-b border-white/5">
        <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-4">
          {t.faq.eyebrow}
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          {t.faq.heading}
        </h1>
        <p className="text-white/50 max-w-md mx-auto text-lg">{t.faq.tagline}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-20 space-y-3">
        {activeItems.map((item) => (
          <FaqAccordion
            key={item.id}
            q={item[`q_${lang}`] || item.q_en}
            a={item[`a_${lang}`] || item.a_en}
          />
        ))}
      </section>

      <section className="bg-white/[0.03] border-t border-white/5 py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">{t.faq.stillH}</h2>
        <p className="text-white/50 mb-6">{t.faq.stillSub}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={telLink}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            {t.faq.callBtn}
          </a>
          <Link
            href="/contact"
            className="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-lg transition-colors"
          >
            {t.faq.contactBtn}
          </Link>
        </div>
      </section>
    </div>
  );
}
