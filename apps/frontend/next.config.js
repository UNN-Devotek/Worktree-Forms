/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // When running in the unified container, the backend is on localhost:{BACKEND_PORT}
    const backendPort = process.env.BACKEND_PORT || 5000;
    const backendUrl = `http://localhost:${backendPort}`;
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      // Proxy uploads if needed (though usually these go to MinIO directly)
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minio.worktree.pro',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'worktree.pro',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
