import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mcgny6ysyqbf6ib9.public.blob.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      // --- New locale-URL structure: every previously-bare page now lives under /en ---
      // NOTE: "/en", "/en/rooms", and "/en/rooms/stranger-things" are deliberately NOT
      // listed here — those exact paths are now real routes (English homepage, rooms
      // listing, and the stranger-things room), so redirecting them would create a loop.
      { source: "/", destination: "/en", permanent: true },
      { source: "/rooms", destination: "/en/rooms", permanent: true },
      { source: "/rooms/:slug", destination: "/en/rooms/:slug", permanent: true },
      { source: "/about", destination: "/en/about", permanent: true },
      { source: "/contact", destination: "/en/contact", permanent: true },
      { source: "/faq", destination: "/en/faq", permanent: true },
      { source: "/guides", destination: "/en/guides", permanent: true },
      { source: "/guides/:slug", destination: "/en/guides/:slug", permanent: true },
      { source: "/booking/confirmed", destination: "/en/booking/confirmed", permanent: true },

      // --- Legacy pre-relaunch WordPress URLs ---
      { source: "/en/rooms/annabelle-horror", destination: "/en/rooms/annabelle", permanent: true },
      { source: "/breaking-bad", destination: "/en/rooms/breaking-bad", permanent: true },
      { source: "/en/about-us-escape-room-elharba", destination: "/en/about", permanent: true },
      { source: "/contact-us", destination: "/en/contact", permanent: true },
      { source: "/en/contact-us", destination: "/en/contact", permanent: true },
      { source: "/privacy-policy", destination: "/en", permanent: true },
      { source: "/blog", destination: "/en/guides", permanent: true },
      { source: "/blog/:path*", destination: "/en/guides", permanent: true },
      { source: "/escape-room-tunisie", destination: "/en/guides/escape-room-tunisie", permanent: true },
      {
        source: "/top-5-des-raisons-dessayer-une-escape-room-en-tunisie",
        destination: "/en/guides/top-reasons-to-try-an-escape-room-in-tunisia",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
