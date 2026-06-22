"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "./IntlProvider";
import type { Locale } from "@/lib/i18n/types";

const OPTIONS: { locale: Locale; flag: string; label: string }[] = [
  { locale: "en", flag: "🇬🇧", label: "English" },
  { locale: "fr", flag: "🇫🇷", label: "Français" },
  { locale: "ar", flag: "🇸🇦", label: "العربية" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.locale === locale) ?? OPTIONS[0];

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
        aria-label="Select language"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <svg
          viewBox="0 0 12 12"
          className={`w-3 h-3 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 end-0 bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 min-w-[140px]">
          {OPTIONS.map(({ locale: l, flag, label }) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-start ${
                locale === l
                  ? "bg-red-600/20 text-white"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-base leading-none">{flag}</span>
              <span>{label}</span>
              {locale === l && (
                <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 ms-auto text-red-400">
                  <path d="M10.28 2.28a1 1 0 0 0-1.42 0L4.5 6.64 3.14 5.28a1 1 0 0 0-1.42 1.42l2.07 2.07a1 1 0 0 0 1.42 0l5.07-5.07a1 1 0 0 0 0-1.42z"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
