"use client";

import Link from "@/components/LocaleLink";
import { useT } from "./IntlProvider";
import { useLeaderboardData, formatTime, type LeaderboardRoom } from "@/lib/useLeaderboardData";

export default function LeaderboardWidget({ initialRooms }: { initialRooms: LeaderboardRoom[] }) {
  const t = useT();
  const rooms = useLeaderboardData(initialRooms) ?? initialRooms;

  if (rooms.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 pt-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
        {t.leaderboard.homeH}
      </h2>
      <p className="text-white/60 text-center mb-14 max-w-xl mx-auto">
        {t.leaderboard.homeSub}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {rooms.map((room) => {
          const colors = JSON.parse(room.themeColors) as {
            primary: string;
            secondary: string;
            accent: string;
          };
          const top5 = room.entries.slice(0, 5);
          return (
            <div
              key={room.slug}
              className="rounded-2xl overflow-hidden border border-white/10 flex flex-col"
              style={{ background: colors.primary }}
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-white">{room.name}</h3>
                <span
                  className="text-xs font-bold tracking-wide uppercase px-2 py-1 rounded-full shrink-0"
                  style={{ background: colors.accent, color: colors.primary }}
                >
                  {Math.round(room.successRate)}% {t.leaderboard.successRate}
                </span>
              </div>
              <div className="p-5 flex-1">
                {top5.length === 0 ? (
                  <p className="text-white/50 text-sm">{t.leaderboard.empty}</p>
                ) : (
                  <ol className="space-y-2">
                    {top5.map((entry, i) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between text-sm text-white/80"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="font-bold shrink-0" style={{ color: colors.accent }}>
                            {i + 1}
                          </span>
                          <span className="truncate">{entry.groupName}</span>
                          <span className="text-white/40 shrink-0">({entry.partySize})</span>
                        </span>
                        <span className="font-mono font-semibold shrink-0">
                          {formatTime(entry.timeSpentSec)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Link href="/leaderboard" className="text-red-500 hover:text-red-400 font-semibold">
          {t.leaderboard.seeFull}
        </Link>
      </div>
    </section>
  );
}
