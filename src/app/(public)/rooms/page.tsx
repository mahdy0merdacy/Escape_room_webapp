import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Room } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Rooms",
  description:
    "Browse all three elharba escape rooms — horror, retro sci-fi, and crime drama. Book your experience today.",
};

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
          Choose your mission
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Escape Rooms</h1>
        <p className="text-white/60 max-w-lg mx-auto">
          Three worlds. One hour each. All designed to push your limits.
        </p>
      </div>

      <div className="space-y-10">
        {rooms.map((room: Room) => {
          const colors = JSON.parse(room.themeColors) as {
            primary: string;
            secondary: string;
            accent: string;
          };
          return (
            <div
              key={room.slug}
              className="rounded-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row"
              style={{ background: colors.primary }}
            >
              {/* Image */}
              <div
                className="md:w-80 h-64 md:h-auto bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url('${room.heroImageUrl}')` }}
                role="img"
                aria-label={`Hero image for ${room.name} escape room`}
              />

              {/* Info */}
              <div className="flex-1 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span
                      className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                      style={{ background: colors.accent + "22", color: colors.accent }}
                    >
                      Difficulty {room.difficulty}/5
                    </span>
                    <span className="text-xs text-white/40">{room.durationMinutes} min</span>
                    <span className="text-xs text-white/40">
                      {room.minPlayers}–{room.maxPlayers} players
                    </span>
                    {room.roomStatus === "coming_soon" && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-900/40 text-amber-400 border border-amber-500/30">
                        Coming Soon
                      </span>
                    )}
                    {room.roomStatus === "unavailable" && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white/40 border border-white/10">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">{room.name}</h2>
                  <p className="text-white/60 italic mb-4">{room.tagline}</p>
                  <p className="text-white/50 text-sm line-clamp-3">
                    {room.story.split("\n")[0]}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-8 gap-4">
                  <div>
                    <span className="text-2xl font-bold" style={{ color: colors.accent }}>
                      30–40 TND
                    </span>
                    <span className="text-sm font-normal text-white/50 ml-1">/ person</span>
                    <p className="text-xs text-white/30 mt-0.5">based on group size</p>
                  </div>
                  <Link
                    href={`/rooms/${room.slug}`}
                    className="px-6 py-3 rounded font-semibold text-sm transition-opacity hover:opacity-80"
                    style={{ background: colors.accent, color: colors.primary }}
                  >
                    View Room & Book →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
