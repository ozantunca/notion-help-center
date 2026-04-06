const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
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
