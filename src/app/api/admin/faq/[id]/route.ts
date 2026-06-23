import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const item = await prisma.faqItem.update({
    where: { id },
    data: {
      order: body.order,
      active: body.active,
      q_en: body.q_en,
      q_fr: body.q_fr,
      q_ar: body.q_ar,
      a_en: body.a_en,
      a_fr: body.a_fr,
      a_ar: body.a_ar,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.faqItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
