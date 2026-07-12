import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    slug, name, tagline, story, heroImageUrl, trailerUrl, galleryImageUrls,
    themeColors, themeFont, difficulty, durationMinutes,
    minPlayers, maxPlayers, roomStatus,
    seoTitle, seoDescription, openHours,
  } = body;

  const active = roomStatus !== "hidden";
  const dbRoomStatus = roomStatus === "hidden" ? "active" : (roomStatus ?? "active");

  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
  }

  const defaultOpenHours = {
    mon: { start: "14:00", end: "22:00" },
    tue: { start: "14:00", end: "22:00" },
    wed: { start: "14:00", end: "22:00" },
    thu: { start: "14:00", end: "22:00" },
    fri: { start: "12:00", end: "23:00" },
    sat: { start: "10:00", end: "23:00" },
    sun: { start: "10:00", end: "20:00" },
  };

  try {
    const room = await prisma.room.create({
      data: {
        slug,
        name,
        tagline: tagline ?? "",
        story: story ?? "",
        heroImageUrl: heroImageUrl ?? "",
        trailerUrl: trailerUrl ?? "",
        galleryImageUrls: JSON.stringify(galleryImageUrls ?? []),
        themeColors: JSON.stringify(themeColors ?? { primary: "#000", secondary: "#111", accent: "#fff" }),
        themeFont: themeFont ?? "gothic",
        difficulty: Number(difficulty ?? 3),
        durationMinutes: Number(durationMinutes ?? 60),
        minPlayers: Number(minPlayers ?? 2),
        maxPlayers: Number(maxPlayers ?? 6),
        pricePerPerson: 30,
        openHours: JSON.stringify(openHours ?? defaultOpenHours),
        active,
        roomStatus: dbRoomStatus,
        seoTitle: seoTitle ?? name,
        seoDescription: seoDescription ?? tagline ?? "",
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A room with that slug already exists" }, { status: 409 });
    }
    throw e;
  }
}
