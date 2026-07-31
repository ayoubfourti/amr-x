/** @type {import('next').NextConfig} */
const nextConfig = {
  // MkDocs uses directory URLs and owns the trailing slash under /docs.
  // Avoid a redirect loop where Next removes it and MkDocs adds it back.
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: import.meta.dirname,
  },
  async rewrites() {
    return [
      {
        source: "/docs",
        destination: "http://127.0.0.1:8001/docs/",
      },
      {
        source: "/docs/:path*/",
        destination: "http://127.0.0.1:8001/docs/:path*/",
      },
      {
        source: "/docs/:path*",
        destination: "http://127.0.0.1:8001/docs/:path*",
      },
      {
        source: "/livereload/:path*",
        destination: "http://127.0.0.1:8001/livereload/:path*",
      },
    ];
  },
};

export default nextConfig;
