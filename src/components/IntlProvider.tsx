"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Locale, Dict } from "@/lib/i18n/types";
import { dicts, DEFAULT_LOCALE } from "@/lib/i18n";

type IntlContextValue = { locale: Locale; t: Dict };

const IntlContext = createContext<IntlContextValue>({
  locale: DEFAULT_LOCALE,
  t: dicts[DEFAULT_LOCALE],
});

/**
 * Locale is decided server-side by the URL's [locale] segment, not localStorage —
 * that's what makes each language crawlable at its own URL. We still write to
 * localStorage so a later visit to "/" can offer to redirect to the remembered
 * language, but it never controls what actually renders.
 */
export function IntlProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    localStorage.setItem("locale", locale);
  }, [locale]);

  return (
    <IntlContext.Provider value={{ locale, t: dicts[locale] }}>{children}</IntlContext.Provider>
  );
}

export function useT(): Dict {
  return useContext(IntlContext).t;
}

export function useLocale(): { locale: Locale } {
  const { locale } = useContext(IntlContext);
  return { locale };
}
