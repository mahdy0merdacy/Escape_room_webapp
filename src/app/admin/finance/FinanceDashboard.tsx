"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { getTotalPrice, formatTND } from "@/lib/pricing";

// ── Types ────────────────────────────────────────────────────────────────────

type Room = { id: string; name: string; themeColors: string };
type Booking = {
  id: string;
  startTime: string;
  endTime: string;
  customerName: string;
  email: string;
  phone: string;
  partySize: number;
  status: string;
  amountPaid: number | null;
  confirmedPlayed: boolean;
  room: Room;
};
type ViewMode = "week" | "month" | "year" | "custom";
type Bar = { label: string; collected: number; pending: number };

// ── Date helpers ─────────────────────────────────────────────────────────────

function mondayOf(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day));
  r.setHours(0, 0, 0, 0);
  return r;
}
function getRange(mode: ViewMode, ref: Date, customFrom: string, customTo: string) {
  if (mode === "custom") {
    return {
      from: new Date(customFrom + "T00:00:00"),
      to: new Date(customTo + "T23:59:59"),
    };
  }
  if (mode === "week") {
    const from = mondayOf(ref);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  if (mode === "month") {
    const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const to = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }
  // year
  const from = new Date(ref.getFullYear(), 0, 1);
  const to = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { from, to };
}

function shiftRef(mode: ViewMode, ref: Date, dir: -1 | 1): Date {
  const d = new Date(ref);
  if (mode === "week") d.setDate(d.getDate() + dir * 7);
  else if (mode === "month") d.setMonth(d.getMonth() + dir);
  else if (mode === "year") d.setFullYear(d.getFullYear() + dir);
  return d;
}

function rangeLabel(mode: ViewMode, from: Date, to: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (mode === "week") return `${fmt(from)} – ${fmt(to)}`;
  if (mode === "month")
    return from.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  if (mode === "year") return String(from.getFullYear());
  return `${fmt(from)} – ${fmt(to)}`;
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Aggregation ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function aggregate(bookings: Booking[], mode: ViewMode, from: Date, to: Date): Bar[] {
  const live = bookings.filter((b) => b.status !== "cancelled");

  if (mode === "week") {
    return DAY_LABELS.map((label, i) => {
      const day = new Date(from);
      day.setDate(from.getDate() + i);
      const key = day.toDateString();
      const group = live.filter((b) => new Date(b.startTime).toDateString() === key);
      return {
        label,
        collected: group.filter((b) => b.confirmedPlayed).reduce((s, b) => s + (b.amountPaid ?? 0), 0),
        pending: group.filter((b) => !b.confirmedPlayed).reduce((s, b) => s + getTotalPrice(b.partySize), 0),
      };
    });
  }

  if (mode === "year") {
    return MONTH_LABELS.map((label, month) => {
      const group = live.filter((b) => {
        const t = new Date(b.startTime);
        return t.getFullYear() === from.getFullYear() && t.getMonth() === month;
      });
      return {
        label,
        collected: group.filter((b) => b.confirmedPlayed).reduce((s, b) => s + (b.amountPaid ?? 0), 0),
        pending: group.filter((b) => !b.confirmedPlayed).reduce((s, b) => s + getTotalPrice(b.partySize), 0),
      };
    });
  }

  // month (and custom) — group by week
  const bars: Bar[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const wEnd = new Date(cursor);
    wEnd.setDate(cursor.getDate() + 6);
    if (wEnd > to) wEnd.setTime(to.getTime());
    const label = `${cursor.getDate()}–${wEnd.getDate()}`;
    const wCopy = new Date(cursor);
    const wEndCopy = new Date(wEnd);
    const group = live.filter((b) => {
      const t = new Date(b.startTime);
      return t >= wCopy && t <= wEndCopy;
    });
    bars.push({
      label,
      collected: group.filter((b) => b.confirmedPlayed).reduce((s, b) => s + (b.amountPaid ?? 0), 0),
      pending: group.filter((b) => !b.confirmedPlayed).reduce((s, b) => s + getTotalPrice(b.partySize), 0),
    });
    cursor.setDate(cursor.getDate() + 7);
  }
  return bars;
}

// ── SVG bar chart ────────────────────────────────────────────────────────────

function RevenueChart({ bars }: { bars: Bar[] }) {
  const W = 700;
  const H = 160;
  const PAD_L = 48;
  const PAD_R = 8;
  const maxVal = Math.max(...bars.map((b) => b.collected + b.pending), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const slotW = (W - PAD_L - PAD_R) / Math.max(bars.length, 1);
  const barW = Math.min(38, Math.max(8, slotW * 0.55));

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 32}`}
      className="w-full"
      aria-label="Revenue chart"
    >
      {/* Grid lines + y labels */}
      {ticks.map((r) => {
        const y = H - H * r;
        return (
          <g key={r}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="white" strokeOpacity={0.06} />
            {r > 0 && (
              <text x={PAD_L - 6} y={y + 4} textAnchor="end" fill="white" fillOpacity={0.3} fontSize={9}>
                {Math.round(maxVal * r)}
              </text>
            )}
          </g>
        );
      })}

      {/* Bars */}
      {bars.map((bar, i) => {
        const cx = PAD_L + i * slotW + slotW / 2;
        const x = cx - barW / 2;
        const totalH = ((bar.collected + bar.pending) / maxVal) * H;
        const collH = (bar.collected / maxVal) * H;
        return (
          <g key={i}>
            {/* Pending (background) */}
            {totalH > 0 && (
              <rect
                x={x} y={H - totalH} width={barW} height={totalH}
                fill="white" fillOpacity={0.07} rx={3}
              />
            )}
            {/* Collected (foreground) */}
            {collH > 0 && (
              <rect
                x={x} y={H - collH} width={barW} height={collH}
                fill="#e11d48" fillOpacity={0.85} rx={3}
              />
            )}
            {/* X label */}
            <text
              x={cx} y={H + 16}
              textAnchor="middle" fill="white" fillOpacity={0.35} fontSize={9}
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Booking row ──────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  onUpdate,
}: {
  booking: Booking;
  onUpdate: (id: string, patch: Partial<Booking>) => Promise<void>;
}) {
  const expected = getTotalPrice(booking.partySize);
  const [editing, setEditing] = useState(false);
  const [amountInput, setAmountInput] = useState(
    booking.amountPaid !== null ? String(booking.amountPaid) : String(expected)
  );
  const [pending, startTransition] = useTransition();

  const colors = JSON.parse(booking.room.themeColors) as {
    primary: string; accent: string;
  };

  const startTime = new Date(booking.startTime);
  const isCancelled = booking.status === "cancelled";

  function confirmPlayed() {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt < 0) return;
    startTransition(() =>
      onUpdate(booking.id, { confirmedPlayed: true, amountPaid: amt })
    );
    setEditing(false);
  }

  function saveAmount() {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt < 0) return;
    startTransition(() => onUpdate(booking.id, { amountPaid: amt }));
    setEditing(false);
  }

  function unconfirm() {
    startTransition(() => onUpdate(booking.id, { confirmedPlayed: false }));
  }

  return (
    <tr className={`border-b border-white/5 ${isCancelled ? "opacity-40" : ""}`}>
      {/* Date / Time */}
      <td className="py-3 pr-4 whitespace-nowrap">
        <p className="text-white text-sm font-medium">
          {startTime.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </p>
        <p className="text-white/40 text-xs">
          {startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
        </p>
      </td>

      {/* Room */}
      <td className="py-3 pr-4">
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{ background: colors.accent + "22", color: colors.accent }}
        >
          {booking.room.name}
        </span>
      </td>

      {/* Customer */}
      <td className="py-3 pr-4">
        <p className="text-white text-sm truncate max-w-[140px]">{booking.customerName}</p>
        <p className="text-white/40 text-xs">{booking.phone}</p>
      </td>

      {/* Party */}
      <td className="py-3 pr-4 text-center">
        <span className="text-white text-sm font-semibold">{booking.partySize}</span>
        <p className="text-white/30 text-xs">pax</p>
      </td>

      {/* Expected */}
      <td className="py-3 pr-4 text-right">
        <span className="text-white/60 text-sm">{formatTND(expected)}</span>
      </td>

      {/* Paid / confirm */}
      <td className="py-3 pr-4 text-right">
        {isCancelled ? (
          <span className="text-white/20 text-xs">cancelled</span>
        ) : booking.confirmedPlayed ? (
          <div className="flex items-center justify-end gap-2">
            {editing ? (
              <>
                <input
                  type="number"
                  min={0}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white text-right"
                  onKeyDown={(e) => e.key === "Enter" && saveAmount()}
                  autoFocus
                />
                <span className="text-white/40 text-xs">TND</span>
                <button
                  onClick={saveAmount}
                  disabled={pending}
                  className="text-xs text-green-400 hover:text-green-300 font-semibold"
                >
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-xs text-white/30 hover:text-white">✕</button>
              </>
            ) : (
              <>
                <span className="text-green-400 text-sm font-semibold">
                  {formatTND(booking.amountPaid ?? 0)}
                </span>
                <button
                  onClick={() => { setAmountInput(String(booking.amountPaid ?? expected)); setEditing(true); }}
                  className="text-white/25 hover:text-white/60 text-xs transition-colors"
                  title="Edit amount"
                >
                  ✎
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <input
              type="number"
              min={0}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-20 bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white text-right"
              title="Amount to collect"
            />
            <span className="text-white/40 text-xs">TND</span>
          </div>
        )}
      </td>

      {/* Status / action */}
      <td className="py-3 text-right">
        {isCancelled ? null : booking.confirmedPlayed ? (
          <div className="flex items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full font-semibold">
              ✓ Played
            </span>
            <button
              onClick={unconfirm}
              disabled={pending}
              className="text-[10px] text-white/20 hover:text-red-400 transition-colors"
              title="Undo confirmation"
            >
              undo
            </button>
          </div>
        ) : (
          <button
            onClick={confirmPlayed}
            disabled={pending || parseFloat(amountInput) < 0 || isNaN(parseFloat(amountInput))}
            className="text-xs bg-red-700/80 hover:bg-red-600 disabled:opacity-40 text-white px-3 py-1.5 rounded font-semibold transition-colors whitespace-nowrap"
          >
            {pending ? "…" : "✓ Confirm played"}
          </button>
        )}
      </td>
    </tr>
  );
}

// ── XLSX export ──────────────────────────────────────────────────────────────

async function exportXLSX(bookings: Booking[], from: Date, to: Date) {
  const XLSX = await import("xlsx");
  const rows = bookings.map((b) => ({
    Date: new Date(b.startTime).toLocaleDateString("en-GB"),
    Time: new Date(b.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    Room: b.room.name,
    Customer: b.customerName,
    Email: b.email,
    Phone: b.phone,
    "Party Size": b.partySize,
    "Expected (TND)": getTotalPrice(b.partySize),
    "Paid (TND)": b.amountPaid ?? "",
    "Confirmed Played": b.confirmedPlayed ? "Yes" : "No",
    Status: b.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [10, 10, 18, 20, 24, 14, 10, 14, 10, 16, 12].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Finance");
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  XLSX.writeFile(wb, `elharba-finance-${fromStr}–${toStr}.xlsx`);
}

// ── Main dashboard ───────────────────────────────────────────────────────────

export default function FinanceDashboard({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const today = new Date();
  const [mode, setMode] = useState<ViewMode>("week");
  const [refDate, setRefDate] = useState(today);
  const [customFrom, setCustomFrom] = useState(toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(toDateInput(today));
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { from, to } = useMemo(
    () => getRange(mode, refDate, customFrom, customTo),
    [mode, refDate, customFrom, customTo]
  );

  // Fetch bookings whenever range changes (skip on first mount — initial data covers current week)
  const isFirstMount = useMemo(() => ({ current: true }), []);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    setLoading(true);
    fetch(`/api/admin/finance?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((data) => { setBookings(data); setLoading(false); })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.toISOString(), to.toISOString()]);

  async function handleUpdate(id: string, patch: Partial<Booking>) {
    const res = await fetch(`/api/admin/finance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as Booking;
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }

  const bars = useMemo(() => aggregate(bookings, mode, from, to), [bookings, mode, from, to]);

  const live = bookings.filter((b) => b.status !== "cancelled");
  const totalCollected = live.filter((b) => b.confirmedPlayed).reduce((s, b) => s + (b.amountPaid ?? 0), 0);
  const totalExpected = live.filter((b) => !b.confirmedPlayed).reduce((s, b) => s + getTotalPrice(b.partySize), 0);
  const sessionsDone = live.filter((b) => b.confirmedPlayed).length;
  const sessionsPending = live.filter((b) => !b.confirmedPlayed).length;

  return (
    <div className="space-y-8">
      {/* Date range controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {(["week", "month", "year", "custom"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                mode === m
                  ? "bg-red-600 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {mode !== "custom" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefDate((d) => shiftRef(mode, d, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              ‹
            </button>
            <span className="text-white/70 text-sm min-w-[180px] text-center">
              {rangeLabel(mode, from, to)}
            </span>
            <button
              onClick={() => setRefDate((d) => shiftRef(mode, d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              ›
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm"
            />
            <span className="text-white/30">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm"
            />
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Collected",
            value: formatTND(totalCollected),
            sub: `${sessionsDone} session${sessionsDone !== 1 ? "s" : ""} confirmed`,
            accent: "text-green-400",
            border: "border-green-500/20",
          },
          {
            label: "Pending",
            value: formatTND(totalExpected),
            sub: `${sessionsPending} upcoming / unconfirmed`,
            accent: "text-amber-400",
            border: "border-amber-500/20",
          },
          {
            label: "Total Expected",
            value: formatTND(totalCollected + totalExpected),
            sub: "if all sessions play",
            accent: "text-white",
            border: "border-white/10",
          },
          {
            label: "Avg per session",
            value: sessionsDone > 0 ? formatTND(Math.round(totalCollected / sessionsDone)) : "—",
            sub: "based on confirmed",
            accent: "text-white/70",
            border: "border-white/10",
          },
        ].map(({ label, value, sub, accent, border }) => (
          <div
            key={label}
            className={`rounded-xl border ${border} bg-white/[0.03] p-5`}
          >
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{label}</p>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            <p className="text-white/30 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/60 text-sm font-medium">Revenue</p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" /> Collected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-white/15 inline-block" /> Pending
            </span>
          </div>
        </div>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-white/20 text-sm">
            Loading…
          </div>
        ) : (
          <RevenueChart bars={bars} />
        )}
      </div>

      {/* Bookings table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <p className="text-white font-semibold text-sm">
            Sessions{" "}
            <span className="text-white/30 font-normal">({bookings.length})</span>
          </p>
          <button
            onClick={async () => {
              setExporting(true);
              await exportXLSX(bookings, from, to).catch(console.error);
              setExporting(false);
            }}
            disabled={exporting || bookings.length === 0}
            className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white disabled:opacity-40 px-4 py-2 rounded-lg transition-all font-medium"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {exporting ? "Exporting…" : "Export XLSX"}
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">
            No sessions in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Date", "Room", "Customer", "Party", "Expected", "Amount Paid", ""].map((h) => (
                    <th
                      key={h}
                      className={`px-0 pr-4 py-2.5 pl-6 first:pl-6 text-xs font-medium text-white/30 uppercase tracking-widest ${
                        h === "Amount Paid" || h === "" ? "text-right" : "text-left"
                      } ${h === "Party" ? "text-center" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    onUpdate={handleUpdate}
                  />
                ))}
              </tbody>
              <tfoot className="border-t border-white/10">
                <tr>
                  <td colSpan={4} className="pl-6 py-3 text-xs text-white/30">
                    {sessionsDone} confirmed · {sessionsPending} pending
                  </td>
                  <td className="pr-4 py-3 text-right text-xs text-white/40">
                    {formatTND(totalCollected + totalExpected)}
                  </td>
                  <td className="pr-4 py-3 text-right">
                    <span className="text-green-400 text-sm font-bold">{formatTND(totalCollected)}</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
