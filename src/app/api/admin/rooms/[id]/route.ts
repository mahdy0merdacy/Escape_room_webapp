import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const {
    name, tagline, story, heroImageUrl, galleryImageUrls,
    themeColors, themeFont, difficulty, durationMinutes,
    minPlayers, maxPlayers, roomStatus,
    seoTitle, seoDescription,
  } = body;

  // "hidden" means active:false; all other statuses are active:true
  const active = roomStatus !== "hidden";
  const dbRoomStatus = roomStatus === "hidden" ? "active" : roomStatus;

  const room = await prisma.room.update({
    where: { id },
    data: {
      name,
      tagline,
      story,
      heroImageUrl,
      galleryImageUrls: JSON.stringify(galleryImageUrls ?? []),
      themeColors: JSON.stringify(themeColors),
      themeFont,
      difficulty: Number(difficulty),
      durationMinutes: Number(durationMinutes),
      minPlayers: Number(minPlayers),
      maxPlayers: Number(maxPlayers),
      active,
      roomStatus: dbRoomStatus,
      seoTitle,
      seoDescription,
    },
  });

  return NextResponse.json(room);
}
