/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
};

if (process.env.NEXT_PUBLIC_TEMPO && !isProd) {
  // Temporarily disable SWC plugins to fix build issues
  // nextConfig.experimental = {
  //   swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]],
  // };
}

module.exports = nextConfig;
