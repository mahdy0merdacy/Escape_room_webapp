import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, newBookingAdminEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomId, startTime, endTime, customerName, email, phone, partySize } =
    body as Record<string, unknown>;

  // Validate required fields
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
  if (
    isNaN(parsedPartySize) ||
    parsedPartySize < room.minPlayers ||
    parsedPartySize > room.maxPlayers
  ) {
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

  if (startDate <= new Date()) {
    return NextResponse.json({ error: "Cannot book a slot in the past" }, { status: 400 });
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
        status: "pending",
      },
    });

    // Admin notification — customer email is sent only after admin confirms
    sendEmail(
      newBookingAdminEmail({
        customerName: customerName as string,
        email: email as string,
        phone: phone as string,
        roomName: room.name,
        startTime: startDate,
        endTime: endDate,
        partySize: parsedPartySize,
        bookingId: booking.id,
      })
    ).catch(console.error);

    return NextResponse.json(booking, { status: 201 });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    // Unique constraint violation on (roomId, startTime) = double-booking
    if (pgErr.code === "P2002") {
      return NextResponse.json(
        { error: "That slot was just booked by someone else. Please choose another time." },
        { status: 409 }
      );
    }
    console.error("Booking creation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
