"use client";

import { useState } from "react";
import { generateUnifiedSlots, type ScheduleConfig } from "@/lib/slots";
import { parseRoomSchedule } from "@/lib/room-schedule";

interface Room {
  id: string;
  name: string;
  durationMinutes: number;
  openHours: string;
}

interface Props {
  initial: ScheduleConfig;
  rooms: Room[];
}

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

function TimeSelect({
  value,
  onChange,
  referenceTotal,
}: {
  value: { hour: number; minute: number };
  onChange: (h: number, m: number) => void;
  referenceTotal?: number;
}) {
  return (
    <select
      value={`${value.hour}:${value.minute}`}
      onChange={(e) => {
        const [h, m] = e.target.value.split(":").map(Number);
        onChange(h, m);
      }}
      className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/60"
    >
      {TIME_OPTIONS.map(({ hour, minute }) => (
        <option key={`${hour}:${minute}`} value={`${hour}:${minute}`}>
          {formatTime(hour, minute)}
          {referenceTotal !== undefined && totalMinutes(hour, minute) < referenceTotal
            ? " (next day)"
            : ""}
        </option>
      ))}
    </select>
  );
}

// ── Global schedule section ────────────────────────────────────────────────────

type RescheduledInfo = { bookingId: string; customerName: string; roomName: string; originalTime: string; newTime: string };
type UnresolvableInfo = { bookingId: string; customerName: string; roomName: string; originalTime: string };

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Tunis" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Africa/Tunis" });
}

