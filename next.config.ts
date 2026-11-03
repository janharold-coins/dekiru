import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Studio rules page reads the rules file at request time (src/studio/STUDIO.md).
  outputFileTracingIncludes: { "/studio/rules": ["./src/studio/STUDIO.md"] },
};

export default nextConfig;
