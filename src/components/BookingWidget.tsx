"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Slot {
  startTime: string;
  endTime: string;
  label: string;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export default function BookingWidget({
  roomId,
  roomSlug,
  colors,
  minPlayers,
  maxPlayers,
  pricePerPerson,
  durationMinutes,
}: {
  roomId: string;
  roomSlug: string;
  colors: ThemeColors;
  minPlayers: number;
  maxPlayers: number;
  pricePerPerson: number;
  durationMinutes: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"date" | "slot" | "details">("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    partySize: minPlayers,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  async function fetchSlots(date: string) {
    setLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/rooms/${roomSlug}/slots?date=${date}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
      setStep("slot");
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email is required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (form.partySize < minPlayers || form.partySize > maxPlayers)
      e.partySize = `Party size must be between ${minPlayers} and ${maxPlayers}.`;
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !selectedSlot) return;

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(`/booking/confirmed?bookingId=${data.id}`);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalPrice = form.partySize * pricePerPerson;

  return (
    <div
      className="rounded-2xl border border-white/10 p-6 md:p-8 space-y-6"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <h2 className="text-xl font-bold text-white">Book This Room</h2>

      {/* Step indicators */}
      <div className="flex gap-2 text-xs font-semibold">
        {(["date", "slot", "details"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={
                step === s
                  ? { background: colors.accent, color: colors.primary }
                  : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }
              }
            >
              {i + 1}
            </span>
            <span
              className={step === s ? "text-white" : "text-white/40"}
            >
              {s === "date" ? "Pick Date" : s === "slot" ? "Pick Time" : "Your Details"}
            </span>
            {i < 2 && <span className="text-white/20 ml-2">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Date */}
      {step === "date" && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-white/70 text-sm block mb-2">Select a date</span>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white focus:outline-none focus:border-white/50"
              aria-label="Booking date"
            />
          </label>
          <button
            disabled={!selectedDate || loading}
            onClick={() => fetchSlots(selectedDate)}
            className="w-full py-3 rounded font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ background: colors.accent, color: colors.primary }}
          >
            {loading ? "Checking availability…" : "See Available Times →"}
          </button>
        </div>
      )}

      {/* Step 2: Slot */}
      {step === "slot" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <button
              onClick={() => setStep("date")}
              className="text-xs text-white/40 hover:text-white/70"
            >
              Change date
            </button>
          </div>

          {slots.length === 0 ? (
            <p className="text-white/50 text-sm py-4 text-center">
              No slots available on this day. Please pick another date.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setStep("details");
                  }}
                  className="py-2 px-3 rounded text-sm font-medium border transition-colors"
                  style={
                    selectedSlot?.startTime === slot.startTime
                      ? { background: colors.accent, color: colors.primary, borderColor: colors.accent }
                      : {
                          background: "transparent",
                          color: "rgba(255,255,255,0.7)",
                          borderColor: "rgba(255,255,255,0.2)",
                        }
                  }
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Details */}
      {step === "details" && selectedSlot && (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="bg-white/5 rounded-lg px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-white/50">Date</span>
              <span className="text-white">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Time</span>
              <span className="text-white">{selectedSlot.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Duration</span>
              <span className="text-white">{durationMinutes} min</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("slot")}
            className="text-xs text-white/40 hover:text-white/70"
          >
            ← Change time
          </button>

          <Field
            label="Full Name"
            error={errors.customerName}
          >
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              placeholder="Jane Smith"
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/50"
              aria-label="Full name"
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jane@example.com"
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/50"
              aria-label="Email address"
            />
          </Field>

          <Field label="Phone" error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/50"
              aria-label="Phone number"
            />
          </Field>

          <Field label={`Party Size (${minPlayers}–${maxPlayers})`} error={errors.partySize}>
            <input
              type="number"
              min={minPlayers}
              max={maxPlayers}
              value={form.partySize}
              onChange={(e) => setForm((f) => ({ ...f, partySize: parseInt(e.target.value) || minPlayers }))}
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-2.5 text-white focus:outline-none focus:border-white/50"
              aria-label="Party size"
            />
          </Field>

          <div className="flex justify-between items-center py-2 border-t border-white/10">
            <span className="text-white/60 text-sm">Total (pay at door)</span>
            <span className="text-xl font-bold" style={{ color: colors.accent }}>
              ${totalPrice.toFixed(2)}
            </span>
          </div>

          {serverError && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded px-4 py-3">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-bold text-sm transition-opacity disabled:opacity-50"
            style={{ background: colors.accent, color: colors.primary }}
          >
            {loading ? "Booking…" : "Confirm Booking"}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-white/70 text-xs font-medium block">{label}</span>
      {children}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </label>
  );
}
