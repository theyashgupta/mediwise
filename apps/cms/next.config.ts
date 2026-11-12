import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(import.meta.dirname, "../.."),
  reactStrictMode: true,
};

export default withPayload(config, { devBundleServerPackages: false });
