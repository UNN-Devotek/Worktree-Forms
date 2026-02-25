/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      // canvas is a native addon — redirect to empty stub so imports don't fail
      canvas: './empty-module.js',
      // bahttext, bessel, jstat, chevrotain are real npm packages;
      // Turbopack resolves them natively — no alias needed (unlike webpack)
    },
  },
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'recharts',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
    ],
  },
  async rewrites() {
    // When running in the unified container, the backend is on local loopback
    const backendPort = process.env.BACKEND_PORT || 5005;
    const backendHost = process.env.BACKEND_HOST || '127.0.0.1';
    const backendUrl = `http://${backendHost}:${backendPort}`;
    
    // Use fallback rewrites so they run AFTER all filesystem routes (including
    // dynamic ones like app/api/auth/[...nextauth]). This ensures auth routes
    // are handled by NextAuth, and only unmatched /api/* paths proxy to Express.
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          // :path* matches multi-segment paths (e.g. /api/projects/xxx/forms/2/sync-columns)
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${backendUrl}/uploads/:path*`,
        },
      ],
    };
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
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    // Fix resolution for vendored fast-formula-parser dependencies
    // Use require.resolve to find the exact entry file, avoiding directory ambiguity
    config.resolve.alias['bahttext'] = require.resolve('bahttext');
    config.resolve.alias['bessel'] = require.resolve('bessel');
    config.resolve.alias['jstat'] = require.resolve('jstat');
    config.resolve.alias['chevrotain'] = require.resolve('chevrotain');
    // Also include tiny-queue and regexp-to-ast as they are common deps
    try { config.resolve.alias['tiny-queue'] = require.resolve('tiny-queue'); } catch (e) {}
    try { config.resolve.alias['regexp-to-ast'] = require.resolve('regexp-to-ast'); } catch (e) {}
    
    return config;
  },
  transpilePackages: ['react-pdf', 'pdfjs-dist', 'yjs'],
};

module.exports = nextConfig;
