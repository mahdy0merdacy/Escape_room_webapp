import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseRoomSchedule } from "@/lib/room-schedule";
import { getScheduleConfig } from "@/lib/schedule";
import { rescheduleRoomBookings } from "@/lib/reschedule";

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
    minPlayers, maxPlayers, roomStatus, showGallery,
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
      showGallery: showGallery ?? true,
      seoTitle,
      seoDescription,
    },
  });

  revalidatePath(`/rooms/${room.slug}`);
  revalidatePath("/rooms");
  revalidatePath("/");

  return NextResponse.json(room);
}

// PATCH — per-room schedule override; auto-reschedules affected future bookings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { openHours } = await request.json();

  const room = await prisma.room.update({
    where: { id },
    data: { openHours },
  });

  // Determine the effective schedule this room now follows and reschedule accordingly.
  const override = parseRoomSchedule(openHours);
  const effectiveConfig = override?.useCustom ? override : await getScheduleConfig();
  const { rescheduled, unresolvable } = await rescheduleRoomBookings(id, effectiveConfig);

  return NextResponse.json({ room, rescheduled, unresolvable });
}
