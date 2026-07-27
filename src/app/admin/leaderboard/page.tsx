import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LeaderboardManager from "@/components/LeaderboardManager";

export const dynamic = "force-dynamic";

export default async function AdminLeaderboardPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [rooms, entries] = await Promise.all([
    prisma.room.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.leaderboardEntry.findMany({
      include: {
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ roomId: "asc" }, { timeSpentSec: "asc" }],
    }),
  ]);

  const serializedEntries = entries.map((e) => ({
    ...e,
    completedAt: e.completedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <LeaderboardManager rooms={rooms} initialEntries={serializedEntries} />
    </div>
  );
}
