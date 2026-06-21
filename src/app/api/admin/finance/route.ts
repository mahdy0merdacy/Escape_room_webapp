import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: new Date(from), lte: new Date(to) },
    },
    include: {
      room: { select: { id: true, name: true, themeColors: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(bookings);
}
