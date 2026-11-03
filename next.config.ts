import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Studio rules page reads the rules file at request time (src/studio/STUDIO.md).
  outputFileTracingIncludes: { "/studio/rules": ["./src/studio/STUDIO.md"] },
  // Studio decisions carry up to six images, resized in the browser (Vercel caps a request at 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
