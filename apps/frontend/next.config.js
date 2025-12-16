/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // When running in the unified container, the backend is on local loopback
    const backendPort = process.env.BACKEND_PORT || 5005;
    const backendHost = process.env.BACKEND_HOST || '127.0.0.1';
    const backendUrl = `http://${backendHost}:${backendPort}`;
    
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
