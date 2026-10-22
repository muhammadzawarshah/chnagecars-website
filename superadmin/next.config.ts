import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
};
export default config;
