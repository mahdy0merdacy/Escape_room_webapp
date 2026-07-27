import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateLocalizedPath } from "@/lib/revalidate-locales";
import { LEADERBOARD_ENABLED_KEY } from "@/lib/leaderboardSettings";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.siteSettings.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return NextResponse.json(map);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = await request.json() as { key: string; value: string };
  const row = await prisma.siteSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  if (key === LEADERBOARD_ENABLED_KEY) {
    revalidateLocalizedPath("/");
    revalidateLocalizedPath("/leaderboard");
  }

  return NextResponse.json(row);
}
