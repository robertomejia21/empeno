import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // permite subir fotos de prendas
    },
  },
};

export default nextConfig;
