import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateLocalizedPath } from "@/lib/revalidate-locales";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const entries = await prisma.leaderboardEntry.findMany({
      include: {
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ roomId: "asc" }, { timeSpentSec: "asc" }],
    });

    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { roomId, groupName, partySize, timeSpentSec } = await request.json() as {
      roomId: string;
      groupName: string;
      partySize: number;
      timeSpentSec: number;
    };

    if (!roomId || !groupName?.trim() || !partySize || !timeSpentSec) {
      return NextResponse.json(
        { error: "Missing required fields: roomId, groupName, partySize, timeSpentSec" },
        { status: 400 }
      );
    }

    if (partySize < 1 || timeSpentSec < 1) {
      return NextResponse.json(
        { error: "Party size and time must be positive numbers" },
        { status: 400 }
      );
    }

    // Verify room exists
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const entry = await prisma.leaderboardEntry.create({
      data: {
        roomId,
        groupName: groupName.trim(),
        partySize,
        timeSpentSec,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Revalidate leaderboard page
    revalidateLocalizedPath("/leaderboard");
    revalidateLocalizedPath("/");

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error creating leaderboard entry:", error);
    return NextResponse.json(
      { error: "Failed to create leaderboard entry" },
      { status: 500 }
    );
  }
}
