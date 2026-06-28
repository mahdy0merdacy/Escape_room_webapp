import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import prisma from "@/lib/prisma";
import BookingWidget from "@/components/BookingWidget";
import RoomDescription from "@/components/RoomDescription";
import RoomStats, { RoomGallery, RoomSidebarStatus, RoomStatusBanner } from "@/components/RoomStats";
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
      {roomStatus !== "active" && <RoomStatusBanner roomStatus={roomStatus} />}

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
            <div className="order-2 lg:order-none lg:col-start-1 lg:col-span-2 flex flex-col gap-10">
              <RoomStats
                durationMinutes={room.durationMinutes}
                minPlayers={room.minPlayers}
                maxPlayers={room.maxPlayers}
                difficulty={room.difficulty}
                colors={colors}
              />

              <RoomDescription story={storyI18n} headingFont={headingFont} />

              <RoomGallery roomName={room.name} gallery={gallery} />
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
                  <RoomSidebarStatus roomStatus={roomStatus} colors={colors} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
