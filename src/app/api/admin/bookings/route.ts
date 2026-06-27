import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail, bookingConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomId, startTime, endTime, customerName, email, phone, partySize } =
    body as Record<string, unknown>;

  if (!roomId || !startTime || !endTime || !customerName || !email || !phone || !partySize) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { id: roomId as string } });
  if (!room || !room.active) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const parsedPartySize = Number(partySize);
  if (isNaN(parsedPartySize) || parsedPartySize < room.minPlayers || parsedPartySize > room.maxPlayers) {
    return NextResponse.json(
      { error: `Party size must be between ${room.minPlayers} and ${room.maxPlayers}` },
      { status: 400 }
    );
  }

  const startDate = new Date(startTime as string);
  const endDate = new Date(endTime as string);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        roomId: roomId as string,
        startTime: startDate,
        endTime: endDate,
        customerName: customerName as string,
        email: email as string,
        phone: phone as string,
        partySize: parsedPartySize,
        status: "confirmed",
      },
    });

    // Awaited so Vercel doesn't cut it off before the Brevo request completes
    await sendEmail(
      bookingConfirmationEmail({
        customerName: customerName as string,
        email: email as string,
        roomName: room.name,
        startTime: startDate,
        endTime: endDate,
        partySize: parsedPartySize,
        pricePerPerson: room.pricePerPerson,
      })
    ).catch(console.error);

    return NextResponse.json(
      {
        ...booking,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        createdAt: booking.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "P2002") {
      return NextResponse.json({ error: "That slot is already booked." }, { status: 409 });
    }
    console.error("Admin booking creation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
