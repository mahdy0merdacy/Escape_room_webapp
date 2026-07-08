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
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/rooms", destination: "/rooms", permanent: true },
      { source: "/en/rooms/annabelle-horror", destination: "/rooms/annabelle", permanent: true },
      { source: "/en/rooms/stranger-things", destination: "/rooms/stranger-things", permanent: true },
      { source: "/breaking-bad", destination: "/rooms/breaking-bad", permanent: true },
      { source: "/en/about-us-escape-room-elharba", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/en/contact-us", destination: "/contact", permanent: true },
      { source: "/privacy-policy", destination: "/", permanent: true },
      { source: "/blog", destination: "/guides", permanent: true },
      { source: "/blog/:path*", destination: "/guides", permanent: true },
      { source: "/escape-room-tunisie", destination: "/guides/escape-room-tunisie", permanent: true },
      {
        source: "/top-5-des-raisons-dessayer-une-escape-room-en-tunisie",
        destination: "/guides/top-reasons-to-try-an-escape-room-in-tunisia",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
