const path = require('path');

// Turbopack resolveAlias — mirrors the webpack resolve.alias entries below.
// Must be built before nextConfig since resolveAlias is a static object.
const turbopackResolveAlias = {
  // canvas is a native addon — redirect to empty stub so imports don't fail
  canvas: './empty-module.js',
  // Redirect backend DynamoDB client imports to the frontend's own client so
  // that cross-package entity imports (user.entity.ts → ../client.js) resolve.
};
turbopackResolveAlias[path.resolve(__dirname, '../backend/src/lib/dynamo/client.js')] =
  path.resolve(__dirname, 'lib/dynamo/client.ts');
turbopackResolveAlias[path.resolve(__dirname, '../backend/src/lib/dynamo/client')] =
  path.resolve(__dirname, 'lib/dynamo/client.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  cacheMaxMemorySize: 0, // Disable in-memory ISR cache — use Redis for multi-instance ECS
  cacheHandler: require.resolve("./lib/cache-handler.js"),
  // Prevent Node.js-only packages from being bundled for the browser
  serverExternalPackages: [
    'electrodb',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    '@pinecone-database/pinecone',
    'ioredis',
    'bcryptjs',
    'jsonwebtoken',
    'openai',
  ],
  turbopack: {
    resolveAlias: turbopackResolveAlias,
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
      // Production: S3 presigned URLs (bucket-specific hostname)
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // Production: worktree.pro CDN / API-proxied images
      {
        protocol: 'https',
        hostname: 'worktree.pro',
        port: '',
        pathname: '/**',
      },
      // Local dev: LocalStack S3 (port 4510, rewritten from Docker 'localstack' hostname)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4510',
        pathname: '/**',
      },
      // Local dev: backend presigned URL proxy (port 5005)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5005',
        pathname: '/**',
      },
    ],
  },

  eslint: {
    // Skip lint during Docker builds — run separately in CI/pre-commit
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking runs in CI — skip during Docker builds for speed
    ignoreBuildErrors: !!process.env.DOCKER_BUILD,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    // Redirect backend dynamo client imports to the frontend's own client
    // so that cross-package entity imports resolve correctly during build
    config.resolve.alias[path.resolve(__dirname, '../backend/src/lib/dynamo/client.js')] =
      path.resolve(__dirname, 'lib/dynamo/client.ts');
    config.resolve.alias[path.resolve(__dirname, '../backend/src/lib/dynamo/client')] =
      path.resolve(__dirname, 'lib/dynamo/client.ts');
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
