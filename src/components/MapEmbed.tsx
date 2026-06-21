"use client";

import { useState } from "react";

export default function MapEmbed() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/10"
      style={{ height: "450px" }}
    >
      {loaded ? (
        <iframe
          src="https://maps.google.com/maps?q=El+Harba+Escape+Room+Manouba+Tunisia&output=embed&z=16"
          width="100%"
          height="100%"
          style={{ border: 0, filter: "grayscale(20%) brightness(0.9)" }}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="elharba location map"
        />
      ) : (
        <button
          onClick={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full group flex flex-col items-center justify-center gap-4 bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer"
          aria-label="Load interactive map"
        >
          {/* Grid pattern background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden="true"
          />

          {/* Pin icon */}
          <div className="relative z-10 w-14 h-14 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-red-500" aria-hidden="true">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.083 3.875-5.44 3.875-9.762A8.25 8.25 0 0012 3.75a8.25 8.25 0 00-8.25 8.25c0 4.322 1.932 7.68 3.875 9.762a19.58 19.58 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="relative z-10 text-center">
            <p className="text-white font-semibold text-sm mb-1">Manouba, Tunisia</p>
            <p className="text-white/40 text-xs">Click to load interactive map</p>
          </div>
        </button>
      )}
    </div>
  );
}
