"use client";

import { useLocale } from "./IntlProvider";
import type { StoryI18n } from "@/lib/story";

export default function RoomDescription({
  story,
  headingFont,
}: {
  story: StoryI18n;
  headingFont: string;
}) {
  const { locale } = useLocale();
  const text = story[locale as keyof StoryI18n] || story.en || "";

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: headingFont }}>
        {locale === "ar" ? "القصة" : locale === "fr" ? "L'Histoire" : "The Story"}
      </h2>
      <div className="text-white/70 leading-relaxed space-y-4">
        {text.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}
