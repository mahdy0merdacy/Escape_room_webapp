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
  const defaultDay =
    today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : null;

  const [bookings, setBookings] = useState<Booking[]>(initBookings);
  const [blocked, setBlocked] = useState<BlockedSlot[]>(initBlocked);
  const [selectedDay, setSelectedDay] = useState<number | null>(defaultDay);
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<RescheduleSlot[]>([]);
  const [rescheduleSlotTime, setRescheduleSlotTime] = useState<string | null>(null);
  const [rescheduleFetching, setRescheduleFetching] = useState(false);

  // Calendar grid data
  const bookingsByDay = new Map<number, Booking[]>();
  for (const b of bookings) {
    const day = new Date(b.startTime).getDate();
    if (!bookingsByDay.has(day)) bookingsByDay.set(day, []);
    bookingsByDay.get(day)!.push(b);
  }

  const firstDow = new Date(year, month - 1, 1).getDay();
  const leadingBlanks = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // ── Actions ──────────────────────────────────────────────────────────────

  function setPendingKey(key: string, on: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
  }

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
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      }
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
      if (res.ok) {
        setBlocked((prev) => [...prev, { roomId, slotStart }]);
      }
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
      if (res.ok) {
        setBlocked((prev) =>
          prev.filter((b) => !(b.roomId === roomId && b.slotStart === slotStart))
        );
      }
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
      const res = await fetch(
        `/api/admin/slots?roomId=${roomId}&date=${rescheduleDate}`
      );
      const data = await res.json();
      setRescheduleSlots((data.slots ?? []).filter((s: RescheduleSlot) => s.status === "available"));
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

  function openReschedule(bookingId: string) {
    setRescheduleId(bookingId);
    setRescheduleDate("");
    setRescheduleSlots([]);
    setRescheduleSlotTime(null);
  }

  // ── Day panel ─────────────────────────────────────────────────────────────

  const todayStr = today.toISOString().split("T")[0];

  function DayPanel({ day }: { day: number }) {
    const sessionDate = new Date(year, month - 1, day);

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">
          {sessionDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>

        {rooms.map((room) => {
          const colors = JSON.parse(room.themeColors) as {
            primary: string;
            accent: string;
          };
          const slots = generateUnifiedSlots(sessionDate, room.durationMinutes);

          return (
            <div
              key={room.id}
              className="rounded-2xl border border-white/10 overflow-hidden"
              style={{ background: colors.primary }}
            >
              {/* Room header */}
              <div
                className="px-5 py-3 text-xs font-bold uppercase tracking-widest border-b border-white/10"
                style={{ color: colors.accent, background: colors.accent + "18" }}
              >
                {room.name}
              </div>

              {/* Slot rows */}
              <div className="divide-y divide-white/5">
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
                      <div className="flex items-start gap-3 px-4 py-3">
                        {/* Time */}
                        <span className="text-white/40 text-xs font-mono w-20 shrink-0 pt-1">
                          {slot.label}
                        </span>

                        {/* Status + content */}
                        <div className="flex-1 min-w-0">
                          {booking ? (
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-white font-semibold text-sm truncate">
                                  {booking.customerName}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded border ${
                                    booking.status === "confirmed"
                                      ? "bg-green-900/30 text-green-400 border-green-500/20"
                                      : "bg-red-900/30 text-red-400 border-red-500/20"
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </div>
                              <p className="text-white/40 text-xs">
                                👥 {booking.partySize} · ✉ {booking.email} · 📞 {booking.phone}
                              </p>
                            </div>
                          ) : isBlocked ? (
                            <span className="text-white/30 text-xs font-medium">🔒 Disabled</span>
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
                                className="text-xs px-2.5 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              >
                                {pending.has(`cancel-${booking.id}`) ? "…" : "Cancel"}
                              </button>
                              {booking.status !== "cancelled" && (
                                <button
                                  onClick={() =>
                                    isReschedulingThis
                                      ? setRescheduleId(null)
                                      : openReschedule(booking.id)
                                  }
                                  className="text-xs px-2.5 py-1 rounded border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
                                >
                                  {isReschedulingThis ? "Close" : "Reschedule"}
                                </button>
                              )}
                            </>
                          ) : isBlocked ? (
                            <button
                              onClick={() => unblockSlot(room.id, slotIso)}
                              disabled={pending.has(`unblock-${room.id}-${slotIso}`)}
                              className="text-xs px-2.5 py-1 rounded border border-white/20 text-white/50 hover:bg-white/10 transition-colors disabled:opacity-40"
                            >
                              {pending.has(`unblock-${room.id}-${slotIso}`) ? "…" : "Enable"}
                            </button>
                          ) : (
                            <button
                              onClick={() => blockSlot(room.id, slotIso)}
                              disabled={pending.has(`block-${room.id}-${slotIso}`)}
                              className="text-xs px-2.5 py-1 rounded border border-amber-500/20 text-amber-500/60 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                            >
                              {pending.has(`block-${room.id}-${slotIso}`) ? "…" : "Disable"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reschedule inline form */}
                      {isReschedulingThis && booking && (
                        <div className="px-4 pb-4 ml-23 border-t border-white/5 pt-3 space-y-3">
                          <p className="text-xs text-white/40 uppercase tracking-wider">
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
                                      ? {
                                          background: colors.accent,
                                          color: colors.primary,
                                          borderColor: colors.accent,
                                        }
                                      : {
                                          borderColor: "rgba(255,255,255,0.15)",
                                          color: "rgba(255,255,255,0.6)",
                                        }
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
                              {pending.has(`reschedule-${booking.id}`)
                                ? "Moving…"
                                : "Confirm Reschedule"}
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
        })}
      </div>
    );
  }

  // ── Calendar grid ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
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
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day)
              return (
                <div key={`blank-${i}`} className="h-20 border-t border-r border-white/5 bg-white/[0.02]" />
              );
            const dayBookings = bookingsByDay.get(day) ?? [];
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === day;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-20 border-t border-r border-white/5 p-2 text-left transition-all relative group ${
                  isSelected ? "bg-red-600/20" : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                    isSelected
                      ? "bg-red-500 text-white"
                      : isToday
                      ? "bg-white/15 text-white"
                      : "text-white/60 group-hover:text-white"
                  }`}
                >
                  {day}
                </span>
                {dayBookings.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5 px-0.5">
                    {dayBookings.slice(0, 4).map((b) => {
                      const c = JSON.parse(b.room.themeColors);
                      return (
                        <div
                          key={b.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: c.accent }}
                        />
                      );
                    })}
                    {dayBookings.length > 4 && (
                      <span className="text-white/30 text-[10px] leading-none self-center ml-0.5">
                        +{dayBookings.length - 4}
                      </span>
                    )}
                  </div>
                )}
                {dayBookings.length > 0 && (
                  <span className="absolute bottom-1.5 right-2 text-[11px] text-white/30 font-medium">
                    {dayBookings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay !== null ? (
        <DayPanel day={selectedDay} />
      ) : (
        <p className="text-white/30 text-sm text-center py-6">
          {bookings.length === 0
            ? "No reservations this month"
            : "Click a day to manage its slots"}
        </p>
      )}
    </div>
  );
}
