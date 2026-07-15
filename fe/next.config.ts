import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

let config = nextConfig;

if (process.env.NODE_ENV === "production") {
  const withPWA = withPWAInit({
    dest: "public",
    register: true,
    skipWaiting: true,
  });
  config = withPWA(nextConfig);
}

export default config;
