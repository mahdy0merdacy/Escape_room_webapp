"use client";

import Link from "next/link";
import Image from "next/image";
import { useT } from "./IntlProvider";

type Room = {
  slug: string;
  name: string;
  tagline: string;
  heroImageUrl: string;
  themeColors: string;
  difficulty: number;
  minPlayers: number;
  maxPlayers: number;
  roomStatus: string;
};

export default function HomeContent({ rooms }: { rooms: Room[] }) {
  const t = useT();

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#090909]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <p className="text-red-500 uppercase tracking-[0.3em] text-sm font-semibold mb-4">
            {t.home.eyebrow}
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 text-white">
            {t.home.h1a}
            <br />
            <span className="text-red-500">{t.home.h1b}</span>
            <br />
            {t.home.h1c}
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl mx-auto">
            {t.home.tagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rooms"
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded text-lg transition-colors tracking-wide"
            >
              {t.home.cta}
            </Link>
            <Link
              href="/rooms"
              className="border border-white/30 hover:border-white/60 text-white px-8 py-4 rounded text-lg transition-colors"
            >
              {t.home.explore}
            </Link>
          </div>
        </div>
      </section>

      {/* Rooms preview */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
          {t.home.roomsH}
        </h2>
        <p className="text-white/60 text-center mb-14 max-w-xl mx-auto">
          {t.home.roomsSub}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rooms.map((room) => {
            const colors = JSON.parse(room.themeColors) as {
              primary: string;
              secondary: string;
              accent: string;
              heroPosition?: string;
            };
            const isComingSoon = room.roomStatus === "coming_soon";
            const isUnavailable = room.roomStatus === "unavailable";
            const locked = isComingSoon || isUnavailable;
            return (
              <Link
                key={room.slug}
                href={`/rooms/${room.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:-translate-y-1 duration-300 flex flex-col"
                style={{ background: colors.primary }}
              >
                <div className="h-52 relative">
                  <Image
                    src={room.heroImageUrl}
                    alt={room.name}
                    fill
                    className="object-cover"
                    style={{ objectPosition: `center ${colors.heroPosition ?? "50%"}` }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to bottom, transparent 40%, ${colors.primary})` }}
                  />
                  {/* Status badge pinned to top-left of image */}
                  {isComingSoon && (
                    <span className="absolute top-3 start-3 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                      🚧 Coming Soon
                    </span>
                  )}
                  {isUnavailable && (
                    <span className="absolute top-3 start-3 bg-zinc-700 text-white/80 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                      ⛔ Unavailable
                    </span>
                  )}
                </div>
                <div className={`p-6 flex flex-col flex-1 ${locked ? "opacity-60" : ""}`}>
                  <span
                    className="text-xs font-bold tracking-widest uppercase mb-2"
                    style={{ color: colors.accent }}
                  >
                    {"★".repeat(room.difficulty)} {t.home.difficulty} {room.difficulty}/5
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2">{room.name}</h3>
                  <p className="text-white/60 text-sm mb-4 flex-1">{room.tagline}</p>
                  <div className="flex items-center justify-between text-sm mt-auto">
                    <span className="text-white/50">
                      {room.minPlayers}–{room.maxPlayers} {t.home.players}
                    </span>
                    <span className="font-semibold" style={{ color: colors.accent }}>
                      {t.home.fromPrice}
                    </span>
                  </div>
                  <div
                    className="mt-4 text-center py-2 rounded text-sm font-semibold group-hover:opacity-90 transition-opacity"
                    style={{ background: colors.accent, color: colors.primary }}
                  >
                    {locked ? "Learn More →" : t.home.bookNow}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/5 py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12 text-white">{t.home.howH}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {t.home.steps.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center">
                <span className="text-4xl font-black text-red-600 mb-3">{n}</span>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
