import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://54.196.198.21:8001";
    const requestorUrl =
      process.env.NEXT_PUBLIC_REQUESTOR_URL || "http://54.196.198.21:8001";

    return [
      {
        source: "/api/proxy/:path*",
        destination: `${apiUrl}/:path*`, // admin service on EC2
      },
      {
        source: "/api/requestor/:path*",
        destination: `${requestorUrl}/:path*`, // requestor service on EC2
      },
    ];
  },
};

export default nextConfig;
