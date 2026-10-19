import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/HelpCenterWidget.tsx' },
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    injectStyle: true,
    clean: true,
    outDir: 'dist',
  },
  {
    entry: { 'widget.iife': 'src/index.tsx' },
    format: ['iife'],
    globalName: 'HelpCenterWidget',
    // Without this, esbuild bundles React's development build into the script
    // that every embedding page downloads (about 3x larger, with dev warnings).
    env: { NODE_ENV: 'production' },
    injectStyle: true,
    minify: true,
    outDir: 'dist',
  },
]);
