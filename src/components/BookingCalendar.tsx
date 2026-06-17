"use client";

import { useState } from "react";

type Booking = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  partySize: number;
  startTime: string;
  endTime: string;
  status: string;
  room: { name: string; themeColors: string };
};

interface Props {
  bookings: Booking[];
  year: number;
  month: number;
}

export default function BookingCalendar({ bookings, year, month }: Props) {
  const today = new Date();
  const defaultDay =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : null;
  const [selectedDay, setSelectedDay] = useState<number | null>(defaultDay);

  const bookingsByDay = new Map<number, Booking[]>();
  for (const b of bookings) {
    const day = new Date(b.startTime).getDate();
    if (!bookingsByDay.has(day)) bookingsByDay.set(day, []);
    bookingsByDay.get(day)!.push(b);
  }

  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const leadingBlanks = (firstDow + 6) % 7; // Mon-start
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedBookings = selectedDay
    ? (bookingsByDay.get(selectedDay) ?? []).sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    : [];

  return (
    <div className="space-y-8">
      {/* Calendar grid */}
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
                <div
                  key={`blank-${i}`}
                  className="h-20 border-t border-r border-white/5 bg-white/[0.02]"
                />
              );
            const dayBookings = bookingsByDay.get(day) ?? [];
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === day;
            const isSelected = selectedDay === day;
            const hasBookings = dayBookings.length > 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-20 border-t border-r border-white/5 p-2 text-left transition-all relative group
                  ${isSelected ? "bg-red-600/20 border-red-500/20" : "hover:bg-white/5"}
                `}
              >
                <span
                  className={`text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors
                    ${isSelected ? "bg-red-500 text-white" : isToday ? "bg-white/15 text-white" : "text-white/60 group-hover:text-white"}
                  `}
                >
                  {day}
                </span>
                {hasBookings && (
                  <div className="mt-1 flex flex-wrap gap-0.5 px-0.5">
                    {dayBookings.slice(0, 4).map((b) => {
                      const colors = JSON.parse(b.room.themeColors);
                      return (
                        <div
                          key={b.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: colors.accent }}
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
                {hasBookings && (
                  <span className="absolute bottom-1.5 right-2 text-[11px] text-white/30 font-medium">
                    {dayBookings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay !== null && (
        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-white">
              {new Date(year, month - 1, selectedDay).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <span className="text-white/40 text-sm">
              {selectedBookings.length}{" "}
              {selectedBookings.length === 1 ? "reservation" : "reservations"}
            </span>
          </div>

          {selectedBookings.length === 0 ? (
            <div className="border border-white/10 rounded-xl py-12 text-center text-white/30">
              No reservations on this day
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedBookings.map((b) => {
                const colors = JSON.parse(b.room.themeColors) as {
                  primary: string;
                  accent: string;
                };
                const start = new Date(b.startTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const end = new Date(b.endTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={b.id}
                    className="rounded-xl border border-white/10 overflow-hidden"
                    style={{ background: colors.primary }}
                  >
                    {/* Header strip */}
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ background: colors.accent + "22", borderBottom: `1px solid ${colors.accent}33` }}
                    >
                      <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: colors.accent }}
                      >
                        {b.room.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          b.status === "confirmed"
                            ? "bg-green-900/30 text-green-400 border-green-500/30"
                            : "bg-red-900/30 text-red-400 border-red-500/30"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 space-y-3">
                      <p className="text-white font-bold text-lg leading-tight">{b.customerName}</p>
                      <div className="space-y-2 text-sm">
                        <Row icon="🕐" value={`${start} – ${end}`} />
                        <Row
                          icon="👥"
                          value={`${b.partySize} ${b.partySize === 1 ? "person" : "people"}`}
                        />
                        <Row icon="✉" value={b.email} />
                        <Row icon="📞" value={b.phone} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedDay === null && (
        <p className="text-white/30 text-sm text-center py-6">
          {bookings.length === 0
            ? "No reservations this month"
            : "Click a day to view its reservations"}
        </p>
      )}
    </div>
  );
}

function Row({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 text-white/70">
      <span className="text-white/30 mt-px shrink-0">{icon}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}
