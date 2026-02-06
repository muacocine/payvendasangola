/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow all external images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
