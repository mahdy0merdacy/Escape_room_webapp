import prisma from "@/lib/prisma";

export const LEADERBOARD_ENABLED_KEY = "leaderboard.enabled";

export async function isLeaderboardEnabled(): Promise<boolean> {
  const row = await prisma.siteSettings.findUnique({ where: { key: LEADERBOARD_ENABLED_KEY } });
  return row?.value !== "false";
}
