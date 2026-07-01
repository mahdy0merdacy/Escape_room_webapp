import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTotalPrice, formatTND } from "@/lib/pricing";
import DashboardRecentBookings from "./DashboardRecentBookings";

export const dynamic = "force-dynamic";

const TUNIS_OFFSET_MS = 60 * 60 * 1000;

export default async function AdminDashboard() {
  const session = await auth();
  const isOwner = session?.user?.role !== "employee";
  const now = new Date();

  // Tunis calendar date (UTC+1, no DST)
  const tunisNow = new Date(now.getTime() + TUNIS_OFFSET_MS);
  const y = tunisNow.getUTCFullYear();
  const m = tunisNow.getUTCMonth();
  const d = tunisNow.getUTCDate();

  const todayStart = new Date(Date.UTC(y, m, d) - TUNIS_OFFSET_MS);
  const todayEnd   = new Date(Date.UTC(y, m, d + 1) - TUNIS_OFFSET_MS);
  const monthStart = new Date(Date.UTC(y, m, 1) - TUNIS_OFFSET_MS);
  const monthEnd   = new Date(Date.UTC(y, m + 1, 1) - TUNIS_OFFSET_MS);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  type TodayBooking = Awaited<ReturnType<typeof prisma.booking.findMany<{
    include: { room: { select: { name: true; themeColors: true } } };
  }>>>[number];
  type RecentBooking = Awaited<ReturnType<typeof prisma.booking.findMany<{
    include: { room: { select: { name: true; themeColors: true; minPlayers: true; maxPlayers: true } } };
  }>>>[number];

  let todayBookings: TodayBooking[] = [];
  let monthPartials: { partySize: number }[] = [];
  let recentBookings: RecentBooking[] = [];
  let failedNotifyCount = 0;

  try {
    [todayBookings, monthPartials, recentBookings, failedNotifyCount] = await Promise.all([
      prisma.booking.findMany({
        where: { startTime: { gte: todayStart, lt: todayEnd }, status: { not: "cancelled" } },
        orderBy: { startTime: "asc" },
        include: { room: { select: { name: true, themeColors: true } } },
      }),
      prisma.booking.findMany({
        where: { startTime: { gte: monthStart, lt: monthEnd }, status: { not: "cancelled" } },
        select: { partySize: true },
      }),
      prisma.booking.findMany({
        take: 10,
        where: { status: { not: "cancelled" } },
        orderBy: { createdAt: "desc" },
        include: { room: { select: { name: true, themeColors: true, minPlayers: true, maxPlayers: true } } },
      }),
      prisma.emailLog.count({
        where: { subject: { startsWith: "[FAILED-NOTIFY]" }, sentAt: { gt: sevenDaysAgo } },
      }),
    ]);
  } catch {
    // Schema migration may be pending — degrade gracefully
  }

  const monthCount   = monthPartials.length;
  const monthRevenue = monthPartials.reduce((s, b) => s + getTotalPrice(b.partySize), 0);
  const avgPartySize = monthCount > 0
    ? monthPartials.reduce((s, b) => s + b.partySize, 0) / monthCount
    : 0;

  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "Africa/Tunis",
  });
  const monthLabel = now.toLocaleDateString("en-US", {
    month: "long", year: "numeric", timeZone: "Africa/Tunis",
  });

  const serializedRecent = recentBookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <span className="text-white/30 text-sm">{todayLabel}</span>
      </div>

      {/* Alert */}
      {failedNotifyCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 px-5 py-4 flex items-start gap-3">
          <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-300">
              {failedNotifyCount} admin notification{failedNotifyCount > 1 ? "s" : ""} failed in the last 7 days
            </p>
            <p className="text-xs text-amber-400/70 mt-1">
              Check your Brevo API key and ADMIN_NOTIFICATION_EMAIL env var. Affected bookings are still recorded normally.
            </p>
          </div>
        </div>
      )}

      {/* ── TODAY'S SESSIONS ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Today&rsquo;s Sessions
            {todayBookings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-white/40">
                {todayBookings.length} session{todayBookings.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <Link href="/admin/bookings" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Calendar →
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center text-white/30 text-sm">
            No sessions scheduled today
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {todayBookings.map((b) => {
              const colors = JSON.parse(b.room.themeColors) as { primary: string; accent: string };
              const time = b.startTime.toLocaleTimeString("en-US", {
                hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Tunis",
              });
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-4 px-5 py-4 flex-wrap sm:flex-nowrap"
                  style={{ background: colors.accent + "0d" }}
                >
                  <span className="font-mono text-white font-bold text-sm w-24 shrink-0">{time}</span>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: colors.accent + "22", color: colors.accent }}
                  >
                    {b.room.name}
                  </span>
                  <span className="text-white font-medium flex-1 min-w-0 truncate">{b.customerName}</span>
                  <span className="text-white/50 text-sm shrink-0">👥 {b.partySize}</span>
                  <a
                    href={`tel:${b.phone}`}
                    className="text-white/40 hover:text-white text-sm shrink-0 transition-colors font-mono"
                  >
                    {b.phone}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── KPI CARDS ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Today"
          value={String(todayBookings.length)}
          sub={`session${todayBookings.length !== 1 ? "s" : ""} today`}
        />
        <KPICard
          label={monthLabel}
          value={String(monthCount)}
          sub="total bookings"
        />
        {isOwner && (
          <KPICard
            label="Expected revenue"
            value={formatTND(monthRevenue)}
            sub={monthLabel}
            accent="text-green-400"
          />
        )}
        <KPICard
          label="Avg group size"
          value={avgPartySize > 0 ? avgPartySize.toFixed(1) : "—"}
          sub="this month"
        />
      </section>

      {/* ── QUICK LINKS ── */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/bookings"
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          📅 Booking Calendar
        </Link>
        {isOwner && (
          <>
            <Link
              href="/admin/finance"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              📊 Finance Dashboard
            </Link>
            <Link
              href="/admin/rooms"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              🚪 Manage Rooms
            </Link>
          </>
        )}
      </div>

      {/* ── RECENT BOOKINGS ── */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Bookings</h2>
        <DashboardRecentBookings initialBookings={serializedRecent} />
      </section>
    </div>
  );
}

function KPICard({
  label, value, sub, accent = "text-white",
}: {
  label: string; value: string; sub: string; accent?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      <p className="text-white/30 text-xs mt-1">{sub}</p>
    </div>
  );
}
