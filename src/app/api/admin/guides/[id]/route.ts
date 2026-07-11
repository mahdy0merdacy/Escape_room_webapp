import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const {
    title, excerpt, content, heroImageUrl,
    titleFr, excerptFr, contentFr, titleAr, excerptAr, contentAr,
    pillar, active, order, seoTitle, seoDescription,
  } = body;

  const guide = await prisma.guide.update({
    where: { id },
    data: {
      title,
      excerpt,
      content,
      titleFr: titleFr ?? "",
      excerptFr: excerptFr ?? "",
      contentFr: contentFr ?? "",
      titleAr: titleAr ?? "",
      excerptAr: excerptAr ?? "",
      contentAr: contentAr ?? "",
      heroImageUrl,
      pillar: pillar ?? false,
      active: active ?? true,
      order: Number(order ?? 0),
      seoTitle,
      seoDescription,
    },
  });

  revalidatePath(`/guides/${guide.slug}`);
  revalidatePath("/guides");

  return NextResponse.json(guide);
}
