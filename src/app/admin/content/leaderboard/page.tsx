import LeaderboardVisibilityToggle from "./LeaderboardVisibilityToggle";
import { isLeaderboardEnabled } from "@/lib/leaderboardSettings";

export const dynamic = "force-dynamic";

export default async function LeaderboardSettingsPage() {
  const enabled = await isLeaderboardEnabled();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
      <p className="text-white/40 text-sm mb-10">
        Controls the public leaderboard fed by the escape-room desktop app (fastest completion
        times and success rate per room).
      </p>
      <LeaderboardVisibilityToggle initialEnabled={enabled} />
    </div>
  );
}
