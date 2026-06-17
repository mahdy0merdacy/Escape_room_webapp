import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "EscapeZone — Escape Rooms",
  description:
    "Three uniquely themed escape rooms. Horror, 80s Sci-Fi, and Crime Drama. Book your 60-minute adventure in Albuquerque.",
};

export default async function HomePage() {
  const rooms = await prisma.room.findMany({ where: { active: true } });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "EscapeZone",
    description: "Escape room experiences in three themed rooms.",
    url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    "@id": (process.env.NEXTAUTH_URL ?? "http://localhost:3000") + "/#business",
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Escape Rooms",
      itemListElement: rooms.map((r) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: r.name,
          description: r.tagline,
          url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/rooms/${r.slug}`,
        },
      })),
    },
  };

  return (
    <>
      <Script
        id="ld-local-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#090909]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
          aria-hidden="true"
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <p className="text-red-500 uppercase tracking-[0.3em] text-sm font-semibold mb-4">
            Can you escape?
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 text-white">
            Three Rooms.
            <br />
            <span className="text-red-500">One Hour.</span>
            <br />
            No Mercy.
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl mx-auto">
            Step into a world of horror, mystery, and suspense. Our immersive escape rooms are
            designed to challenge, terrify, and thrill.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rooms"
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded text-lg transition-colors tracking-wide"
            >
              Book a Room
            </Link>
            <Link
              href="/rooms"
              className="border border-white/30 hover:border-white/60 text-white px-8 py-4 rounded text-lg transition-colors"
            >
              Explore Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Rooms preview */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
          Choose Your Adventure
        </h2>
        <p className="text-white/60 text-center mb-14 max-w-xl mx-auto">
          Each room is a fully immersive world. Pick your theme, assemble your team, and see if
          you have what it takes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rooms.map((room) => {
            const colors = JSON.parse(room.themeColors) as {
              primary: string;
              secondary: string;
              accent: string;
            };
            return (
              <Link
                key={room.slug}
                href={`/rooms/${room.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:-translate-y-1 duration-300 flex flex-col"
                style={{ background: colors.primary }}
              >
                <div
                  className="h-52 bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${room.heroImageUrl}')` }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom, transparent 40%, ${colors.primary})`,
                    }}
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span
                    className="text-xs font-bold tracking-widest uppercase mb-2"
                    style={{ color: colors.accent }}
                  >
                    {"★".repeat(room.difficulty)} Difficulty {room.difficulty}/5
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2">{room.name}</h3>
                  <p className="text-white/60 text-sm mb-4 flex-1">{room.tagline}</p>
                  <div className="flex items-center justify-between text-sm mt-auto">
                    <span className="text-white/50">
                      {room.minPlayers}–{room.maxPlayers} players
                    </span>
                    <span className="font-semibold" style={{ color: colors.accent }}>
                      ${room.pricePerPerson}/person
                    </span>
                  </div>
                  <div
                    className="mt-4 text-center py-2 rounded text-sm font-semibold group-hover:opacity-90 transition-opacity"
                    style={{ background: colors.accent, color: colors.primary }}
                  >
                    Book Now →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/5 py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12 text-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Choose a Room", desc: "Pick the theme that excites you most." },
              { step: "02", title: "Pick a Slot", desc: "Select a date and available time slot." },
              { step: "03", title: "Book Instantly", desc: "Enter your details — no payment upfront." },
              { step: "04", title: "Show Up & Escape", desc: "Arrive, pay at the door, and beat the clock." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <span className="text-4xl font-black text-red-600 mb-3">{step}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to face your fears?</h2>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          Groups of 2–8. 60 minutes on the clock. The door locks behind you.
        </p>
        <Link
          href="/rooms"
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors inline-block"
        >
          View All Rooms
        </Link>
      </section>
    </>
  );
}
