import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    slug, title, excerpt, content, heroImageUrl,
    pillar, active, order, seoTitle, seoDescription,
  } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }

  try {
    const guide = await prisma.guide.create({
      data: {
        slug,
        title,
        excerpt: excerpt ?? "",
        content: content ?? "",
        heroImageUrl: heroImageUrl ?? "",
        pillar: pillar ?? false,
        active: active ?? true,
        order: Number(order ?? 0),
        seoTitle: seoTitle ?? title,
        seoDescription: seoDescription ?? excerpt ?? "",
      },
    });
    return NextResponse.json(guide, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A guide with that slug already exists" }, { status: 409 });
    }
    throw e;
  }
}
