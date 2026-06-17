import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact — elharba Escape Room",
  description:
    "Get in touch with elharba escape room in Manouba. Call or WhatsApp us, find our location, and check our opening hours.",
};

const HOURS = [
  { days: "Monday – Thursday", hours: "2:00 PM – 11:00 PM" },
  { days: "Friday", hours: "12:00 PM – 1:00 AM" },
  { days: "Saturday", hours: "12:00 PM – 1:00 AM" },
  { days: "Sunday", hours: "12:00 PM – 11:00 PM" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-center border-b border-white/5">
        <p className="text-red-500 uppercase tracking-[0.3em] text-xs font-semibold mb-4">
          Get in touch
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">Contact Us</h1>
        <p className="text-white/50 max-w-md mx-auto text-lg">
          Ready to book, have a question, or want to organise a group event? We&apos;re here.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Phone & WhatsApp */}
          <a
            href="tel:+21628720530"
            className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all p-8 flex flex-col gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-2xl">
              📞
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Call us</p>
              <p className="text-white text-2xl font-bold">+216 28 720 530</p>
              <p className="text-white/40 text-sm mt-1 group-hover:text-white/60 transition-colors">
                Tap to call →
              </p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/21628720530"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-green-500/30 transition-all p-8 flex flex-col gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-green-900/30 border border-green-500/30 flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">WhatsApp</p>
              <p className="text-white text-2xl font-bold">+216 28 720 530</p>
              <p className="text-white/40 text-sm mt-1 group-hover:text-green-400 transition-colors">
                Message us on WhatsApp →
              </p>
            </div>
          </a>

          {/* Location */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl">
              📍
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Location</p>
              <p className="text-white text-xl font-bold">Manouba, Tunisia</p>
              <p className="text-white/50 text-sm mt-2 leading-relaxed">
                Easily reachable from Tunis, La Marsa, Ariana, and Bardo by car or public transport.
                Free parking on site.
              </p>
            </div>
          </div>

          {/* Hours */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl">
              🕐
            </div>
            <div className="flex-1">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Opening Hours</p>
              <div className="space-y-2.5">
                {HOURS.map(({ days, hours }) => (
                  <div key={days} className="flex justify-between items-center text-sm">
                    <span className="text-white/60">{days}</span>
                    <span className="text-white font-medium">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3">We speak</p>
          <div className="flex justify-center gap-8 text-2xl font-bold text-white">
            <span>🇫🇷 Français</span>
            <span>🇬🇧 English</span>
            <span>🇹🇳 العربية</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to book?</h2>
          <p className="text-white/50 mb-6">Choose your room and pick a time that works for you.</p>
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