function GlobalScheduleSection({ initial }: { initial: ScheduleConfig; rooms: Room[] }) {
  const [config, setConfig] = useState<ScheduleConfig>(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduled, setRescheduled] = useState<RescheduledInfo[]>([]);
  const [unresolvable, setUnresolvable] = useState<UnresolvableInfo[]>([]);

  function update(patch: Partial<ScheduleConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }));
    setSaved(false);
    setError(null);
    setRescheduled([]);
    setUnresolvable([]);
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    setRescheduled([]);
    setUnresolvable([]);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
      } else {
        setSaved(true);
        setRescheduled(data.rescheduled ?? []);
        setUnresolvable(data.unresolvable ?? []);
      }
    } catch {
      setError("Network error — check console");
    } finally {
      setLoading(false);
    }
  }

  const openTotal = totalMinutes(config.openHour, config.openMinute);
  const closeTotal = totalMinutes(config.closeHour, config.closeMinute);
  const isNextDay = closeTotal < openTotal;

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      <h2 className="text-base font-semibold text-white">Global Schedule</h2>
      <p className="text-xs text-white/40 -mt-4">
        Applies to all rooms unless a room has its own override below.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/50 uppercase tracking-widest">First slot</label>
          <TimeSelect
            value={{ hour: config.openHour, minute: config.openMinute }}
            onChange={(h, m) => update({ openHour: h, openMinute: m })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Last slot</label>
          <TimeSelect
            value={{ hour: config.closeHour, minute: config.closeMinute }}
            onChange={(h, m) => update({ closeHour: h, closeMinute: m })}
            referenceTotal={openTotal}
          />
          {isNextDay && (
            <p className="text-xs text-amber-400/80">
              Wraps to next day — last slot at {formatTime(config.closeHour, config.closeMinute)} the following morning.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Break between sessions</label>
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
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          {loading ? "Saving…" : "Save Global Schedule"}
        </button>
        {saved && rescheduled.length === 0 && unresolvable.length === 0 && (
          <span className="text-sm text-emerald-400">Saved — no bookings affected.</span>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      {/* Auto-rescheduled bookings */}
      {rescheduled.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-400">
            {rescheduled.length} booking{rescheduled.length > 1 ? "s" : ""} auto-rescheduled → now pending reconfirmation
          </p>
          <div className="space-y-1.5">
            {rescheduled.map((r) => (
              <div key={r.bookingId} className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/70">
                <span className="font-medium text-white">{r.customerName}</span>
                <span className="text-white/40">{r.roomName}</span>
                <span>{fmtDate(r.originalTime)} {fmtTime(r.originalTime)}</span>
                <span className="text-amber-400/70">→</span>
                <span className="text-amber-300">{fmtDate(r.newTime)} {fmtTime(r.newTime)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40">Go to Reservations to confirm each booking at its new time.</p>
        </div>
      )}

      {/* Bookings that couldn't be moved */}
      {unresolvable.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-900/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-red-400">
            {unresolvable.length} booking{unresolvable.length > 1 ? "s" : ""} could not be auto-rescheduled — handle manually
          </p>
          <div className="space-y-1.5">
            {unresolvable.map((r) => (
              <div key={r.bookingId} className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/70">
                <span className="font-medium text-white">{r.customerName}</span>
                <span className="text-white/40">{r.roomName}</span>
                <span>{fmtDate(r.originalTime)} {fmtTime(r.originalTime)}</span>
                <span className="text-red-400/60">(all nearest slots taken)</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40">These bookings still exist at their original times. Reschedule or cancel them from Reservations.</p>
        </div>
      )}
    </section>
  );
}

// ── Per-room override card ─────────────────────────────────────────────────────

function RoomScheduleCard({ room, globalSchedule }: { room: Room; globalSchedule: ScheduleConfig }) {
  const existingOverride = parseRoomSchedule(room.openHours);
  const [useCustom, setUseCustom] = useState(existingOverride?.useCustom ?? false);
  const [cfg, setCfg] = useState<ScheduleConfig>(
    existingOverride ?? { ...globalSchedule }
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<ScheduleConfig>) {
    setCfg((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const payload = useCustom
        ? JSON.stringify({ useCustom: true, ...cfg })
        : JSON.stringify({ useCustom: false });
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ openHours: payload }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
      } else {
        setSaved(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const openTotal = totalMinutes(cfg.openHour, cfg.openMinute);
  const previewSlots = useCustom
    ? generateUnifiedSlots(new Date(2000, 0, 1), room.durationMinutes, cfg)
    : generateUnifiedSlots(new Date(2000, 0, 1), room.durationMinutes, globalSchedule);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{room.name}</p>
          <p className="text-xs text-white/40">{room.durationMinutes} min · {previewSlots.length} slot{previewSlots.length !== 1 ? "s" : ""}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-white/50">{useCustom ? "Custom" : "Uses global"}</span>
          <button
            type="button"
            onClick={() => { setUseCustom((v) => !v); setSaved(false); }}
            className={`relative w-10 h-5 rounded-full transition-colors ${useCustom ? "bg-red-600" : "bg-white/20"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useCustom ? "translate-x-5" : ""}`}
            />
          </button>
        </label>
      </div>

      {useCustom && (
        <div className="space-y-4 pt-1 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 uppercase tracking-widest">First slot</label>
              <TimeSelect
                value={{ hour: cfg.openHour, minute: cfg.openMinute }}
                onChange={(h, m) => update({ openHour: h, openMinute: m })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 uppercase tracking-widest">Last slot</label>
              <TimeSelect
                value={{ hour: cfg.closeHour, minute: cfg.closeMinute }}
                onChange={(h, m) => update({ closeHour: h, closeMinute: m })}
                referenceTotal={openTotal}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest">Break</label>
            <div className="flex flex-wrap gap-1.5">
              {BREAK_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ breakMinutes: value })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    cfg.breakMinutes === value
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-black/40 border-white/15 text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Slot preview */}
          <div className="flex flex-wrap gap-1.5">
            {previewSlots.map((s) => (
              <span key={s.startTime.toISOString()} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white/50 font-mono">
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {!useCustom && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/10">
          {previewSlots.map((s) => (
            <span key={s.startTime.toISOString()} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white/40 font-mono">
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-emerald-400">Saved.</span>}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

export default function ScheduleForm({ initial, rooms }: Props) {
  return (
    <div className="space-y-8">
      <GlobalScheduleSection initial={initial} rooms={rooms} />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Per-Room Overrides</h2>
          <p className="text-xs text-white/40 mt-1">
            Toggle a room to give it its own hours, independent of the global schedule.
          </p>
        </div>
        {rooms.length === 0 ? (
          <p className="text-white/30 text-sm">No active rooms.</p>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <RoomScheduleCard key={room.id} room={room} globalSchedule={initial} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
