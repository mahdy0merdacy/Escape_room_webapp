export type StoryI18n = { en: string; fr: string; ar: string };

export function parseStory(raw: string): StoryI18n {
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object" && ("en" in obj || "fr" in obj || "ar" in obj)) {
      return { en: obj.en ?? "", fr: obj.fr ?? "", ar: obj.ar ?? "" };
    }
  } catch {}
  // Legacy plain string → treat as English
  return { en: raw ?? "", fr: "", ar: "" };
}

export function serializeStory(i18n: StoryI18n): string {
  return JSON.stringify(i18n);
}

export function storyTeaser(raw: string): string {
  return parseStory(raw).en.split("\n")[0] ?? "";
}
