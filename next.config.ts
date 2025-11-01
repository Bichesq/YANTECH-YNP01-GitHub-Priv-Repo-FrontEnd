import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  
  images: {
    unoptimized: true,
  },
  
  trailingSlash: true,
  
  // Rewrites are not supported in static export
  // Backend services must be called directly with CORS enabled
  
  // Note: Dynamic routes with [id] require generateStaticParams for static export
  // Since this app is fully client-side, consider using hash routing or query params
  // Alternative: Deploy to Vercel/Netlify which support dynamic routes in SPA mode
};

export default nextConfig;
