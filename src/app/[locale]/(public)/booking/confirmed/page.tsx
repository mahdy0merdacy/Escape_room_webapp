import Link from "@/components/LocaleLink";
import prisma from "@/lib/prisma";
import { getTotalPrice, formatTND } from "@/lib/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  description: "Your escape room booking is confirmed.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function ConfirmedPage({ searchParams }: Props) {
  const { bookingId } = await searchParams;
  const booking = bookingId
    ? await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { room: true },
      })
    : null;

  if (!booking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Booking Not Found</h1>
          <Link href="/rooms" className="text-red-400 hover:text-red-300">
            Browse Rooms →
          </Link>
        </div>
      </div>
    );
  }

  const colors = JSON.parse(booking.room.themeColors) as {
    primary: string;
    secondary: string;
    accent: string;
  };

  const tz = "Africa/Tunis";
  const dateStr = booking.startTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz,
  });
  const startStr = booking.startTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
  const endStr = booking.endTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
  const total = formatTND(getTotalPrice(booking.partySize));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Clock icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl"
          style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}
          aria-hidden="true"
        >
          📋
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Request Received!</h1>
          <p className="text-white/60 max-w-sm mx-auto">
            We&rsquo;ll call you at <span className="text-white font-semibold">{booking.phone}</span> shortly to confirm your slot. No payment needed yet.
          </p>
        </div>

        {/* Summary card */}
        <div
          className="rounded-2xl border border-white/10 p-6 text-left space-y-3"
          style={{ background: colors.primary }}
        >
          <div className="flex justify-between items-start">
            <span className="text-white/50 text-sm">Room</span>
            <span className="text-white font-semibold">{booking.room.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">Date</span>
            <span className="text-white">{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">Time</span>
            <span className="text-white">
              {startStr} – {endStr}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">Party</span>
            <span className="text-white">{booking.partySize} people</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-white/50 text-sm">Total due at door</span>
            <span className="font-bold text-lg" style={{ color: colors.accent }}>
              {total}
            </span>
          </div>
          <p className="text-xs text-white/30 text-center pt-2">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/rooms"
            className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded transition-colors"
          >
            Browse More Rooms
          </Link>
          <Link
            href={`/rooms/${booking.room.slug}`}
            className="px-6 py-3 rounded font-semibold transition-opacity hover:opacity-80"
            style={{ background: colors.accent, color: colors.primary }}
          >
            Back to Room
          </Link>
        </div>
      </div>
    </div>
  );
}
