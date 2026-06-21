import type { Metadata } from "next";
import Link from "next/link";
import MapEmbed from "@/components/MapEmbed";
import { getScheduleConfig } from "@/lib/schedule";
import { DEFAULT_SCHEDULE } from "@/lib/slots";

export const revalidate = 3600; // cache for 1 hour — Vercel serves this from edge

export const metadata: Metadata = {
  title: "Contact — elharba Escape Room",
  description:
    "Find elharba escape room in Manouba. Call or WhatsApp us, get directions, and check our opening hours.",
};

function formatTime(hour: number, minute: number): string {
  const d = new Date(2000, 0, 1, hour, minute, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function ContactPage() {
  const schedule = await getScheduleConfig().catch(() => DEFAULT_SCHEDULE);
  const openStr = formatTime(schedule.openHour, schedule.openMinute);
  const closeStr = formatTime(schedule.closeHour, schedule.closeMinute);

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* Compact header */}
      <section className="pt-24 pb-10 px-4 text-center">
        <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
          Find us
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Contact Us</h1>
        <p className="text-white/50 max-w-sm mx-auto">
          Ready to book or have a question? We&apos;re in Manouba, Tunisia.
        </p>
      </section>

      {/* Map — loading="lazy" defers load until scrolled into view */}
      <section className="max-w-5xl mx-auto px-4 pb-2">
        <MapEmbed />
      </section>

      {/* Location strip */}
      <div className="bg-white/5 border-y border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/30">📍</span>
            <span className="text-white/70">Manouba, Tunisia — free parking on site</span>
          </div>
          <a
            href="https://www.google.com/maps/search/El+Harba+Escape+Room+Manouba+Tunisia"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-5 py-2 rounded transition-colors"
          >
            Get Directions →
          </a>
        </div>
      </div>

      {/* Contact cards */}
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Call */}
          <a
            href="tel:+21628720530"
            className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/25 transition-all p-7 flex flex-col gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-xl">
              📞
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Call us</p>
              <p className="text-white font-bold text-lg">+216 28 720 530</p>
              <p className="text-white/30 text-xs mt-1.5 group-hover:text-white/50 transition-colors">Tap to call →</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/21628720530"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-green-500/30 transition-all p-7 flex flex-col gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-green-900/30 border border-green-500/30 flex items-center justify-center text-xl">
              💬
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">WhatsApp</p>
              <p className="text-white font-bold text-lg">+216 28 720 530</p>
              <p className="text-white/30 text-xs mt-1.5 group-hover:text-green-400 transition-colors">Message us →</p>
            </div>
          </a>

          {/* Hours — live from schedule config */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-7 flex flex-col gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl">
              🕐
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Opening Hours</p>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-white/50">Daily</span>
                <span className="text-white font-semibold">
                  {openStr} – {closeStr}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4">We play in</p>
          <div className="flex justify-center gap-10 text-base font-semibold text-white">
            <span>🇫🇷 Français</span>
            <span>🇬🇧 English</span>
            <span>🇹🇳 العربية</span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to book?</h2>
          <p className="text-white/50 mb-6 text-sm">Choose your room and secure your slot in under two minutes.</p>
          <Link
            href="/rooms"
            className="inline-block bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
          >
            View All Rooms →
          </Link>
        </div>
      </div>
    </div>
  );
}
