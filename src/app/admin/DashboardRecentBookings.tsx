"use client";

import { Fragment, useState } from "react";

type Room = { name: string; themeColors: string; minPlayers: number; maxPlayers: number };
type Booking = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  partySize: number;
  startTime: string;
  status: string;
  room: Room;
};

export default function DashboardRecentBookings({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ customerName: "", email: "", phone: "", partySize: 1 });
  const [saving, setSaving] = useState(false);

  function startEdit(b: Booking) {
    setEditingId(b.id);
    setEditForm({ customerName: b.customerName, email: b.email, phone: b.phone, partySize: b.partySize });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...editForm } : b)));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 py-16 text-center text-white/30 text-sm">
        No recent bookings
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              {["Date & Time", "Room", "Customer", "Phone", "Pax", ""].map((h) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs font-medium text-white/30 uppercase tracking-widest ${
                    h === "Pax" ? "text-center" : h === "" ? "" : "text-left"
                  } ${h === "Phone" ? "hidden sm:table-cell" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bookings.map((b) => {
              const colors = JSON.parse(b.room.themeColors) as { primary: string; accent: string };
              const startTime = new Date(b.startTime);
              const isEditing = editingId === b.id;
              return (
                <Fragment key={b.id}>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="text-white font-medium">
                        {startTime.toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", timeZone: "Africa/Tunis",
                        })}
                      </p>
                      <p className="text-white/40 text-xs">
                        {startTime.toLocaleTimeString("en-US", {
                          hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Tunis",
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ background: colors.accent + "22", color: colors.accent }}
                      >
                        {b.room.name}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-white">{b.customerName}</p>
                      <p className="text-white/40 text-xs truncate max-w-[200px]">{b.email}</p>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <a
                        href={`tel:${b.phone}`}
                        className="text-white/50 hover:text-white font-mono text-sm transition-colors"
                      >
                        {b.phone}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-white font-semibold">{b.partySize}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => (isEditing ? setEditingId(null) : startEdit(b))}
                        className="text-xs text-white/40 hover:text-white border border-white/15 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr className="bg-white/[0.03]">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <input
                            type="text"
                            placeholder="Name"
                            value={editForm.customerName}
                            onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40"
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40"
                          />
                          <input
                            type="text"
                            placeholder="Phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40"
                          />
                          <input
                            type="number"
                            placeholder="Party size"
                            min={b.room.minPlayers}
                            max={b.room.maxPlayers}
                            value={editForm.partySize}
                            onChange={(e) => setEditForm((f) => ({ ...f, partySize: Number(e.target.value) }))}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40"
                          />
                        </div>
                        <button
                          onClick={() => saveEdit(b.id)}
                          disabled={saving}
                          className="mt-3 px-5 py-2 rounded-lg bg-red-700/80 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
                        >
                          {saving ? "Saving…" : "Save changes"}
                        </button>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
