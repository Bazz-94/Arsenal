import type { NextConfig } from "next";

/** Project Next.js configuration. */
const nextConfig: NextConfig = {
  images: {
    // Steam serves avatars from these hosts (GetPlayerSummaries avatarfull).
    remotePatterns: [
      { protocol: "https", hostname: "avatars.steamstatic.com" },
      { protocol: "https", hostname: "avatars.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "avatars.akamai.steamstatic.com" },
    ],
  },
};

export default nextConfig;
