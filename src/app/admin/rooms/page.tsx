import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-900/30 text-green-400 border-green-500/30",
  coming_soon: "bg-amber-900/30 text-amber-400 border-amber-500/30",
  unavailable: "bg-red-900/30 text-red-400 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  coming_soon: "Coming Soon",
  unavailable: "Unavailable",
};

export default async function AdminRoomsPage() {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Rooms</h1>
        <Link
          href="/admin/rooms/new"
          className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded font-semibold text-sm transition-colors"
        >
          + New Room
        </Link>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const colors = JSON.parse(room.themeColors) as {
            primary: string;
            secondary: string;
            accent: string;
          };
          const status = !room.active ? "hidden" : (room.roomStatus ?? "active");
          const statusCls = STATUS_STYLES[status] ?? "bg-white/10 text-white/40 border-white/10";
          const statusLabel = !room.active ? "Hidden" : (STATUS_LABELS[status] ?? status);

          return (
            <div
              key={room.id}
              className="rounded-xl border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ background: colors.primary }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-lg font-bold text-white">{room.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded border ${statusCls}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="text-white/50 text-sm">{room.tagline}</p>
                <p className="text-white/30 text-xs mt-1">
                  /{room.slug} · {room.durationMinutes} min · 30–40 TND/person ·{" "}
                  {room.minPlayers}–{room.maxPlayers} players
                </p>
              </div>
              <Link
                href={`/admin/rooms/${room.id}`}
                className="px-4 py-2 rounded text-sm font-semibold border border-white/20 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Edit Room
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
