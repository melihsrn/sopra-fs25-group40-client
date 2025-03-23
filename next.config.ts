import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/flashcards/image/**",
      },
      {
        protocol: "https",
        hostname: "sopra-fs25-group40-server.oa.r.appspot.com",
        pathname: "/flashcards/image/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/fs25-group40-bucket/**",
      },
    ],
  },
};

export default nextConfig;
