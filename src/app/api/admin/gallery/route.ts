import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const albums = await prisma.galleryAlbum.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(albums);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    label?: string;
    sub?: string;
    accent?: string;
    featured?: boolean;
    order?: number;
  };

  if (!body.label?.trim()) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const album = await prisma.galleryAlbum.create({
    data: {
      label: body.label.trim(),
      sub: body.sub?.trim() ?? "",
      accent: body.accent ?? "#e11d48",
      featured: body.featured ?? false,
      order: body.order ?? 0,
    },
  });
  revalidatePath("/");
  return NextResponse.json(album, { status: 201 });
}
