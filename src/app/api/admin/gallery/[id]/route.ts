import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    label?: string;
    sub?: string;
    accent?: string;
    imageUrls?: string[];
    featured?: boolean;
    order?: number;
    active?: boolean;
  };

  const album = await prisma.galleryAlbum.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: body.label.trim() }),
      ...(body.sub !== undefined && { sub: body.sub.trim() }),
      ...(body.accent !== undefined && { accent: body.accent }),
      ...(body.imageUrls !== undefined && { imageUrls: JSON.stringify(body.imageUrls) }),
      ...(body.featured !== undefined && { featured: body.featured }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });
  revalidatePath("/");
  return NextResponse.json({ ...album, imageUrls: JSON.parse(album.imageUrls) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.galleryAlbum.delete({ where: { id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
