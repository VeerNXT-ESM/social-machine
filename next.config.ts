import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp (image compression) is loaded at run time, so the bundler cannot see it. Without this,
  // the online site's server functions are deployed without it and every image step fails.
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
  },
};

export default nextConfig;
