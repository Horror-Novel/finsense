/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output bundles only what's needed into a single directory —
  // makes the Docker image smaller and faster to start. Vercel builds its
  // own output, so it's skipped there.
  output: process.env.VERCEL ? undefined : "standalone",
  async rewrites() {
    // On Vercel, set BACKEND_URL to the deployed backend project's URL
    // (e.g. https://finsense-api.vercel.app). The browser keeps calling
    // same-origin /api/*, so no CORS setup is needed.
    const backend = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
      { source: "/socket.io/:path*", destination: `${backend}/socket.io/:path*` },
    ];
  },
};

module.exports = nextConfig;
