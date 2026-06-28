"use client";

import { useState } from "react";
import { generateUnifiedSlots, type ScheduleConfig } from "@/lib/slots";

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
type Room = { id: string; name: string; themeColors: string; durationMinutes: number; minPlayers: number; maxPlayers: number };

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
  scheduleConfig: ScheduleConfig;
}

export default function BookingCalendar({
  bookings: initBookings,
  blockedSlots: initBlocked,
  rooms,
  year,
  month,
  scheduleConfig,
}: Props) {
  const today = new Date();
  const defaultDay =
    today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : null;

  const [bookings, setBookings] = useState<Booking[]>(initBookings);
  const [blocked, setBlocked] = useState<BlockedSlot[]>(initBlocked);
  const [selectedDay, setSelectedDay] = useState<number | null>(defaultDay);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<RescheduleSlot[]>([]);
  const [rescheduleSlotTime, setRescheduleSlotTime] = useState<string | null>(null);
  const [rescheduleFetching, setRescheduleFetching] = useState(false);

  // Admin manual booking state — slotKey is `${slotIso}|${roomId}`
  const [newBookingSlot, setNewBookingSlot] = useState<string | null>(null);
  const [newBookingForm, setNewBookingForm] = useState({
    customerName: "", email: "", phone: "", partySize: 1,
  });
  const [newBookingError, setNewBookingError] = useState("");
  const [newBookingLoading, setNewBookingLoading] = useState(false);

  function setPendingKey(key: string, on: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function confirmBooking(bookingId: string) {
    const key = `confirm-${bookingId}`;
    if (pending.has(key)) return;
    setPendingKey(key, true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status } : b))
        );
      }
    } finally {
      setPendingKey(key, false);
    }
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

  async function createBooking(
    room: Room,
    slotKey: string,
    startTime: string,
    endTime: string
  ) {
    setNewBookingLoading(true);
    setNewBookingError("");
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          startTime,
          endTime,
          ...newBookingForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewBookingError(data.error ?? "Failed to create booking");
        return;
      }
      setBookings((prev) => [
        ...prev,
        { ...data, room: { name: room.name, themeColors: room.themeColors } },
      ]);
      setNewBookingSlot(null);
      setNewBookingForm({ customerName: "", email: "", phone: "", partySize: 1 });
    } catch {
      setNewBookingError("Network error — please try again.");
    } finally {
      setNewBookingLoading(false);
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

  // ── Calendar data ─────────────────────────────────────────────────────────

  const bookingsByDay = new Map<number, Booking[]>();
  for (const b of bookings) {
    // Use Tunisia local day so overnight slots (stored as UTC) group correctly
    const day = parseInt(
      new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "Africa/Tunis" })
        .format(new Date(b.startTime))
    );
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

  const todayStr = today.toISOString().split("T")[0];

  // ── Slot panel ────────────────────────────────────────────────────────────

  function BookingCard({ booking, label }: { booking: Booking; label: string }) {
    const colors = JSON.parse(
      rooms.find((r) => r.id === booking.roomId)?.themeColors ?? '{"primary":"#111","accent":"#e11d48"}'
    ) as { primary: string; accent: string };
    const isReschedulingThis = rescheduleId === booking.id;
    return (
      <div>
        <div className="px-5 py-4" style={{ background: colors.accent + "10" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold text-base">{label}</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                booking.status === "confirmed"
                  ? "bg-green-900/40 text-green-400 border-green-500/30"
                  : booking.status === "pending"
                  ? "bg-amber-900/40 text-amber-400 border-amber-500/30"
                  : "bg-red-900/40 text-red-400 border-red-500/30"
              }`}
            >
              {booking.status === "pending" ? "⏳ pending" : booking.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-4">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Customer</p>
              <p className="text-white font-semibold text-base">{booking.customerName}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Group size</p>
              <p className="text-white font-semibold text-base">👥 {booking.partySize} people</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Email</p>
              <p className="text-white/80 text-sm">{booking.email}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Phone</p>
              <p className="text-white/80 text-sm">{booking.phone}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {booking.status === "pending" && (
              <button
                onClick={() => confirmBooking(booking.id)}
                disabled={pending.has(`confirm-${booking.id}`)}
                className="px-4 py-2 rounded-lg bg-green-700/60 hover:bg-green-600/70 border border-green-500/40 text-green-300 text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {pending.has(`confirm-${booking.id}`) ? "Confirming…" : "✓ Confirm"}
              </button>
            )}
            <button
              onClick={() => cancelBooking(booking.id)}
              disabled={pending.has(`cancel-${booking.id}`) || booking.status === "cancelled"}
              className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/15 text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {pending.has(`cancel-${booking.id}`) ? "Cancelling…" : "Cancel"}
            </button>
            {booking.status !== "cancelled" && (
              <button
                onClick={() => isReschedulingThis ? setRescheduleId(null) : setRescheduleId(booking.id)}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 text-sm font-semibold transition-colors"
              >
                {isReschedulingThis ? "Close" : "Reschedule"}
              </button>
            )}
          </div>
        </div>
        {isReschedulingThis && (
          <div className="px-5 py-4 border-t border-white/10 space-y-3 bg-black/20">
            <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Move to a new slot</p>
            <div className="flex gap-2 flex-wrap">
              <input
                type="date"
                min={todayStr}
                value={rescheduleDate}
                onChange={(e) => { setRescheduleDate(e.target.value); setRescheduleSlots([]); setRescheduleSlotTime(null); }}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40"
                style={{ colorScheme: "dark" }}
              />
              <button
                onClick={() => fetchRescheduleSlots(booking.roomId)}
                disabled={!rescheduleDate || rescheduleFetching}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 text-sm transition-colors disabled:opacity-40"
              >
                {rescheduleFetching ? "Loading…" : "Load slots"}
              </button>
            </div>
            {rescheduleSlots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {rescheduleSlots.map((s) => (
                  <button
                    key={s.startTime}
                    onClick={() => setRescheduleSlotTime(s.startTime)}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
                    style={
                      rescheduleSlotTime === s.startTime
                        ? { background: colors.accent, color: colors.primary, borderColor: colors.accent }
                        : { borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {rescheduleSlots.length === 0 && rescheduleDate && !rescheduleFetching && (
              <p className="text-sm text-white/30">No available slots on that date.</p>
            )}
            {rescheduleSlotTime && (
              <button
                onClick={() => confirmReschedule(booking.id)}
                disabled={pending.has(`reschedule-${booking.id}`)}
                className="px-5 py-2 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-40"
                style={{ background: colors.accent, color: colors.primary }}
              >
                {pending.has(`reschedule-${booking.id}`) ? "Moving…" : "Confirm Reschedule"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  function SlotPanel({ day, roomId }: { day: number; roomId: string }) {
    const room = rooms.find((r) => r.id === roomId)!;
    if (!room) return null;
    const colors = JSON.parse(room.themeColors) as { primary: string; accent: string };
    const sessionDate = new Date(year, month - 1, day);
    const slots = generateUnifiedSlots(sessionDate, room.durationMinutes, scheduleConfig);

    // Bookings that don't fall on any current slot (schedule changed after they were booked)
    const slotTimes = new Set(slots.map((s) => s.startTime.getTime()));
    const orphanedBookings = (bookingsByDay.get(day) ?? []).filter(
      (b) => b.roomId === room.id && !slotTimes.has(new Date(b.startTime).getTime())
    );

    return (
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: colors.primary }}>
        {/* Room header bar */}
        <div
          className="px-5 py-3 flex items-center justify-between border-b border-white/10"
          style={{ background: colors.accent + "18" }}
        >
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.accent }}>
            {room.name}
          </span>
          <span className="text-white/40 text-xs">
            {sessionDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {/* Bookings made under a previous schedule — always visible */}
          {orphanedBookings.map((booking) => {
            const label = new Date(booking.startTime).toLocaleTimeString("en-US", {
              hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Tunis",
            });
            return <BookingCard key={booking.id} booking={booking} label={label} />;
          })}

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

            // ── Booked slot — prominent card ────────────────────────────────
            if (booking) {
              return <BookingCard key={slotIso} booking={booking} label={slot.label} />;
            }

            // ── Blocked / available — compact row ───────────────────────────
            const slotKey = `${slotIso}|${room.id}`;
            const isBookingThis = newBookingSlot === slotKey;
            return (
              <div key={slotIso}>
                <div className="flex items-center gap-3 px-5 py-2.5">
                  <span className="text-white/35 text-sm font-mono w-24 shrink-0">{slot.label}</span>
                  <span className="flex-1 text-sm text-white/20">
                    {isBlocked ? "🔒 Disabled" : "—"}
                  </span>
                  {isBlocked ? (
                    <button
                      onClick={() => unblockSlot(room.id, slotIso)}
                      disabled={pending.has(`unblock-${room.id}-${slotIso}`)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/50 hover:bg-white/10 transition-colors disabled:opacity-40"
                    >
                      {pending.has(`unblock-${room.id}-${slotIso}`) ? "…" : "Enable"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          const next = isBookingThis ? null : slotKey;
                          setNewBookingSlot(next);
                          if (next) {
                            setNewBookingForm({ customerName: "", email: "", phone: "", partySize: room.minPlayers });
                            setNewBookingError("");
                          }
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={
                          isBookingThis
                            ? { borderColor: colors.accent, background: colors.accent + "22", color: colors.accent }
                            : { borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }
                        }
                      >
                        {isBookingThis ? "Close" : "📞 Book"}
                      </button>
                      <button
                        onClick={() => blockSlot(room.id, slotIso)}
                        disabled={pending.has(`block-${room.id}-${slotIso}`)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/20 text-amber-500/60 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                      >
                        {pending.has(`block-${room.id}-${slotIso}`) ? "…" : "Disable"}
                      </button>
                    </>
                  )}
                </div>

                {/* Inline admin booking form */}
                {isBookingThis && (
                  <div className="px-5 py-4 border-t border-white/10 bg-black/20 space-y-3">
                    <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">
                      Book this slot — {slot.label}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-white/40">Customer name</label>
                        <input
                          type="text"
                          value={newBookingForm.customerName}
                          onChange={(e) => setNewBookingForm((f) => ({ ...f, customerName: e.target.value }))}
                          placeholder="Jane Smith"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-white/40">Email</label>
                        <input
                          type="email"
                          value={newBookingForm.email}
                          onChange={(e) => setNewBookingForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="jane@example.com"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-white/40">Phone</label>
                        <input
                          type="tel"
                          value={newBookingForm.phone}
                          onChange={(e) => setNewBookingForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+216 XX XXX XXX"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-white/40">
                          Party size ({room.minPlayers}–{room.maxPlayers})
                        </label>
                        <input
                          type="number"
                          min={room.minPlayers}
                          max={room.maxPlayers}
                          value={newBookingForm.partySize}
                          onChange={(e) => setNewBookingForm((f) => ({ ...f, partySize: Number(e.target.value) }))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50"
                        />
                      </div>
                    </div>
                    {newBookingError && (
                      <p className="text-xs text-red-400">{newBookingError}</p>
                    )}
                    <button
                      onClick={() => createBooking(room, slotKey, slotIso, slot.endTime.toISOString())}
                      disabled={
                        newBookingLoading ||
                        !newBookingForm.customerName.trim() ||
                        !newBookingForm.email.trim() ||
                        !newBookingForm.phone.trim()
                      }
                      className="px-5 py-2 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-40"
                      style={{ background: colors.accent, color: colors.primary }}
                    >
                      {newBookingLoading ? "Creating…" : "Confirm Booking"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Calendar grid */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10">
          {[["M","Mon"],["T","Tue"],["W","Wed"],["T","Thu"],["F","Fri"],["S","Sat"],["S","Sun"]].map(([short, full]) => (
            <div key={full} className="py-2 sm:py-3 text-center text-xs font-semibold text-white/40 uppercase tracking-widest">
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{full}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day)
              return (
                <div key={`blank-${i}`} className="h-12 sm:h-20 border-t border-r border-white/5 bg-white/[0.02]" />
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
                onClick={() => {
                  if (isSelected) {
                    setSelectedDay(null);
                    setSelectedRoomId(null);
                  } else {
                    setSelectedDay(day);
                    setRescheduleId(null);
                    setNewBookingSlot(null);
                    // Auto-select the room with the most bookings on this day
                    const dayBkgs = bookingsByDay.get(day) ?? [];
                    if (dayBkgs.length > 0) {
                      const countByRoom = new Map<string, number>();
                      for (const b of dayBkgs) countByRoom.set(b.roomId, (countByRoom.get(b.roomId) ?? 0) + 1);
                      const topRoom = rooms.reduce((best, r) =>
                        (countByRoom.get(r.id) ?? 0) > (countByRoom.get(best.id) ?? 0) ? r : best
                      );
                      setSelectedRoomId(topRoom.id);
                    } else {
                      setSelectedRoomId(rooms[0]?.id ?? null);
                    }
                  }
                }}
                className={`h-12 sm:h-20 border-t border-r border-white/5 p-1.5 sm:p-2 text-left transition-all relative group ${
                  isSelected ? "bg-red-600/20" : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`text-xs sm:text-sm font-bold inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-colors ${
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
                        <div key={b.id} className="h-1.5 w-1.5 rounded-full" style={{ background: c.accent }} />
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

      {/* Day detail */}
      {selectedDay !== null && (
        <div className="space-y-5">
          {/* Date heading + room picker */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">
              {new Date(year, month - 1, selectedDay).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <div className="flex gap-2 flex-wrap">
              {rooms.map((room) => {
                const c = JSON.parse(room.themeColors) as { primary: string; accent: string };
                const isActive = selectedRoomId === room.id;
                const roomCount = (bookingsByDay.get(selectedDay) ?? []).filter(
                  (b) => b.roomId === room.id
                ).length;
                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      setSelectedRoomId(isActive ? null : room.id);
                      setRescheduleId(null);
                      setNewBookingSlot(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    style={
                      isActive
                        ? { background: c.accent, color: c.primary }
                        : { background: c.accent + "22", color: c.accent }
                    }
                  >
                    {room.name}
                    {roomCount > 0 && (
                      <span
                        className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                        style={
                          isActive
                            ? { background: "rgba(0,0,0,0.25)", color: c.primary }
                            : { background: c.accent, color: c.primary }
                        }
                      >
                        {roomCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRoomId ? (
            <SlotPanel day={selectedDay} roomId={selectedRoomId} />
          ) : (
            <p className="text-white/30 text-sm text-center py-6 border border-white/5 rounded-2xl">
              Select a room above to view its slots
            </p>
          )}
        </div>
      )}

      {selectedDay === null && (
        <p className="text-white/30 text-sm text-center py-6">
          {bookings.length === 0 ? "No reservations this month" : "Click a day to manage its slots"}
        </p>
      )}
    </div>
  );
}
