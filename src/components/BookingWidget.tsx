"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getPricePerPerson, getTotalPrice, TIERS } from "@/lib/pricing";
import { useT } from "./IntlProvider";

interface Slot {
  startTime: string;
  endTime: string;
  label: string;
  status: "available" | "taken";
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
  durationMinutes,
}: {
  roomId: string;
  roomSlug: string;
  colors: ThemeColors;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
}) {
  const router = useRouter();
  const t = useT();
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

  const ratePerPerson = getPricePerPerson(form.partySize);
  const totalPrice = getTotalPrice(form.partySize);

  const STEPS = [
    { key: "date", label: t.booking.stepDate },
    { key: "slot", label: t.booking.stepTime },
    { key: "details", label: t.booking.stepDetails },
  ] as const;

  return (
    <div
      className="rounded-2xl border border-white/10 p-5 md:p-8 space-y-5"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div>
        <h2 className="text-xl font-bold text-white mb-3">{t.booking.title}</h2>
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
          {TIERS.map((tier) => (
            <div key={tier.label} className="rounded-lg py-2 px-1" style={{ background: "rgba(255,255,255,0.06)" }}>
              <p className="text-white/40 mb-0.5">{tier.label}</p>
              <p className="font-bold text-white">{tier.pricePerPerson} TND</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step indicators — compact on mobile */}
      <div className="flex items-center gap-1 text-xs font-semibold">
        {STEPS.map(({ key, label }, i) => (
          <div key={key} className="flex items-center gap-1 min-w-0">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
              style={
                step === key
                  ? { background: colors.accent, color: colors.primary }
                  : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }
              }
            >
              {i + 1}
            </span>
            <span className={`truncate hidden sm:block ${step === key ? "text-white" : "text-white/40"}`}>
              {label}
            </span>
            <span className={`truncate sm:hidden text-[10px] ${step === key ? "text-white" : "text-white/40"}`}>
              {label}
            </span>
            {i < 2 && <span className="text-white/20 shrink-0">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Date */}
      {step === "date" && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-white/70 text-sm block mb-3">{t.booking.selectDate}</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-lg">
                📅
              </span>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white/10 border-2 border-white/20 rounded-xl pl-11 pr-4 py-4 text-white text-base focus:outline-none focus:border-white/50 transition-colors cursor-pointer"
                style={{ colorScheme: "dark" }}
                aria-label="Booking date"
              />
            </div>
          </label>
          <button
            disabled={!selectedDate || loading}
            onClick={() => fetchSlots(selectedDate)}
            className="w-full py-4 rounded-xl font-bold text-sm transition-opacity disabled:opacity-40 tracking-wide"
            style={{ background: colors.accent, color: colors.primary }}
          >
            {loading ? t.booking.checking : t.booking.seeAvailable}
          </button>
        </div>
      )}

      {/* Step 2: Slot */}
      {step === "slot" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <button onClick={() => setStep("date")} className="text-xs text-white/40 hover:text-white/70">
              {t.booking.changeDate}
            </button>
          </div>

          {slots.length === 0 ? (
            <p className="text-white/50 text-sm py-4 text-center">{t.booking.noSlots}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((slot) => {
                const taken = slot.status === "taken";
                const selected = selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    disabled={taken}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep("details");
                    }}
                    className="py-3 px-2 rounded-lg text-sm font-medium border transition-colors min-h-[48px] flex flex-col items-center justify-center gap-0.5 disabled:cursor-not-allowed"
                    style={
                      taken
                        ? { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.07)" }
                        : selected
                        ? { background: colors.accent, color: colors.primary, borderColor: colors.accent }
                        : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }
                    }
                  >
                    <span>{slot.label}</span>
                    {taken && <span className="text-[10px] uppercase tracking-wider opacity-60">Taken</span>}
                  </button>
                );
              })}
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
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
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
              <span className="text-white/50">{t.booking.duration}</span>
              <span className="text-white">{durationMinutes} min</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("slot")}
            className="text-xs text-white/40 hover:text-white/70"
          >
            {t.booking.changeTime}
          </button>

          <Field label={t.booking.fullName} error={errors.customerName}>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              placeholder="Jane Smith"
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-base"
              aria-label="Full name"
            />
          </Field>

          <Field label={t.booking.email} error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jane@example.com"
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-base"
              aria-label="Email address"
            />
          </Field>

          <Field label={t.booking.phone} error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+216 XX XXX XXX"
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-base"
              aria-label="Phone number"
            />
          </Field>

          <Field label={`${t.booking.partySize} (${minPlayers}–${maxPlayers})`} error={errors.partySize}>
            <input
              type="number"
              min={minPlayers}
              max={maxPlayers}
              value={form.partySize}
              onChange={(e) => setForm((f) => ({ ...f, partySize: parseInt(e.target.value) || minPlayers }))}
              className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white focus:outline-none focus:border-white/50 text-base"
              aria-label="Party size"
            />
          </Field>

          <div className="rounded-lg border border-white/10 px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between text-white/50">
              <span>{t.booking.rate}</span>
              <span>{ratePerPerson} TND × {form.partySize}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-white/10">
              <span className="text-white/60">{t.booking.total}</span>
              <span className="text-xl font-bold" style={{ color: colors.accent }}>
                {totalPrice} TND
              </span>
            </div>
          </div>

          {serverError && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded px-4 py-3">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded font-bold text-sm transition-opacity disabled:opacity-50"
            style={{ background: colors.accent, color: colors.primary }}
          >
            {loading ? t.booking.booking : t.booking.confirm}
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
