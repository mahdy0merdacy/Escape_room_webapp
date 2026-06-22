"use client";

import { useLocale } from "./IntlProvider";
import type { Locale } from "@/lib/i18n/types";

const LABELS: Record<Locale, string> = { en: "EN", fr: "FR", ar: "ع" };

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-0.5 bg-white/8 rounded-lg p-0.5" role="group" aria-label="Language">
      {(["en", "fr", "ar"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide transition-colors ${
            locale === l
              ? "bg-red-600 text-white"
              : "text-white/50 hover:text-white"
          }`}
          aria-pressed={locale === l}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
