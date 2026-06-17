import prisma from "@/lib/prisma";
import BookingActions from "@/components/BookingActions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    room?: string;
    date?: string;
    status?: string;
  }>;
}

export default async function BookingsPage({ searchParams }: Props) {
  const { room, date, status } = await searchParams;

  const rooms = await prisma.room.findMany({ select: { id: true, name: true } });

  const where: Record<string, unknown> = {};
  if (room) where.roomId = room;
  if (status === "confirmed" || status === "cancelled") where.status = status;
  if (date) {
    const [y, m, d] = date.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d);
    const dayEnd = new Date(y, m - 1, d + 1);
    where.startTime = { gte: dayStart, lt: dayEnd };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: { room: true },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Bookings</h1>
        <span className="text-white/50 text-sm">{bookings.length} result(s)</span>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3" method="get">
        <select
          name="room"
          defaultValue={room ?? ""}
          className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">All Rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="date"
          defaultValue={date ?? ""}
          className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          type="submit"
          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded px-4 py-2 text-sm text-white transition-colors"
        >
          Filter
        </button>
        <a
          href="/admin/bookings"
          className="border border-white/10 rounded px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          Reset
        </a>
      </form>

      {bookings.length === 0 ? (
        <p className="text-white/50 py-12 text-center">No bookings match your filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Room</th>
                <th className="text-left px-4 py-3">Date & Time</th>
                <th className="text-left px-4 py-3">Party</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-white/5 hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{b.customerName}</td>
                  <td className="px-4 py-3 text-white/70">{b.room.name}</td>
                  <td className="px-4 py-3 text-white/70">
                    <span className="block">
                      {b.startTime.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-white/40">
                      {b.startTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70">{b.partySize}</td>
                  <td className="px-4 py-3 text-white/50">
                    <span className="block">{b.email}</span>
                    <span className="text-white/30">{b.phone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${
                        b.status === "confirmed"
                          ? "bg-green-900/30 text-green-400 border-green-500/30"
                          : "bg-red-900/30 text-red-400 border-red-500/30"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {b.status === "confirmed" && (
                      <BookingActions bookingId={b.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
