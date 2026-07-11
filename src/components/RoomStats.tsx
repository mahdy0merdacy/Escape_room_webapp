"use client";

import { useState } from "react";
import Image from "next/image";
import { useT } from "./IntlProvider";
import { TIERS } from "@/lib/pricing";

interface RoomColors {
  primary: string;
  secondary: string;
  accent: string;
  heroPosition?: string;
}

interface RoomStatsProps {
  durationMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  difficulty: number;
  colors: RoomColors;
}

export function RoomGallery({ roomName, gallery }: { roomName: string; gallery: string[] }) {
  const t = useT();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (gallery.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">{t.room.gallery}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {gallery.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="relative aspect-video rounded-xl overflow-hidden border border-white/10 cursor-zoom-in"
          >
            <Image
              src={url}
              alt={`${roomName} escape room gallery photo ${i + 1}`}
              fill
              loading="lazy"
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {openIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-10"
          onClick={() => setOpenIdx(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIdx(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIdx((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length));
                }}
                aria-label="Previous image"
                className="absolute left-2 sm:left-6 text-white/70 hover:text-white text-4xl leading-none w-12 h-12 flex items-center justify-center"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIdx((i) => (i === null ? i : (i + 1) % gallery.length));
                }}
                aria-label="Next image"
                className="absolute right-2 sm:right-6 text-white/70 hover:text-white text-4xl leading-none w-12 h-12 flex items-center justify-center"
              >
                ›
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={gallery[openIdx]}
              alt={`${roomName} escape room gallery photo ${openIdx + 1}, full size`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DifficultyBar({ level }: { level: number }) {
  return (
    <div className="flex gap-1" aria-label={`Difficulty ${level} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-1.5 w-6 rounded-full"
          style={i <= level ? { background: "var(--room-accent)" } : { background: "rgba(255,255,255,0.15)" }}
        />
      ))}
    </div>
  );
}

export default function RoomStats({
  durationMinutes,
  minPlayers,
  maxPlayers,
  difficulty,
  colors,
}: RoomStatsProps) {
  const t = useT();

  return (
    <div className="space-y-10">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: "duration", label: t.booking.duration, value: `${durationMinutes} min` },
          { key: "players", label: t.room.players, value: `${minPlayers}–${maxPlayers}` },
          { key: "age", label: t.room.age, value: t.room.ageValue },
        ].map(({ key, label, value }) => (
          <div
            key={key}
            className="rounded-xl p-4 border border-white/10 text-center"
            style={{ background: colors.secondary }}
          >
            <p className="text-white/50 text-xs mb-1">{label}</p>
            <p className="text-white font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Pricing tiers */}
      <div>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">{t.room.pricing}</p>
        <div className="grid grid-cols-3 gap-3">
          {TIERS.map((tier) => (
            <div
              key={tier.label}
              className="rounded-xl p-4 border border-white/10 text-center"
              style={{ background: colors.secondary }}
            >
              <p className="text-white/50 text-xs mb-1">{tier.label}</p>
              <p className="font-bold" style={{ color: "var(--room-accent)" }}>
                {tier.pricePerPerson} TND
              </p>
              <p className="text-white/30 text-xs">{t.room.perPerson}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-2">{t.home.difficulty}</p>
        <DifficultyBar level={difficulty} />
      </div>
    </div>
  );
}

export function RoomSidebarStatus({
  roomStatus,
  colors,
}: {
  roomStatus: "active" | "coming_soon" | "unavailable";
  colors: RoomColors;
}) {
  const t = useT();

  return (
    <div
      className="rounded-2xl border border-white/10 p-8 text-center space-y-4"
      style={{ background: colors.secondary }}
    >
      <div className="text-4xl">{roomStatus === "coming_soon" ? "🚧" : "⛔"}</div>
      <div>
        <p className="text-white font-bold text-lg mb-1">
          {roomStatus === "coming_soon" ? t.room.comingSoon : t.room.unavailable}
        </p>
        <p className="text-white/50 text-sm">
          {roomStatus === "coming_soon" ? t.room.comingSoonDesc : t.room.unavailableDesc}
        </p>
      </div>
    </div>
  );
}

export function RoomStatusBanner({ roomStatus }: { roomStatus: "coming_soon" | "unavailable" }) {
  const t = useT();

  if (roomStatus === "coming_soon") {
    return (
      <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-900 to-amber-800 border-b border-amber-600/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl leading-none">🚧</span>
          <div>
            <p className="text-amber-100 font-bold text-sm">{t.room.comingSoon}</p>
            <p className="text-amber-200/70 text-xs">{t.room.comingSoonDesc}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="text-2xl leading-none">⛔</span>
        <div>
          <p className="text-white font-bold text-sm">{t.room.unavailable}</p>
          <p className="text-white/50 text-xs">{t.room.unavailableDesc}</p>
        </div>
      </div>
    </div>
  );
}
