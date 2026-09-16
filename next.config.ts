import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

// Exposes Cloudflare bindings (D1, KV, Queues) to `next dev`, so local
// development hits the same env shape as the deployed worker.
void initOpenNextCloudflareForDev();

export default nextConfig;
