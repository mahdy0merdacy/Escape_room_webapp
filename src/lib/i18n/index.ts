import type { Locale, Dict } from "./types";
import { en } from "./en";
import { fr } from "./fr";
import { ar } from "./ar";

export { en, fr, ar };
export type { Locale, Dict };
export { LOCALES, DEFAULT_LOCALE } from "./types";

export const dicts: Record<Locale, Dict> = { en, fr, ar };

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? dicts.en;
}
