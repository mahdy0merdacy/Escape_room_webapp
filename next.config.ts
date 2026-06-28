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
};

export default nextConfig;
