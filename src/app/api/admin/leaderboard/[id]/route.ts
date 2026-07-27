import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateLocalizedPath } from "@/lib/revalidate-locales";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const entry = await prisma.leaderboardEntry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.leaderboardEntry.delete({ where: { id } });

    // Revalidate leaderboard page
    revalidateLocalizedPath("/leaderboard");
    revalidateLocalizedPath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting leaderboard entry:", error);
    return NextResponse.json(
      { error: "Failed to delete leaderboard entry" },
      { status: 500 }
    );
  }
}
