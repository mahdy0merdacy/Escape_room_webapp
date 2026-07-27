import { ViewTransition } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { isLeaderboardEnabled } from "@/lib/leaderboardSettings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const showLeaderboard = await isLeaderboardEnabled();
  return (
    <>
      <Nav showLeaderboard={showLeaderboard} />
      <ViewTransition>
        <main className="flex-1 pt-16">{children}</main>
      </ViewTransition>
      <Footer />
    </>
  );
}
