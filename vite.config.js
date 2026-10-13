/// <reference types="vitest" />
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['REACT_APP_', 'NODE_ENV']);

  const processEnv = {};
  const safeEnv = {};
  for (const key of Object.keys(env)) {
    // Scrub database credentials from front-end bundle outputs
    if (key.includes('DATABASE_URL')) {
      continue;
    }
    safeEnv[key] = env[key];
    processEnv[`process.env.${key}`] = JSON.stringify(env[key]);
  }
  processEnv['process.env'] = JSON.stringify(safeEnv);

  return {
    plugins: [
      {
        name: 'treat-js-files-as-jsx',
        async transform(code, id) {
          if (!id.match(/src\/.*\.js$/)) return null;
          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          });
        },
      },
      react(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api/auth/login': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/auth-login',
        },
        '/api/auth/logout': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/auth-logout',
        },
        '/api/auth/session': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/auth-session',
        },
        '/api/agent/chat': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/agent-chat',
        },
        '/api': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/.netlify/functions'),
        },
        '/.netlify/functions': {
          target: 'http://localhost:9999',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'build',
    },
    define: processEnv,
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      exclude: ['node_modules', 'dist', 'build', 'tests'],
    },
  };
});
