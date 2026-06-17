"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancelBooking() {
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to cancel booking");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={cancelBooking}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors border border-red-500/30 hover:border-red-400/50 px-3 py-1 rounded"
    >
      {loading ? "Cancelling…" : "Cancel"}
    </button>
  );
}
