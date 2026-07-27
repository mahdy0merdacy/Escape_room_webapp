"use client";

import { useState } from "react";
import type { Room } from "@prisma/client";

interface LeaderboardEntryWithRoom {
  id: string;
  roomId: string;
  groupName: string;
  partySize: number;
  timeSpentSec: number;
  completedAt: string;
  createdAt: string;
  room?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Props {
  rooms: Room[];
  initialEntries: LeaderboardEntryWithRoom[];
}

export default function LeaderboardManager({ rooms, initialEntries }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntryWithRoom[]>(initialEntries);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    roomId: "",
    groupName: "",
    partySize: 1,
    timeSpentSec: 600, // 10 minutes default
  });

  const filteredEntries = filter === "all" ? entries : entries.filter((e) => e.roomId === filter);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/leaderboard/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Failed to delete entry");
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.roomId.trim()) {
      setError("Please select a room");
      return;
    }
    if (!form.groupName.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (form.partySize < 1) {
      setError("Party size must be at least 1");
      return;
    }
    if (form.timeSpentSec < 1) {
      setError("Time must be at least 1 second");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Failed to add entry");
      }

      const newEntry = await res.json() as LeaderboardEntryWithRoom;
      setEntries((prev) => [...prev, newEntry].sort((a, b) => {
        if (a.roomId !== b.roomId) return a.roomId.localeCompare(b.roomId);
        return a.timeSpentSec - b.timeSpentSec;
      }));

      setForm({
        roomId: "",
        groupName: "",
        partySize: 1,
        timeSpentSec: 600,
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  const selectedRoom = form.roomId ? rooms.find((r) => r.id === form.roomId) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard Manager</h1>
        <p className="text-white/60 text-sm">Manually add leaderboard entries for each room</p>
      </div>

      {/* Add entry button/form */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="w-full rounded-lg border border-dashed border-white/30 hover:border-white/60 hover:bg-white/10 text-white/60 hover:text-white py-3 text-sm font-medium transition-all"
          >
            + Add Entry
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">
                  Room *
                </label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50"
                  required
                >
                  <option value="">Select a room…</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">
                  Group Name *
                </label>
                <input
                  autoFocus
                  type="text"
                  value={form.groupName}
                  onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
                  placeholder="e.g. The Shadow Ninjas"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50 placeholder-white/30"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">
                  Party Size *
                </label>
                <input
                  type="number"
                  value={form.partySize}
                  onChange={(e) => setForm((f) => ({ ...f, partySize: Math.max(1, Number(e.target.value)) }))}
                  min="1"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">
                  Time (seconds) *
                </label>
                <input
                  type="number"
                  value={form.timeSpentSec}
                  onChange={(e) => setForm((f) => ({ ...f, timeSpentSec: Math.max(1, Number(e.target.value)) }))}
                  min="1"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/50"
                  required
                />
              </div>
            </div>

            {selectedRoom && (
              <div className="text-xs text-white/50 bg-blue-900/20 border border-blue-500/30 rounded px-3 py-2">
                Time preview: <span className="font-mono text-blue-300">{formatTime(form.timeSpentSec)}</span>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
              >
                {loading ? "Adding…" : "Add Entry"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError("");
                  setForm({
                    roomId: "",
                    groupName: "",
                    partySize: 1,
                    timeSpentSec: 600,
                  });
                }}
                className="text-white/40 hover:text-white text-sm px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-white/40">Filter:</span>
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
            filter === "all"
              ? "bg-white/20 text-white"
              : "bg-white/5 text-white/40 hover:text-white/70"
          }`}
        >
          All ({entries.length})
        </button>
        {rooms.map((room) => {
          const count = entries.filter((e) => e.roomId === room.id).length;
          return (
            <button
              key={room.id}
              onClick={() => setFilter(room.id)}
              className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                filter === room.id
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/40 hover:text-white/70"
              }`}
            >
              {room.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Entries table */}
      {filteredEntries.length > 0 ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 text-white">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70">
                    Group Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70">
                    Room
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white/70">
                    Party Size
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white/70">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white/70">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white/60">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {entry.groupName}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {entry.room?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60 text-right">
                      {entry.partySize}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-mono text-right font-semibold">
                      {formatTime(entry.timeSpentSec)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/40">
                      {new Date(entry.completedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        className="text-red-400/60 hover:text-red-400 disabled:opacity-40 text-xs transition-colors"
                        title="Delete entry"
                      >
                        {deleting === entry.id ? "…" : "✕"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-white/40 rounded-xl border border-dashed border-white/10">
          <p className="text-sm">No leaderboard entries yet. Add one to get started!</p>
        </div>
      )}
    </div>
  );
}
