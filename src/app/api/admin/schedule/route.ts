import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DEFAULT_SCHEDULE } from "@/lib/slots";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.scheduleConfig.findUnique({ where: { id: "default" } });
  return NextResponse.json(config ?? { id: "default", ...DEFAULT_SCHEDULE });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    openHour?: number;
    openMinute?: number;
    closeHour?: number;
    closeMinute?: number;
    breakMinutes?: number;
  };

  const openHour = Number(body.openHour);
  const openMinute = Number(body.openMinute);
  const closeHour = Number(body.closeHour);
  const closeMinute = Number(body.closeMinute);
  const breakMinutes = Number(body.breakMinutes);

  if (
    !Number.isInteger(openHour) || openHour < 0 || openHour > 23 ||
    !Number.isInteger(closeHour) || closeHour < 0 || closeHour > 23 ||
    ![0, 30].includes(openMinute) ||
    ![0, 30].includes(closeMinute) ||
    !Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 240
  ) {
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  }

  const config = await prisma.scheduleConfig.upsert({
    where: { id: "default" },
    update: { openHour, openMinute, closeHour, closeMinute, breakMinutes },
    create: { id: "default", openHour, openMinute, closeHour, closeMinute, breakMinutes },
  });

  return NextResponse.json(config);
}
