import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ENTRIES_PER_ROOM = 20;

export async function GET() {
  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      themeColors: true,
      successRate: true,
      leaderboardEntries: {
        orderBy: { timeSpentSec: "asc" },
        take: ENTRIES_PER_ROOM,
        select: {
          id: true,
          groupName: true,
          partySize: true,
          timeSpentSec: true,
          completedAt: true,
        },
      },
    },
  });

  const data = rooms.map((room) => ({
    slug: room.slug,
    name: room.name,
    themeColors: room.themeColors,
    successRate: room.successRate,
    entries: room.leaderboardEntries,
  }));

  return NextResponse.json(
    { rooms: data },
    { headers: { "Cache-Control": "no-store" } }
  );
}
