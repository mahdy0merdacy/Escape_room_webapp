import type { ReactNode } from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTotalPrice, formatTND } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const TUNIS_OFFSET_MS = 60 * 60 * 1000;

export default async function AdminDashboard() {
  const session = await auth();
  const isOwner = session?.user?.role !== "employee";
  const now = new Date();

  const tunisNow = new Date(now.getTime() + TUNIS_OFFSET_MS);
  const y = tunisNow.getUTCFullYear();
  const m = tunisNow.getUTCMonth();
  const d = tunisNow.getUTCDate();

  const todayStart     = new Date(Date.UTC(y, m, d) - TUNIS_OFFSET_MS);
  const todayEnd       = new Date(Date.UTC(y, m, d + 1) - TUNIS_OFFSET_MS);
  const monthStart     = new Date(Date.UTC(y, m, 1) - TUNIS_OFFSET_MS);
  const monthEnd       = new Date(Date.UTC(y, m + 1, 1) - TUNIS_OFFSET_MS);
  const lastMonthStart = new Date(Date.UTC(y, m - 1, 1) - TUNIS_OFFSET_MS);
  const sevenDaysAgo   = new Date(Date.UTC(y, m, d - 6) - TUNIS_OFFSET_MS);
  const notifyWindow   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  type TodayB = Awaited<ReturnType<typeof prisma.booking.findMany<{
    include: { room: { select: { name: true; themeColors: true } } };
  }>>>[number];
  type MonthB = { partySize: number; startTime: Date; room: { name: string; themeColors: string } };
  type NextB  = Awaited<ReturnType<typeof prisma.booking.findFirst<{
    include: { room: { select: { name: true; themeColors: true } } };
  }>>>;

  let todayBookings: TodayB[]         = [];
  let monthBookings: MonthB[]         = [];
  let lastMonthCount                  = 0;
  let last7Raw: { startTime: Date }[] = [];
  let nextBooking: NextB              = null;
  let failedNotifyCount               = 0;
  let cancelledThisMonth              = 0;

  try {
    [
      todayBookings,
      monthBookings,
      lastMonthCount,
      last7Raw,
      nextBooking,
      failedNotifyCount,
      cancelledThisMonth,
    ] = await Promise.all([
      prisma.booking.findMany({
        where: { startTime: { gte: todayStart, lt: todayEnd }, status: { not: "cancelled" } },
        orderBy: { startTime: "asc" },
        include: { room: { select: { name: true, themeColors: true } } },
      }),
      prisma.booking.findMany({
        where: { startTime: { gte: monthStart, lt: monthEnd }, status: { not: "cancelled" } },
        select: { partySize: true, startTime: true, room: { select: { name: true, themeColors: true } } },
      }),
      prisma.booking.count({
        where: { startTime: { gte: lastMonthStart, lt: monthStart }, status: { not: "cancelled" } },
      }),
      prisma.booking.findMany({
        where: { startTime: { gte: sevenDaysAgo, lt: todayEnd }, status: { not: "cancelled" } },
        select: { startTime: true },
      }),
      prisma.booking.findFirst({
        where: { startTime: { gt: now }, status: { not: "cancelled" } },
        orderBy: { startTime: "asc" },
        include: { room: { select: { name: true, themeColors: true } } },
      }),
      prisma.emailLog.count({
        where: { subject: { startsWith: "[FAILED-NOTIFY]" }, sentAt: { gt: notifyWindow } },
      }),
      prisma.booking.count({
        where: { startTime: { gte: monthStart, lt: monthEnd }, status: "cancelled" },
      }),
    ]);
  } catch {
    // Schema migration may be pending — degrade gracefully
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const monthCount   = monthBookings.length;
  const monthRevenue = monthBookings.reduce((s, b) => s + getTotalPrice(b.partySize), 0);
  const avgPartySize = monthCount > 0
    ? monthBookings.reduce((s, b) => s + b.partySize, 0) / monthCount
    : 0;
  const monthGrowth = lastMonthCount > 0
    ? Math.round(((monthCount - lastMonthCount) / lastMonthCount) * 100)
    : null;

  // Last 7 days (one bucket per day)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const ds = new Date(Date.UTC(y, m, d - 6 + i) - TUNIS_OFFSET_MS);
    const de = new Date(Date.UTC(y, m, d - 6 + i + 1) - TUNIS_OFFSET_MS);
    const count = last7Raw.filter(
      b => b.startTime.getTime() >= ds.getTime() && b.startTime.getTime() < de.getTime()
    ).length;
    return {
      label: new Date(Date.UTC(y, m, d - 6 + i)).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      count,
      isToday: i === 6,
    };
  });
  const maxDay = Math.max(...last7Days.map(x => x.count), 1);

  // Room breakdown this month
  const roomMap = new Map<string, { name: string; accent: string; count: number }>();
  for (const b of monthBookings) {
    if (!roomMap.has(b.room.name)) {
      const c = JSON.parse(b.room.themeColors) as { accent: string };
      roomMap.set(b.room.name, { name: b.room.name, accent: c.accent, count: 0 });
    }
    roomMap.get(b.room.name)!.count++;
  }
  const roomBreakdown = [...roomMap.values()].sort((a, b) => b.count - a.count);
  const maxRoom = Math.max(...roomBreakdown.map(r => r.count), 1);

  // Busiest day of week this month
  const dowCount = [0, 0, 0, 0, 0, 0, 0];
  for (const b of monthBookings) {
    dowCount[new Date(b.startTime.getTime() + TUNIS_OFFSET_MS).getUTCDay()]++;
  }
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const busiestDayIdx   = dowCount.indexOf(Math.max(...dowCount));
  const busiestDayCount = dowCount[busiestDayIdx];
  const topRoom         = roomBreakdown[0] ?? null;

  // Labels
  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "Africa/Tunis",
  });
  const monthLabel = now.toLocaleDateString("en-US", {
    month: "long", year: "numeric", timeZone: "Africa/Tunis",
  });

  // Next booking display info
  const nextColors    = nextBooking ? JSON.parse(nextBooking.room.themeColors) as { accent: string } : null;
  const nextTime      = nextBooking
    ? new Date(nextBooking.startTime).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Tunis",
      })
    : null;
  const nextDateLabel = nextBooking
    ? new Date(nextBooking.startTime).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", timeZone: "Africa/Tunis",
      })
    : null;
  const nextIsToday = nextBooking
    ? nextBooking.startTime.getTime() >= todayStart.getTime() &&
      nextBooking.startTime.getTime() < todayEnd.getTime()
    : false;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/bookings"
            className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white px-3 py-2 rounded-lg transition-all font-medium">
            Calendar
          </Link>
          {isOwner && (
            <Link href="/admin/finance"
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white px-3 py-2 rounded-lg transition-all font-medium">
              Finance
            </Link>
          )}
        </div>
      </div>

      {/* ── Alert ── */}
      {failedNotifyCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 px-4 py-3 flex items-start gap-3">
          <span className="text-amber-400 leading-none mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-300">
              {failedNotifyCount} admin notification{failedNotifyCount > 1 ? "s" : ""} failed in the last 7 days
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Check Brevo API key and ADMIN_NOTIFICATION_EMAIL.
            </p>
          </div>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Today" accent="text-white">
          <p className="text-2xl font-bold text-white">{todayBookings.length}</p>
          <p className="text-white/30 text-xs mt-0.5">session{todayBookings.length !== 1 ? "s" : ""}</p>
        </KPI>
        <KPI label={monthLabel}>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">{monthCount}</p>
            {monthGrowth !== null && (
              <span className={`text-xs font-bold ${monthGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
                {monthGrowth >= 0 ? "+" : ""}{monthGrowth}%
              </span>
            )}
          </div>
          <p className="text-white/30 text-xs mt-0.5">vs {lastMonthCount} last month</p>
        </KPI>
        {isOwner ? (
          <KPI label="Revenue">
            <p className="text-2xl font-bold text-green-400">{formatTND(monthRevenue)}</p>
            <p className="text-white/30 text-xs mt-0.5">expected this month</p>
          </KPI>
        ) : (
          <KPI label="Cancelled">
            <p className="text-2xl font-bold text-red-400">{cancelledThisMonth}</p>
            <p className="text-white/30 text-xs mt-0.5">this month</p>
          </KPI>
        )}
        <KPI label="Avg Group">
          <p className="text-2xl font-bold text-white">{avgPartySize > 0 ? avgPartySize.toFixed(1) : "—"}</p>
          <p className="text-white/30 text-xs mt-0.5">pax this month</p>
        </KPI>
      </div>

      {/* ── Today + Next Up (5/3 split on lg) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Today's sessions */}
        <section className="lg:col-span-3">
          <SectionLabel right={<Link href="/admin/bookings" className="text-white/30 hover:text-white/60 transition-colors">Calendar →</Link>}>
            Today&rsquo;s Sessions
          </SectionLabel>
          {todayBookings.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-white/30 text-sm">
              No sessions scheduled today
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              {todayBookings.map((b) => {
                const c = JSON.parse(b.room.themeColors) as { accent: string };
                const time = b.startTime.toLocaleTimeString("en-US", {
                  hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Tunis",
                });
                const isPast = b.endTime < now;
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${isPast ? "opacity-40" : ""}`}
                    style={{ background: c.accent + "0d" }}
                  >
                    <span className="font-mono text-sm font-bold w-[72px] shrink-0 text-white">{time}</span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: c.accent + "22", color: c.accent }}
                    >
                      {b.room.name}
                    </span>
                    <span className="text-white text-sm flex-1 min-w-0 truncate">{b.customerName}</span>
                    <span className="text-white/40 text-xs shrink-0">{b.partySize} pax</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Next up */}
        <section className="lg:col-span-2">
          <SectionLabel>Next Up</SectionLabel>
          {nextBooking && nextColors ? (
            <div
              className="rounded-xl border px-4 py-4"
              style={{ borderColor: nextColors.accent + "40", background: nextColors.accent + "08" }}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: nextColors.accent + "25", color: nextColors.accent }}
                >
                  {nextBooking.room.name}
                </span>
                <span className="text-white/35 text-xs shrink-0">
                  {nextIsToday ? "Today" : nextDateLabel}
                </span>
              </div>
              <p className="text-3xl font-bold text-white tracking-tight mb-1">{nextTime}</p>
              <p className="text-white/60 text-sm truncate">{nextBooking.customerName}</p>
              <div className="flex items-center gap-3 mt-2.5 text-xs text-white/35">
                <span>{nextBooking.partySize} pax</span>
                <a href={`tel:${nextBooking.phone}`} className="hover:text-white transition-colors font-mono">
                  {nextBooking.phone}
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-white/30 text-sm">
              No upcoming sessions
            </div>
          )}
        </section>
      </div>

      {/* ── Last 7 days bar chart ── */}
      <section>
        <SectionLabel>Last 7 Days</SectionLabel>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 pt-4 pb-4">
          <div className="flex items-end gap-1.5 h-16">
            {last7Days.map(({ label, count, isToday }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/35 leading-none tabular-nums">{count > 0 ? count : ""}</span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${count > 0 ? Math.max(6, Math.round((count / maxDay) * 40)) : 2}px`,
                      background: isToday
                        ? "#e11d48"
                        : count > 0
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.05)",
                    }}
                  />
                </div>
                <span className={`text-[10px] leading-none ${isToday ? "text-red-400 font-semibold" : "text-white/30"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Room breakdown + Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Room breakdown */}
        <section>
          <SectionLabel>Rooms This Month</SectionLabel>
          {roomBreakdown.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-6 text-center text-white/30 text-sm">
              No bookings yet this month
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 space-y-4">
              {roomBreakdown.map(({ name, accent, count }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white">{name}</span>
                    <span className="text-xs text-white/40 tabular-nums">{count} session{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.round((count / maxRoom) * 100)}%`, background: accent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Insights */}
        <section>
          <SectionLabel>Insights</SectionLabel>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 space-y-4">
            {monthCount === 0 ? (
              <p className="text-white/30 text-sm py-1">No data yet for {monthLabel}.</p>
            ) : (
              <>
                {monthGrowth !== null && (
                  <Insight
                    icon={monthGrowth >= 0 ? "↑" : "↓"}
                    iconClass={monthGrowth >= 0 ? "text-green-400" : "text-red-400"}
                    title={<><span className={`font-bold ${monthGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>{monthGrowth >= 0 ? "+" : ""}{monthGrowth}%</span> vs last month</>}
                    sub={`${monthCount} sessions vs ${lastMonthCount} last month`}
                  />
                )}
                {topRoom && (
                  <Insight
                    icon="★"
                    iconClass="text-amber-400"
                    title={<><span className="font-semibold text-white">{topRoom.name}</span> is your top room</>}
                    sub={`${topRoom.count} session${topRoom.count !== 1 ? "s" : ""} this month`}
                  />
                )}
                {busiestDayCount > 0 && (
                  <Insight
                    icon="▲"
                    iconClass="text-white/40"
                    title={<><span className="font-semibold text-white">{DAY_NAMES[busiestDayIdx]}</span> is your peak day</>}
                    sub={`${busiestDayCount} session${busiestDayCount !== 1 ? "s" : ""} this month`}
                  />
                )}
                {cancelledThisMonth > 0 && (
                  <Insight
                    icon="✕"
                    iconClass="text-red-400/70"
                    title={<><span className="font-semibold text-red-400">{cancelledThisMonth}</span> cancellation{cancelledThisMonth !== 1 ? "s" : ""} this month</>}
                    sub={
                      monthCount + cancelledThisMonth > 0
                        ? `${Math.round((cancelledThisMonth / (monthCount + cancelledThisMonth)) * 100)}% cancellation rate`
                        : ""
                    }
                  />
                )}
                {avgPartySize > 0 && (
                  <Insight
                    icon="◎"
                    iconClass="text-white/30"
                    title={<>Average group of <span className="font-semibold text-white">{avgPartySize.toFixed(1)} pax</span></>}
                    sub={`across ${monthCount} sessions`}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Quick nav ── */}
      <div className="flex flex-wrap gap-2 pt-1">
        <NavChip href="/admin/bookings" label="📅 Bookings" />
        {isOwner && <NavChip href="/admin/finance" label="📊 Finance" />}
        <NavChip href="/admin/schedule" label="⏰ Schedule" />
        <NavChip href="/admin/rooms" label="🚪 Rooms" />
        <NavChip href="/admin/content" label="✏️ Content" />
        <NavChip href="/admin/leaderboard" label="🏆 Leaderboard" />
        <NavChip href="/admin/community" label="💬 Community" />
      </div>

    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function KPI({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <h2 className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{children}</h2>
      {right && <span className="text-xs">{right}</span>}
    </div>
  );
}

function Insight({ icon, iconClass, title, sub }: {
  icon: string;
  iconClass: string;
  title: ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={`text-xs font-bold leading-none mt-0.5 w-3.5 text-center shrink-0 ${iconClass}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-white/75">{title}</p>
        {sub && <p className="text-xs text-white/35 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function NavChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
    >
      {label}
    </Link>
  );
}
