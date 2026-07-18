"use client";

import { useEffect, useState } from "react";

export type LeaderboardEntry = {
  id: string;
  groupName: string;
  partySize: number;
  timeSpentSec: number;
  completedAt: string;
};

export type LeaderboardRoom = {
  slug: string;
  name: string;
  themeColors: string;
  successRate: number;
  entries: LeaderboardEntry[];
};

const POLL_INTERVAL_MS = 20000;

export function useLeaderboardData(initialRooms: LeaderboardRoom[] | null = null) {
  const [rooms, setRooms] = useState<LeaderboardRoom[] | null>(initialRooms);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { rooms: LeaderboardRoom[] };
        if (!cancelled) setRooms(data.rooms);
      } catch {
        // network hiccup — keep showing last known data, retry next tick
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return rooms;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
