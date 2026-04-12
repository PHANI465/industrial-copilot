import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  outputFileTracingIncludes: {
    "/api/*": ["./public/data/**/*"],
  },
};

export default nextConfig;
