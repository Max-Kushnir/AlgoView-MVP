/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Monaco editor webpack configuration
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: "worker-loader" },
    });
    return config;
  },
};

module.exports = nextConfig;
