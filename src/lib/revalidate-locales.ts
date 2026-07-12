import { revalidatePath } from "next/cache";
import { LOCALES } from "./i18n";
import { localePath } from "./i18n/locale-url";

/**
 * Revalidates a root-relative path ("/", "/rooms/annabelle") across all three
 * locale prefixes. The bare path itself is no longer a real cached page since
 * the locale-URL migration — it just redirects — so revalidating only it (the
 * old pre-migration behavior) leaves every actual page (/en/..., /fr/..., /ar/...)
 * stale after an admin edit.
 */
export function revalidateLocalizedPath(path: string) {
  for (const locale of LOCALES) {
    revalidatePath(localePath(locale, path));
  }
}
