/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output bundles only what's needed into a single directory —
  // makes the Docker image smaller and faster to start.
  output: "standalone",
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:5000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
      { source: "/socket.io/:path*", destination: `${backend}/socket.io/:path*` },
    ];
  },
};

module.exports = nextConfig;
