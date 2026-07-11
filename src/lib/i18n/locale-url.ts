import { LOCALES } from "./types";
import type { Locale } from "./types";

/** Prefixes a root-relative path ("/", "/rooms/annabelle") with a locale segment. */
export function localePath(locale: Locale, path: string): string {
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

/**
 * Builds the `alternates.languages` map Next.js expects for hreflang,
 * plus an `x-default` pointing at the English version.
 */
export function localeAlternates(path: string): Record<string, string> {
  const entries = LOCALES.map((l) => [l, localePath(l, path)] as const);
  return {
    ...Object.fromEntries(entries),
    "x-default": localePath("en", path),
  };
}

/** Strips a leading /en, /fr, or /ar segment, returning the rest ("/" if nothing remains). */
export function stripLocalePath(pathname: string): string {
  const parts = pathname.split("/");
  const first = parts[1] as Locale | undefined;
  if (first && LOCALES.includes(first)) {
    const rest = "/" + parts.slice(2).join("/");
    return rest.replace(/\/$/, "") || "/";
  }
  return pathname;
}
