"use client";

import { useState, useTransition } from "react";
import { generateUnifiedSlots, type ScheduleConfig } from "@/lib/slots";

interface Room {
  id: string;
  name: string;
  durationMinutes: number;
}

interface Props {
  initial: ScheduleConfig;
  rooms: Room[];
}

// All half-hour increments across 24 hours (48 options)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => ({
  hour: Math.floor(i / 2),
  minute: i % 2 === 0 ? 0 : 30,
}));

function formatTime(hour: number, minute: number): string {
  const d = new Date(2000, 0, 1, hour, minute, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function totalMinutes(hour: number, minute: number) {
  return hour * 60 + minute;
}

const BREAK_OPTIONS = [
  { value: 0, label: "No break" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
];

export default function ScheduleForm({ initial, rooms }: Props) {
  const [config, setConfig] = useState<ScheduleConfig>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(patch: Partial<ScheduleConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }));
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/schedule", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(config),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Failed to save");
          return;
        }
        setSaved(true);
      } catch {
        setError("Network error");
      }
    });
  }

  const openTotal = totalMinutes(config.openHour, config.openMinute);
  const closeTotal = totalMinutes(config.closeHour, config.closeMinute);
  const isNextDay = closeTotal < openTotal;

  return (
    <div className="space-y-8">
      {/* Operating Hours */}
      <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <h2 className="text-base font-semibold text-white">Operating Hours</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Open time */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 uppercase tracking-widest">
              First slot
            </label>
            <select
              value={`${config.openHour}:${config.openMinute}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                update({ openHour: h, openMinute: m });
              }}
              className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/60"
            >
              {TIME_OPTIONS.map(({ hour, minute }) => (
                <option key={`${hour}:${minute}`} value={`${hour}:${minute}`}>
                  {formatTime(hour, minute)}
                </option>
              ))}
            </select>
          </div>

          {/* Close time */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 uppercase tracking-widest">
              Last slot
            </label>
            <select
              value={`${config.closeHour}:${config.closeMinute}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                update({ closeHour: h, closeMinute: m });
              }}
              className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/60"
            >
              {TIME_OPTIONS.map(({ hour, minute }) => (
                <option key={`${hour}:${minute}`} value={`${hour}:${minute}`}>
                  {formatTime(hour, minute)}
                  {totalMinutes(hour, minute) < openTotal ? " (next day)" : ""}
                </option>
              ))}
            </select>
            {isNextDay && (
              <p className="text-xs text-amber-400/80">
                Wraps to next day — last slot at {formatTime(config.closeHour, config.closeMinute)} the following morning.
              </p>
            )}
          </div>
        </div>

        {/* Break between sessions */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/50 uppercase tracking-widest">
            Break between sessions
          </label>
          <div className="flex flex-wrap gap-2">
            {BREAK_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ breakMinutes: value })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  config.breakMinutes === value
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-black/40 border-white/15 text-white/60 hover:text-white hover:border-white/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/30">
            Gap added after each session for room reset and staff preparation.
          </p>
        </div>
      </section>

      {/* Slot Preview */}
      <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Slot Preview</h2>
        <p className="text-xs text-white/40">
          Generated time slots per room with the current settings.
        </p>

        {rooms.length === 0 ? (
          <p className="text-white/30 text-sm">No active rooms.</p>
        ) : (
          <div className="space-y-5">
            {rooms.map((room) => {
              const slots = generateUnifiedSlots(new Date(2000, 0, 1), room.durationMinutes, config);
              return (
                <div key={room.id} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{room.name}</span>
                    <span className="text-xs text-white/30">
                      {room.durationMinutes} min · {slots.length} slot{slots.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {slots.length === 0 ? (
                    <p className="text-xs text-red-400/70">No slots — adjust open/close times</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {slots.map((s) => (
                        <span
                          key={s.startTime.toISOString()}
                          className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white/60 font-mono"
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>

        {saved && (
          <span className="text-sm text-emerald-400">Saved — applies immediately to new bookings.</span>
        )}
        {error && (
          <span className="text-sm text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}
