import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Studio rules page reads the rules file at request time (src/studio/STUDIO.md).
  // /ui-assets serves the UI images from private/ui (outside public/, so only signed-in Studio users get them).
  outputFileTracingIncludes: { "/studio/rules": ["./src/studio/STUDIO.md"], "/ui-assets/[...path]": ["./private/ui/**/*"] },
  // Studio decisions carry up to six images, resized in the browser (Vercel caps a request at 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // No Next dev badge: it lands inside every slide thumbnail and screen frame, where people compare renders.
  devIndicators: false,
};

export default nextConfig;
