"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getPricePerPerson, getTotalPrice } from "@/lib/pricing";
import { useT } from "./IntlProvider";

interface Slot {
  startTime: string;
  endTime: string;
  label: string;
  status: "available" | "taken";
}

interface PhoneCountry {
  flagCode: string;
  name: string;
  dial: string;
  digits: number;
  placeholder: string;
}

const PHONE_COUNTRIES: PhoneCountry[] = [
  { flagCode: "tn", name: "Tunisia",      dial: "+216", digits: 8,  placeholder: "XX XXX XXX" },
  { flagCode: "dz", name: "Algeria",      dial: "+213", digits: 9,  placeholder: "XXX XX XX XX" },
  { flagCode: "ma", name: "Morocco",      dial: "+212", digits: 9,  placeholder: "XXX-XXX-XXX" },
  { flagCode: "ly", name: "Libya",        dial: "+218", digits: 9,  placeholder: "XX-XXXXXXX" },
  { flagCode: "fr", name: "France",       dial: "+33",  digits: 9,  placeholder: "X XX XX XX XX" },
  { flagCode: "de", name: "Germany",      dial: "+49",  digits: 10, placeholder: "XXX XXXXXXX" },
  { flagCode: "gb", name: "UK",           dial: "+44",  digits: 10, placeholder: "XXXX XXXXXX" },
  { flagCode: "it", name: "Italy",        dial: "+39",  digits: 10, placeholder: "XXX XXX XXXX" },
  { flagCode: "es", name: "Spain",        dial: "+34",  digits: 9,  placeholder: "XXX XXX XXX" },
  { flagCode: "be", name: "Belgium",      dial: "+32",  digits: 9,  placeholder: "XXX XX XX XX" },
  { flagCode: "nl", name: "Netherlands",  dial: "+31",  digits: 9,  placeholder: "X XX XX XX XX" },
  { flagCode: "ch", name: "Switzerland",  dial: "+41",  digits: 9,  placeholder: "XX XXX XX XX" },
  { flagCode: "sa", name: "Saudi Arabia", dial: "+966", digits: 9,  placeholder: "XX XXX XXXX" },
  { flagCode: "ae", name: "UAE",          dial: "+971", digits: 9,  placeholder: "XX XXX XXXX" },
  { flagCode: "qa", name: "Qatar",        dial: "+974", digits: 8,  placeholder: "XXXX XXXX" },
  { flagCode: "kw", name: "Kuwait",       dial: "+965", digits: 8,  placeholder: "XXXX XXXX" },
  { flagCode: "tr", name: "Turkey",       dial: "+90",  digits: 10, placeholder: "XXX XXX XXXX" },
];

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
  const today = new Date().toISOString().split("T")[0];
  const [step, setStep] = useState<"date" | "slot" | "details">("date");
  const [selectedDate, setSelectedDate] = useState(today);
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
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(PHONE_COUNTRIES[0]);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [allPastToday, setAllPastToday] = useState(false);

  async function fetchSlots(date: string) {
    setLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    setAllPastToday(false);
    try {
      const res = await fetch(`/api/rooms/${roomSlug}/slots?date=${date}`);
      const data = await res.json();
      const now = new Date();
      const all: Slot[] = data.slots ?? [];
      const upcoming = all.filter((s: Slot) => new Date(s.startTime) > now);
      setAllPastToday(all.length > 0 && upcoming.length === 0 && date === today);
      setSlots(upcoming);
      setStep("slot");
    } finally {
      setLoading(false);
    }
  }

  function goTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = d.toISOString().split("T")[0];
    setSelectedDate(tomorrow);
    fetchSlots(tomorrow);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email is required.";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      e.phone = "Phone number is required.";
    } else if (phoneDigits.length < phoneCountry.digits - 1 || phoneDigits.length > phoneCountry.digits + 1) {
      e.phone = `${phoneCountry.name} numbers need ${phoneCountry.digits} digits (you entered ${phoneDigits.length}).`;
    }
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
          phone: `${phoneCountry.dial} ${form.phone.trim()}`,
          locale: typeof window !== "undefined" ? (localStorage.getItem("locale") ?? "en") : "en",
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
      <h2 className="text-xl font-bold text-white">{t.booking.title}</h2>

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
            <div className="flex items-center bg-white/10 border-2 border-white/20 rounded-xl focus-within:border-white/50 transition-colors overflow-hidden">
              <span className="pl-4 text-white/40 text-lg shrink-0 pointer-events-none select-none">📅</span>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 bg-transparent px-3 py-4 text-white text-base focus:outline-none cursor-pointer"
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
            allPastToday ? (
              <div className="py-4 text-center space-y-3">
                <p className="text-white/50 text-sm">{t.booking.noSlotsToday}</p>
                <button
                  onClick={goTomorrow}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                  style={{ background: colors.accent }}
                >
                  {t.booking.tryTomorrow}
                </button>
              </div>
            ) : (
              <p className="text-white/50 text-sm py-4 text-center">{t.booking.noSlots}</p>
            )
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
                    {taken && <span className="text-[10px] uppercase tracking-wider opacity-60">Booked</span>}
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
            {/* Transparent backdrop closes dropdown on outside click */}
            {phoneOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setPhoneOpen(false)} />
            )}
            <div className="relative flex bg-white/10 border border-white/20 rounded overflow-visible focus-within:border-white/50 transition-colors">
              {/* Country selector button */}
              <button
                type="button"
                onClick={() => setPhoneOpen((o) => !o)}
                className="flex items-center gap-1 px-3 border-r border-white/15 text-white/80 hover:text-white text-sm shrink-0 relative z-50"
                aria-label="Select country code"
              >
                <span className={`fi fi-${phoneCountry.flagCode} rounded-sm`} style={{ fontSize: "1rem" }} />
                <span className="font-mono text-xs">{phoneCountry.dial}</span>
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white/30 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 3.5l3 3 3-3" />
                </svg>
              </button>

              {/* Dropdown */}
              {phoneOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl shadow-black/60 overflow-hidden min-w-[200px] max-h-60 overflow-y-auto">
                  {PHONE_COUNTRIES.map((c) => (
                    <button
                      key={c.dial}
                      type="button"
                      onClick={() => { setPhoneCountry(c); setPhoneOpen(false); setForm((f) => ({ ...f, phone: "" })); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                        c.dial === phoneCountry.dial ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <span className={`fi fi-${c.flagCode} rounded-sm`} style={{ fontSize: "1rem" }} />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-white/40 font-mono text-xs">{c.dial}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Number input */}
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder={phoneCountry.placeholder}
                className="flex-1 bg-transparent px-3 py-3 text-white placeholder-white/30 focus:outline-none text-base min-w-0"
                aria-label="Phone number"
              />
            </div>
          </Field>

          <Field label={`${t.booking.partySize} (${minPlayers}–${maxPlayers})`} error={errors.partySize}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, partySize: Math.max(minPlayers, f.partySize - 1) }))}
                disabled={form.partySize <= minPlayers}
                className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 text-white text-xl font-bold flex items-center justify-center transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                aria-label="Decrease party size"
              >
                −
              </button>
              <span className="flex-1 text-center text-white font-semibold text-base">
                {form.partySize} {form.partySize === 1 ? "person" : "people"}
              </span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, partySize: Math.min(maxPlayers, f.partySize + 1) }))}
                disabled={form.partySize >= maxPlayers}
                className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 text-white text-xl font-bold flex items-center justify-center transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                aria-label="Increase party size"
              >
                +
              </button>
            </div>
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
