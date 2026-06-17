import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [roomCount, bookingCount, recentBookings] = await Promise.all([
    prisma.room.count(),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { room: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Active Rooms" value={roomCount} />
        <StatCard label="Confirmed Bookings" value={bookingCount} />
        <StatCard label="Today" value={new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} />
      </div>

      {/* Quick links */}
      <div className="flex gap-4">
        <Link
          href="/admin/rooms/new"
          className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded font-semibold text-sm transition-colors"
        >
          + New Room
        </Link>
        <Link
          href="/admin/bookings"
          className="border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded text-sm transition-colors"
        >
          View All Bookings
        </Link>
      </div>

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Room</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white">{b.customerName}</td>
                    <td className="px-4 py-3 text-white/70">{b.room.name}</td>
                    <td className="px-4 py-3 text-white/70">
                      {b.startTime.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "confirmed"
      ? "bg-green-900/30 text-green-400 border-green-500/30"
      : "bg-red-900/30 text-red-400 border-red-500/30";
  return (
    <span className={`text-xs px-2 py-1 rounded border ${colors}`}>
      {status}
    </span>
  );
}
