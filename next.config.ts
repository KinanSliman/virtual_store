import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      // product image uploads travel through the dashboard's server action;
      // the default 1MB cap is too small for a phone photo
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
