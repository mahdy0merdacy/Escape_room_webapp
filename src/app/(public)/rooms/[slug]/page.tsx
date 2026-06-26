import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import prisma from "@/lib/prisma";
import BookingWidget from "@/components/BookingWidget";
import RoomDescription from "@/components/RoomDescription";
import { TIERS } from "@/lib/pricing";
import { parseStory } from "@/lib/story";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = await prisma.room.findUnique({ where: { slug } });
  if (!room) return {};
  return { title: room.seoTitle, description: room.seoDescription };
}

export async function generateStaticParams() {
  const rooms = await prisma.room.findMany({ where: { active: true }, select: { slug: true } });
  return rooms.map((r: { slug: string }) => ({ slug: r.slug }));
}

function DifficultyBar({ level }: { level: number }) {
  return (
    <div className="flex gap-1" aria-label={`Difficulty ${level} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-1.5 w-6 rounded-full"
          style={i <= level ? { background: "var(--room-accent)" } : { background: "rgba(255,255,255,0.15)" }}
        />
      ))}
    </div>
  );
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;
  const room = await prisma.room.findUnique({ where: { slug } });
  // active:false → hidden (404). coming_soon / unavailable → still visible with banner
  if (!room || !room.active) notFound();
  const roomStatus = (room.roomStatus ?? "active") as "active" | "coming_soon" | "unavailable";

  const storyI18n = parseStory(room.story);
  const colors = JSON.parse(room.themeColors) as {
    primary: string;
    secondary: string;
    accent: string;
    heroPosition?: string;
  };
  const heroPos = `center ${colors.heroPosition ?? "50%"}`;
  const gallery: string[] = JSON.parse(room.galleryImageUrls);

  const fontVarMap: Record<string, string> = {
    gothic: "var(--font-gothic)",
    retro: "var(--font-retro)",
    industrial: "var(--font-industrial)",
  };
  const headingFont = fontVarMap[room.themeFont] ?? "var(--font-ui)";

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: room.name,
    description: room.seoDescription,
    url: `${baseUrl}/rooms/${room.slug}`,
    offers: {
      "@type": "Offer",
      price: 30,
      priceCurrency: "TND",
      availability: roomStatus === "active" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
    },
  };

  return (
    <>
      <Script
        id={`ld-room-${room.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Status banners — sticky below the nav */}
      {roomStatus === "coming_soon" && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-900 to-amber-800 border-b border-amber-600/40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-2xl leading-none">🚧</span>
            <div>
              <p className="text-amber-100 font-bold text-sm">Coming Soon</p>
              <p className="text-amber-200/70 text-xs">This room isn&apos;t open for booking yet — check back soon!</p>
            </div>
          </div>
        </div>
      )}
      {roomStatus === "unavailable" && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-2xl leading-none">⛔</span>
            <div>
              <p className="text-white font-bold text-sm">Currently Unavailable</p>
              <p className="text-white/50 text-xs">This room is temporarily closed. We&apos;ll reopen soon.</p>
            </div>
          </div>
        </div>
      )}

      {/* Apply room CSS vars to this subtree */}
      <div
        style={
          {
            "--room-primary": colors.primary,
            "--room-secondary": colors.secondary,
            "--room-accent": colors.accent,
          } as React.CSSProperties
        }
      >
        {/* Hero */}
        <section
          className="relative min-h-[70vh] flex items-end pb-16"
          style={{ background: colors.primary }}
        >
          <div
            className="absolute inset-0 bg-cover opacity-40"
            style={{ backgroundImage: `url('${room.heroImageUrl}')`, backgroundPosition: heroPos }}
            role="img"
            aria-label={`Hero image for ${room.name} escape room`}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, transparent 20%, ${colors.primary} 90%)` }}
          />
          <div className="relative z-10 max-w-6xl mx-auto px-4 w-full">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: colors.accent }}>
              Escape Room Experience
            </p>
            <h1
              className="text-5xl md:text-7xl font-black leading-tight text-white mb-4"
              style={{ fontFamily: headingFont }}
            >
              {room.name}
            </h1>
            <p className="text-lg md:text-xl italic text-white/70 max-w-xl">{room.tagline}</p>
          </div>
        </section>

        {/* Main content */}
        <div style={{ background: colors.primary }}>
          <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: story + gallery — shown below booking widget on mobile */}
            <div className="order-2 lg:order-none lg:col-start-1 lg:col-span-2 space-y-10">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Duration", value: `${room.durationMinutes} min` },
                  { label: "Players", value: `${room.minPlayers}–${room.maxPlayers}` },
                  { label: "Age", value: "16+" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-4 border border-white/10 text-center"
                    style={{ background: colors.secondary }}
                  >
                    <p className="text-white/50 text-xs mb-1">{label}</p>
                    <p className="text-white font-bold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Pricing tiers */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Pricing</p>
                <div className="grid grid-cols-3 gap-3">
                  {TIERS.map((t) => (
                    <div
                      key={t.label}
                      className="rounded-xl p-4 border border-white/10 text-center"
                      style={{ background: colors.secondary }}
                    >
                      <p className="text-white/50 text-xs mb-1">{t.label}</p>
                      <p className="font-bold" style={{ color: "var(--room-accent)" }}>
                        {t.pricePerPerson} TND
                      </p>
                      <p className="text-white/30 text-xs">/ person</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Difficulty</p>
                <DifficultyBar level={room.difficulty} />
              </div>

              <RoomDescription story={storyI18n} headingFont={headingFont} />

              {/* Gallery */}
              {gallery.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Gallery</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {gallery.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-video rounded-xl bg-cover bg-center border border-white/10"
                        style={{ backgroundImage: `url('${url}')` }}
                        role="img"
                        aria-label={`${room.name} gallery image ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: booking widget — shown first on mobile */}
            <div className="order-1 lg:order-none lg:col-start-3 lg:col-span-1">
              <div className="sticky top-24">
                {roomStatus === "active" ? (
                  <BookingWidget
                    roomId={room.id}
                    roomSlug={room.slug}
                    colors={colors}
                    minPlayers={room.minPlayers}
                    maxPlayers={room.maxPlayers}
                    durationMinutes={room.durationMinutes}
                  />
                ) : (
                  <div
                    className="rounded-2xl border border-white/10 p-8 text-center space-y-4"
                    style={{ background: colors.secondary }}
                  >
                    <div className="text-4xl">
                      {roomStatus === "coming_soon" ? "🚧" : "⛔"}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg mb-1">
                        {roomStatus === "coming_soon" ? "Coming Soon" : "Unavailable"}
                      </p>
                      <p className="text-white/50 text-sm">
                        {roomStatus === "coming_soon"
                          ? "Booking for this room will open soon. Check back later!"
                          : "This room is temporarily closed. We'll reopen soon."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
