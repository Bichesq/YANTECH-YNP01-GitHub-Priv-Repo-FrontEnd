import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "http://localhost:8001/:path*", // admin service
      },
      {
        source: "/api/requestor/:path*",
        destination: "http://localhost:8000/:path*", // requestor service
      },
    ];
  },
};

export default nextConfig;
