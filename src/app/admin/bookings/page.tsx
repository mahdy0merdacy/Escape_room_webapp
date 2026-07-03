import prisma from "@/lib/prisma";
import { getScheduleConfig } from "@/lib/schedule";
import BookingCalendar from "@/components/BookingCalendar";
import AdjacencyToggle from "./AdjacencyToggle";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function BookingsPage({ searchParams }: Props) {
  const { month: monthParam } = await searchParams;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  }

  const schedule = await getScheduleConfig();
  // Use UTC arithmetic anchored to Africa/Tunis (UTC+1) so midnight Tunisia is the boundary,
  // not midnight UTC (which is 1am Tunisia and would miss the first hour of each month).
  const TUNIS_OFFSET_MS = 60 * 60 * 1000;
  const monthStart = new Date(Date.UTC(year, month - 1, 1) - TUNIS_OFFSET_MS);
  // Extend into the next month to catch overnight slots that start on the last night
  const closeBuffer = schedule.closeHour < schedule.openHour ? schedule.closeHour + 2 : 2;
  const monthEnd = new Date(Date.UTC(year, month, 1) - TUNIS_OFFSET_MS + closeBuffer * 60 * 60 * 1000);

  const [bookingsRaw, blockedSlots, rooms, adjacencySetting] = await Promise.all([
    prisma.booking.findMany({
      where: { startTime: { gte: monthStart, lt: monthEnd }, status: { not: "cancelled" } },
      orderBy: { startTime: "asc" },
      include: { room: { select: { name: true, themeColors: true } } },
    }).catch(() => []),
    prisma.blockedSlot.findMany({
      where: { slotStart: { gte: monthStart, lt: monthEnd } },
      select: { roomId: true, slotStart: true },
    }).catch(() => []),
    prisma.room.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, themeColors: true, durationMinutes: true, minPlayers: true, maxPlayers: true },
      orderBy: { order: "asc" },
    }),
    prisma.siteSettings.findUnique({ where: { key: "adjacencyBlocking" } }).catch(() => null),
  ]);
  const bookings = bookingsRaw;

  const serializedBookings = bookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    createdAt: b.createdAt.toISOString(),
  }));

  const serializedBlocked = blockedSlots.map((b) => ({
    roomId: b.roomId,
    slotStart: b.slotStart.toISOString(),
  }));

  const pad = (n: number) => String(n).padStart(2, "0");
  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white">Reservations</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <AdjacencyToggle initialEnabled={adjacencySetting?.value === "true"} />
          <div className="flex items-center gap-2">
          <Link
            href={`/admin/bookings?month=${prevMonth}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            ←
          </Link>
          <span className="text-white font-semibold px-3 min-w-[160px] text-center">{monthLabel}</span>
          <Link
            href={`/admin/bookings?month=${nextMonth}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            →
          </Link>
          </div>
        </div>
      </div>

      <BookingCalendar
        key={`${year}-${month}`}
        bookings={serializedBookings}
        blockedSlots={serializedBlocked}
        rooms={rooms}
        year={year}
        month={month}
        scheduleConfig={schedule}
        adjacencyEnabled={adjacencySetting?.value === "true"}
      />
    </div>
  );
}
