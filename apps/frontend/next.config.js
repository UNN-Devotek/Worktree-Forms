/** @type {import('next').NextConfig} */
// Force restart
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      resolveAlias: {
        // canvas is a native addon — redirect to empty stub so imports don't fail
        canvas: './empty-module.js',
        // bahttext, bessel, jstat, chevrotain are real npm packages;
        // Turbopack resolves them natively — no alias needed (unlike webpack)
      },
    },
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
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendUrl = `http://${backendHost}:${backendPort}`;
    
    return [
      {
        source: '/api/:path((?!auth).*)',
        destination: `${backendUrl}/api/:path`,
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

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
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
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
};

module.exports = withNextIntl(nextConfig);
