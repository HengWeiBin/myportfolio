/// <reference types="vitest" />
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import net from 'net';

const require = createRequire(import.meta.url);

function checkPortActive(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(100);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

function netlifyDevMiddlewarePlugin() {
  let isPortActive = false;
  let lastCheck = 0;

  async function checkPort9999() {
    const now = Date.now();
    if (now - lastCheck < 2000) {
      return isPortActive;
    }
    isPortActive = await checkPortActive(9999);
    lastCheck = now;
    return isPortActive;
  }

  return {
    name: 'netlify-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api') && !url.startsWith('/.netlify/functions')) {
          return next();
        }

        // If Netlify functions:serve or Netlify Dev is running on port 9999, let Vite proxy forward
        const active = await checkPort9999();
        if (active) {
          return next();
        }

        // Otherwise execute function in-process during dev
        try {
          const parsedUrl = new URL(url, 'http://localhost:3000');
          const pathname = parsedUrl.pathname;
          let functionName = '';
          const queryParams = Object.fromEntries(parsedUrl.searchParams);

          if (pathname === '/api/auth/login') functionName = 'auth-login';
          else if (pathname === '/api/auth/logout') functionName = 'auth-logout';
          else if (pathname === '/api/auth/session') functionName = 'auth-session';
          else if (pathname === '/api/portfolio') functionName = 'portfolio';
          else if (pathname === '/api/admin/crud') functionName = 'admin-crud';
          else if (pathname === '/api/agent/chat') functionName = 'agent-chat';
          else if (pathname === '/api/admin/llm/config') {
            functionName = 'admin-agent';
            queryParams.action = 'config';
          } else if (pathname === '/api/admin/llm/test') {
            functionName = 'admin-agent';
            queryParams.action = 'test';
          } else if (pathname === '/api/admin/conversations') {
            functionName = 'admin-agent';
            queryParams.action = 'conversations';
          } else if (pathname.startsWith('/api/admin/llm')) {
            functionName = 'admin-agent';
          } else if (pathname.startsWith('/.netlify/functions/')) {
            functionName = pathname.replace('/.netlify/functions/', '').split('?')[0].split('/')[0];
          } else if (pathname.startsWith('/api/')) {
            functionName = pathname.replace('/api/', '').split('?')[0].split('/')[0];
          }

          if (!functionName) {
            return next();
          }

          let functionModule;
          try {
            functionModule = require(`./netlify/functions/${functionName}.js`);
          } catch (loadErr) {
            return next();
          }

          const handler = functionModule.handler || functionModule.default?.handler || functionModule.default;
          if (typeof handler !== 'function') {
            return next();
          }

          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks).toString('utf8');

          const event = {
            httpMethod: req.method,
            path: parsedUrl.pathname,
            headers: req.headers,
            queryStringParameters: queryParams,
            body,
            isBase64Encoded: false,
          };

          const result = await handler(event, {});
          res.statusCode = result.statusCode || 200;
          if (result.headers) {
            for (const [k, v] of Object.entries(result.headers)) {
              res.setHeader(k, v);
            }
          }
          res.end(result.body || '');
        } catch (err) {
          console.error('[vite-netlify-middleware] Error:', err.message);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        }
      });
    }
  };
}

const proxyErrorHandler = (proxy) => {
  proxy.on('error', (err, req, res) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy target unavailable', details: err.message }));
    }
  });
};

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
      netlifyDevMiddlewarePlugin(),
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
          configure: proxyErrorHandler,
        },
        '/api/auth/logout': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/auth-logout',
          configure: proxyErrorHandler,
        },
        '/api/auth/session': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/auth-session',
          configure: proxyErrorHandler,
        },
        '/api/agent/chat': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/agent-chat',
          configure: proxyErrorHandler,
        },
        '/api/admin/llm/config': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/admin-agent?action=config',
          configure: proxyErrorHandler,
        },
        '/api/admin/llm/test': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/admin-agent?action=test',
          configure: proxyErrorHandler,
        },
        '/api/admin/llm': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/admin\/llm/, '/.netlify/functions/admin-agent'),
          configure: proxyErrorHandler,
        },
        '/api/admin/conversations': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/admin-agent?action=conversations',
          configure: proxyErrorHandler,
        },
        '/api/admin/crud': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: () => '/.netlify/functions/admin-crud',
          configure: proxyErrorHandler,
        },
        '/api': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/.netlify/functions'),
          configure: proxyErrorHandler,
        },
        '/.netlify/functions': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          configure: proxyErrorHandler,
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
