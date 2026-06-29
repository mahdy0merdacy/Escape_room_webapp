import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, newBookingAdminEmail, bookingConfirmationEmail, type Locale } from "@/lib/email";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomId, startTime, endTime, customerName, email, phone, partySize, locale } =
    body as Record<string, unknown>;

  // Validate required fields
  if (!roomId || !startTime || !endTime || !customerName || !email || !phone || !partySize) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const safeLocale: Locale = locale === "ar" || locale === "fr" ? (locale as Locale) : "en";

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

  // Rate-limit: same email can't submit more than 3 bookings in a 5-minute window.
  const recentCount = await prisma.booking.count({
    where: { email: email as string, createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) } },
  });
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes before trying again." },
      { status: 429 }
    );
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
        locale: safeLocale,
      },
    });

    const ref = booking.id.slice(0, 8).toUpperCase();

    // Awaited so Vercel doesn't kill the function before the Brevo request resolves
    await sendEmail(
      bookingConfirmationEmail({
        customerName: customerName as string,
        email: email as string,
        roomName: room.name,
        startTime: startDate,
        endTime: endDate,
        partySize: parsedPartySize,
        pricePerPerson: room.pricePerPerson,
        locale: safeLocale,
      })
    ).catch(console.error);

    await sendEmail(
      newBookingAdminEmail({
        customerName: customerName as string,
        email: email as string,
        phone: phone as string,
        roomName: room.name,
        startTime: startDate,
        endTime: endDate,
        partySize: parsedPartySize,
        bookingId: booking.id,
        locale: safeLocale,
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
