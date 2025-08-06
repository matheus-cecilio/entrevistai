// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removido ignoreBuildErrors e ignoreDuringBuilds para garantir qualidade
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // Adicionado para avatares de perfis do Supabase
        port: "",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["*.csb.app", "*.cloudworkstations.dev"],
};

export default nextConfig;
