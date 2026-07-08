import prisma from "@/lib/prisma";
import type { Room } from "@prisma/client";
import type { Metadata } from "next";
import RoomsGrid from "@/components/RoomsGrid";

export const metadata: Metadata = {
  title: "Escape Rooms in Tunis, Tunisia",
  description:
    "Browse all three elharba escape rooms in Manouba, Tunisia — horror, retro sci-fi, and crime drama. Book your experience today.",
  alternates: { canonical: "/rooms" },
  openGraph: { url: "/rooms" },
};

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({ where: { active: true }, orderBy: { order: "asc" } });

  const roomData = rooms.map((room: Room) => ({
    slug: room.slug,
    name: room.name,
    tagline: room.tagline,
    story: room.story,
    heroImageUrl: room.heroImageUrl,
    themeColors: room.themeColors,
    durationMinutes: room.durationMinutes,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    difficulty: room.difficulty,
    roomStatus: room.roomStatus,
  }));

  return <RoomsGrid rooms={roomData} />;
}
