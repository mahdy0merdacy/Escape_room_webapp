"use client";

import { useState } from "react";
import { useT } from "./IntlProvider";
import { useLeaderboardData, formatTime, type LeaderboardRoom } from "@/lib/useLeaderboardData";

export default function LeaderboardContent({ initialRooms }: { initialRooms: LeaderboardRoom[] }) {
  const t = useT();
  const rooms = useLeaderboardData(initialRooms) ?? initialRooms;
  const [activeSlug, setActiveSlug] = useState(initialRooms[0]?.slug);

  const active = rooms.find((r) => r.slug === activeSlug) ?? rooms[0];
  const colors = active
    ? (JSON.parse(active.themeColors) as { primary: string; secondary: string; accent: string })
    : null;

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <section className="pt-24 pb-16 px-4 text-center border-b border-white/5">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          {t.leaderboard.pageH}
        </h1>
        <p className="text-white/50 max-w-md mx-auto text-lg">{t.leaderboard.pageSub}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {rooms.map((room) => (
            <button
              key={room.slug}
              onClick={() => setActiveSlug(room.slug)}
              className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${
                room.slug === active?.slug
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-white/20 text-white/60 hover:text-white hover:border-white/40"
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>

        {active && colors && (
          <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: colors.primary }}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{active.name}</h2>
              <span
                className="text-xs font-bold tracking-wide uppercase px-3 py-1.5 rounded-full shrink-0"
                style={{ background: colors.accent, color: colors.primary }}
              >
                {Math.round(active.successRate)}% {t.leaderboard.successRate}
              </span>
            </div>

            {active.entries.length === 0 ? (
              <p className="text-white/50 text-sm p-6">{t.leaderboard.empty}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs uppercase tracking-wide border-b border-white/10">
                    <th className="text-start font-semibold px-6 py-3 w-10">{t.leaderboard.rank}</th>
                    <th className="text-start font-semibold px-3 py-3">{t.leaderboard.group}</th>
                    <th className="text-start font-semibold px-3 py-3">{t.leaderboard.party}</th>
                    <th className="text-end font-semibold px-6 py-3">{t.leaderboard.time}</th>
                  </tr>
                </thead>
                <tbody>
                  {active.entries.map((entry, i) => (
                    <tr key={entry.id} className="border-b border-white/5 last:border-0">
                      <td className="px-6 py-3 font-bold" style={{ color: colors.accent }}>
                        {i + 1}
                      </td>
                      <td className="px-3 py-3 text-white/90">{entry.groupName}</td>
                      <td className="px-3 py-3 text-white/50">{entry.partySize}</td>
                      <td className="px-6 py-3 text-end font-mono font-semibold">
                        {formatTime(entry.timeSpentSec)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
