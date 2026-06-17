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
    minPlayers, maxPlayers, pricePerPerson, active,
    seoTitle, seoDescription,
  } = body;

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
      pricePerPerson: Number(pricePerPerson),
      active,
      seoTitle,
      seoDescription,
    },
  });

  return NextResponse.json(room);
}
