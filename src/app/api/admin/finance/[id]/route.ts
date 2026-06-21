import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as {
    amountPaid?: number | null;
    confirmedPlayed?: boolean;
  };

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(body.amountPaid !== undefined && { amountPaid: body.amountPaid }),
      ...(body.confirmedPlayed !== undefined && {
        confirmedPlayed: body.confirmedPlayed,
        paid: body.confirmedPlayed,
      }),
    },
    include: {
      room: { select: { id: true, name: true, themeColors: true } },
    },
  });

  return NextResponse.json(booking);
}
