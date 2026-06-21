import prisma from "@/lib/prisma";
import FinanceDashboard from "./FinanceDashboard";

export const dynamic = "force-dynamic";

function weekBounds(): { from: Date; to: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday, to: sunday };
}

export default async function FinancePage() {
  const { from, to } = weekBounds();

  const bookings = await prisma.booking
    .findMany({
      where: { startTime: { gte: from, lte: to } },
      include: { room: { select: { id: true, name: true, themeColors: true } } },
      orderBy: { startTime: "asc" },
    })
    .catch(() => []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-1">Finance</h1>
      <p className="text-white/40 text-sm mb-8">
        Track sessions, confirm payments, and export reports.
      </p>
      <FinanceDashboard initialBookings={JSON.parse(JSON.stringify(bookings))} />
    </div>
  );
}
