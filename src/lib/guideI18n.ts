import type { Locale } from "./i18n/types";

export type LocalizedGuideFields = {
  title: string;
  excerpt: string;
  content: string;
  titleFr: string;
  excerptFr: string;
  contentFr: string;
  titleAr: string;
  excerptAr: string;
  contentAr: string;
};

export function localizeGuide<T extends LocalizedGuideFields>(
  guide: T,
  locale: Locale
): { title: string; excerpt: string; content: string } {
  if (locale === "fr") {
    return {
      title: guide.titleFr || guide.title,
      excerpt: guide.excerptFr || guide.excerpt,
      content: guide.contentFr || guide.content,
    };
  }
  if (locale === "ar") {
    return {
      title: guide.titleAr || guide.title,
      excerpt: guide.excerptAr || guide.excerpt,
      content: guide.contentAr || guide.content,
    };
  }
  return { title: guide.title, excerpt: guide.excerpt, content: guide.content };
}
