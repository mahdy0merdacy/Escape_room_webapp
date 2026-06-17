"use client";

import { useState } from "react";
import { generateUnifiedSlots } from "@/lib/slots";

type Booking = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  partySize: number;
  startTime: string;
  endTime: string;
  status: string;
  roomId: string;
  room: { name: string; themeColors: string };
};

type BlockedSlot = { roomId: string; slotStart: string };
type Room = { id: string; name: string; themeColors: string; durationMinutes: number };
type Selection = { day: number; roomId: string };

interface RescheduleSlot {
  startTime: string;
  endTime: string;
  label: string;
  status: string;
}

interface Props {
  bookings: Booking[];
  blockedSlots: BlockedSlot[];
  rooms: Room[];
  year: number;
  month: number;
}

export default function BookingCalendar({
  bookings: initBookings,
  blockedSlots: initBlocked,
  rooms,
  year,
  month,
}: Props) {
  const today = new Date();

  const [bookings, setBookings] = useState<Booking[]>(initBookings);
  const [blocked, setBlocked] = useState<BlockedSlot[]>(initBlocked);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<RescheduleSlot[]>([]);
  const [rescheduleSlotTime, setRescheduleSlotTime] = useState<string | null>(null);
  const [rescheduleFetching, setRescheduleFetching] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function setPendingKey(key: string, on: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function cancelBooking(bookingId: string) {
    const key = `cancel-${bookingId}`;
    if (pending.has(key)) return;
    setPendingKey(key, true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } finally {
      setPendingKey(key, false);
    }
  }

  async function blockSlot(roomId: string, slotStart: string) {
    const key = `block-${roomId}-${slotStart}`;
    if (pending.has(key)) return;
    setPendingKey(key, true);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, slotStart }),
      });
      if (res.ok) setBlocked((prev) => [...prev, { roomId, slotStart }]);
    } finally {
      setPendingKey(key, false);
    }
  }

  async function unblockSlot(roomId: string, slotStart: string) {
    const key = `unblock-${roomId}-${slotStart}`;
    if (pending.has(key)) return;
    setPendingKey(key, true);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, slotStart }),
      });
      if (res.ok)
        setBlocked((prev) =>
          prev.filter((b) => !(b.roomId === roomId && b.slotStart === slotStart))
        );
    } finally {
      setPendingKey(key, false);
    }
  }

  async function fetchRescheduleSlots(roomId: string) {
    if (!rescheduleDate) return;
    setRescheduleFetching(true);
    setRescheduleSlots([]);
    setRescheduleSlotTime(null);
    try {
      const res = await fetch(`/api/admin/slots?roomId=${roomId}&date=${rescheduleDate}`);
      const data = await res.json();
      setRescheduleSlots(
        (data.slots ?? []).filter((s: RescheduleSlot) => s.status === "available")
      );
    } finally {
      setRescheduleFetching(false);
    }
  }

  async function confirmReschedule(bookingId: string) {
    if (!rescheduleSlotTime) return;
    const slot = rescheduleSlots.find((s) => s.startTime === rescheduleSlotTime);
    if (!slot) return;
    const key = `reschedule-${bookingId}`;
    setPendingKey(key, true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStartTime: slot.startTime, newEndTime: slot.endTime }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, startTime: updated.startTime, endTime: updated.endTime }
              : b
          )
        );
        setRescheduleId(null);
        setRescheduleDate("");
        setRescheduleSlots([]);
        setRescheduleSlotTime(null);
      }
    } finally {
      setPendingKey(key, false);
    }
  }

  // ── Calendar grid data ────────────────────────────────────────────────────

  // bookingCount[day][roomId] = count
  const bookingCountByDayRoom = new Map<number, Map<string, number>>();
  for (const b of bookings) {
    const day = new Date(b.startTime).getDate();
    if (!bookingCountByDayRoom.has(day)) bookingCountByDayRoom.set(day, new Map());
    const roomMap = bookingCountByDayRoom.get(day)!;
    roomMap.set(b.roomId, (roomMap.get(b.roomId) ?? 0) + 1);
  }

  const firstDow = new Date(year, month - 1, 1).getDay();
  const leadingBlanks = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().split("T")[0];

  // ── Day panel (single room) ───────────────────────────────────────────────

  function DayPanel({ day, roomId }: { day: number; roomId: string }) {
    const room = rooms.find((r) => r.id === roomId)!;
    if (!room) return null;
    const colors = JSON.parse(room.themeColors) as { primary: string; accent: string };
    const sessionDate = new Date(year, month - 1, day);
    const slots = generateUnifiedSlots(sessionDate, room.durationMinutes);

    return (
      <div className="space-y-4">
        {/* Header: date + room switcher tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">
            {sessionDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {rooms.map((r) => {
              const c = JSON.parse(r.themeColors) as { primary: string; accent: string };
              const isActive = r.id === roomId;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelection({ day, roomId: r.id });
                    setRescheduleId(null);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={
                    isActive
                      ? { background: c.accent, color: c.primary }
                      : { background: c.accent + "22", color: c.accent }
                  }
                >
                  {r.name}
                </button>
              );
            })}
            <button
              onClick={() => setSelection(null)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/40 hover:text-white/70 transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Slot rows */}
        <div
          className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5"
          style={{ background: colors.primary }}
        >
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5">
            <span className="text-white/30 text-[11px] uppercase tracking-widest w-20 shrink-0">Time</span>
            <span className="text-white/30 text-[11px] uppercase tracking-widest flex-1">Status / Details</span>
            <span className="text-white/30 text-[11px] uppercase tracking-widest w-32 text-right">Actions</span>
          </div>

          {slots.map((slot) => {
            const slotIso = slot.startTime.toISOString();
            const booking = bookings.find(
              (b) =>
                b.roomId === room.id &&
                new Date(b.startTime).getTime() === slot.startTime.getTime()
            );
            const isBlocked = blocked.some(
              (b) =>
                b.roomId === room.id &&
                new Date(b.slotStart).getTime() === slot.startTime.getTime()
            );
            const isReschedulingThis = rescheduleId === booking?.id;

            return (
              <div key={slotIso}>
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Time */}
                  <span className="text-white/50 text-xs font-mono w-20 shrink-0">{slot.label}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {booking ? (
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{booking.customerName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${
                              booking.status === "confirmed"
                                ? "bg-green-900/30 text-green-400 border-green-500/20"
                                : "bg-red-900/30 text-red-400 border-red-500/20"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-white/40 text-xs mt-0.5 truncate">
                          👥 {booking.partySize} · ✉ {booking.email} · 📞 {booking.phone}
                        </p>
                      </div>
                    ) : isBlocked ? (
                      <span className="text-white/30 text-xs">🔒 Disabled</span>
                    ) : (
                      <span className="text-white/20 text-xs">Available</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {booking ? (
                      <>
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          disabled={
                            pending.has(`cancel-${booking.id}`) ||
                            booking.status === "cancelled"
                          }
                          className="text-[11px] px-2.5 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          {pending.has(`cancel-${booking.id}`) ? "…" : "Cancel"}
                        </button>
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              isReschedulingThis ? setRescheduleId(null) : setRescheduleId(booking.id)
                            }
                            className="text-[11px] px-2.5 py-1 rounded border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
                          >
                            {isReschedulingThis ? "Close" : "Reschedule"}
                          </button>
                        )}
                      </>
                    ) : isBlocked ? (
                      <button
                        onClick={() => unblockSlot(room.id, slotIso)}
                        disabled={pending.has(`unblock-${room.id}-${slotIso}`)}
                        className="text-[11px] px-2.5 py-1 rounded border border-white/20 text-white/50 hover:bg-white/10 transition-colors disabled:opacity-40"
                      >
                        {pending.has(`unblock-${room.id}-${slotIso}`) ? "…" : "Enable"}
                      </button>
                    ) : (
                      <button
                        onClick={() => blockSlot(room.id, slotIso)}
                        disabled={pending.has(`block-${room.id}-${slotIso}`)}
                        className="text-[11px] px-2.5 py-1 rounded border border-amber-500/20 text-amber-500/70 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                      >
                        {pending.has(`block-${room.id}-${slotIso}`) ? "…" : "Disable"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Reschedule inline form */}
                {isReschedulingThis && booking && (
                  <div
                    className="px-4 pb-4 pt-3 border-t space-y-3"
                    style={{ borderColor: colors.accent + "22", background: colors.accent + "0a" }}
                  >
                    <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
                      Move to a new slot
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        type="date"
                        min={todayStr}
                        value={rescheduleDate}
                        onChange={(e) => {
                          setRescheduleDate(e.target.value);
                          setRescheduleSlots([]);
                          setRescheduleSlotTime(null);
                        }}
                        className="bg-white/10 border border-white/20 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-white/40"
                        style={{ colorScheme: "dark" }}
                      />
                      <button
                        onClick={() => fetchRescheduleSlots(room.id)}
                        disabled={!rescheduleDate || rescheduleFetching}
                        className="text-xs px-3 py-1.5 rounded border border-white/20 text-white/60 hover:bg-white/10 transition-colors disabled:opacity-40"
                      >
                        {rescheduleFetching ? "Loading…" : "Load slots"}
                      </button>
                    </div>

                    {rescheduleSlots.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {rescheduleSlots.map((s) => (
                          <button
                            key={s.startTime}
                            onClick={() => setRescheduleSlotTime(s.startTime)}
                            className="text-xs px-2.5 py-1 rounded border transition-colors"
                            style={
                              rescheduleSlotTime === s.startTime
                                ? { background: colors.accent, color: colors.primary, borderColor: colors.accent }
                                : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }
                            }
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {rescheduleSlots.length === 0 && rescheduleDate && !rescheduleFetching && (
                      <p className="text-xs text-white/30">No available slots on that date.</p>
                    )}

                    {rescheduleSlotTime && (
                      <button
                        onClick={() => confirmReschedule(booking.id)}
                        disabled={pending.has(`reschedule-${booking.id}`)}
                        className="text-xs px-4 py-1.5 rounded font-semibold transition-opacity disabled:opacity-40"
                        style={{ background: colors.accent, color: colors.primary }}
                      >
                        {pending.has(`reschedule-${booking.id}`) ? "Moving…" : "Confirm Reschedule"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Calendar grid ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-semibold text-white/40 uppercase tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day)
              return (
                <div
                  key={`blank-${i}`}
                  className="h-28 border-t border-r border-white/5 bg-white/[0.02]"
                />
              );

            const isToday =
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === day;
            const roomMap = bookingCountByDayRoom.get(day) ?? new Map();

            return (
              <div
                key={day}
                className="h-28 border-t border-r border-white/5 p-2 flex flex-col"
              >
                {/* Day number */}
                <span
                  className={`text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full mb-1.5 self-start ${
                    isToday ? "bg-white/15 text-white" : "text-white/60"
                  }`}
                >
                  {day}
                </span>

                {/* Room buttons — one per room */}
                <div className="flex flex-col gap-1">
                  {rooms.map((room) => {
                    const c = JSON.parse(room.themeColors) as { primary: string; accent: string };
                    const bookingCount = roomMap.get(room.id) ?? 0;
                    const isActive =
                      selection?.day === day && selection?.roomId === room.id;

                    return (
                      <button
                        key={room.id}
                        onClick={() => {
                          if (isActive) {
                            setSelection(null);
                          } else {
                            setSelection({ day, roomId: room.id });
                            setRescheduleId(null);
                          }
                        }}
                        className="w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded transition-all leading-tight truncate"
                        style={
                          isActive
                            ? { background: c.accent, color: c.primary }
                            : bookingCount > 0
                            ? { background: c.accent + "35", color: c.accent }
                            : { background: c.accent + "12", color: c.accent + "99" }
                        }
                        title={room.name}
                      >
                        {bookingCount > 0
                          ? `${room.name.split(" ")[0]} · ${bookingCount}`
                          : room.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day panel */}
      {selection ? (
        <DayPanel day={selection.day} roomId={selection.roomId} />
      ) : (
        <p className="text-white/30 text-sm text-center py-4">
          Click a room on any day to manage its slots
        </p>
      )}
    </div>
  );
}
