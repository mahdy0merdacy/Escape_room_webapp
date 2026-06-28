import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH { order: ["roomId1", "roomId2", ...] }
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { order } = body as { order: string[] };

  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await Promise.all(
    order.map((id, index) =>
      prisma.room.update({ where: { id }, data: { order: index } })
    )
  );

  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/admin/rooms");

  return NextResponse.json({ ok: true });
}
