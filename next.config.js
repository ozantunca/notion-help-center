const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // instrumentation.ts is supported without a feature flag in Next 15+.
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  // Serve `/media/*` from disk (sync, admin upload) even when files live outside `public/`
  // via HELP_CENTER_MEDIA_DIR — same URLs as before.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/media/:path*', destination: '/api/media/:path*' },
      ],
    };
  },
  // Baseline hardening headers. A full `Content-Security-Policy` is intentionally
  // left out here: the pages router emits inline bootstrap scripts, so a policy
  // needs per-deployment nonces. See SECURITY.md for a worked example.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ];
  },
  webpack: (config, { isServer, nextRuntime, webpack: webpackApi }) => {
    // Instrumentation is compiled for Edge and Node; the dynamic import is still resolved for Edge.
    // Replace the Node-only entry so Edge never pulls `path` / `fs` / SQLite.
    if (isServer && nextRuntime === 'edge') {
      config.plugins.push(
        new webpackApi.NormalModuleReplacementPlugin(
          /[/\\]instrumentation-node\.ts$/,
          path.join(__dirname, 'lib/instrumentation-node.edge-stub.ts'),
        ),
      );
    }
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'better-sqlite3': false,
      };
      // Client bundles still trace dynamic `import('../lib/help-data')` from _app; never ship SQLite/fs.
      config.plugins.push(
        new webpackApi.NormalModuleReplacementPlugin(
          /[/\\]lib[/\\]help-data\.ts$/,
          path.join(__dirname, 'lib/help-data.client-stub.ts'),
        ),
      );
    }
    return config;
  },
};

module.exports = nextConfig;
