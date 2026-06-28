"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Locale, Dict } from "@/lib/i18n/types";
import { dicts, DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

type IntlContextValue = { locale: Locale; t: Dict; setLocale: (l: Locale) => void };

const IntlContext = createContext<IntlContextValue>({
  locale: DEFAULT_LOCALE,
  t: dicts[DEFAULT_LOCALE],
  setLocale: () => {},
});

function readLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem("locale") as Locale | null;
  return stored && LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
}

export function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const l = readLocale();
    setLocaleState(l);
    applyLocale(l);
  }, []);

  function setLocale(l: Locale) {
    localStorage.setItem("locale", l);
    setLocaleState(l);
    applyLocale(l);
  }

  return (
    <IntlContext.Provider value={{ locale, t: dicts[locale], setLocale }}>
      {children}
    </IntlContext.Provider>
  );
}

function applyLocale(l: Locale) {
  document.documentElement.lang = l;
  document.documentElement.dir = dicts[l].dir;
}

export function useT(): Dict {
  return useContext(IntlContext).t;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const { locale, setLocale } = useContext(IntlContext);
  return { locale, setLocale };
}
