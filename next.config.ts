import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase auth reads cookies on most routes, so request-time rendering is the default here.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
