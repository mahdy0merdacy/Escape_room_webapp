import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.faqItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const maxOrder = await prisma.faqItem.aggregate({ _max: { order: true } });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const item = await prisma.faqItem.create({
    data: {
      order: nextOrder,
      active: body.active ?? true,
      q_en: body.q_en ?? "",
      q_fr: body.q_fr ?? "",
      q_ar: body.q_ar ?? "",
      a_en: body.a_en ?? "",
      a_fr: body.a_fr ?? "",
      a_ar: body.a_ar ?? "",
    },
  });
  return NextResponse.json(item, { status: 201 });
}
