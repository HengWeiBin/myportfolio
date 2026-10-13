# Learnings

## Ticket #2: Migrate to Vite, React 19, Vitest, and Clean Secret Tracking

1. **Vite JSX in `.js` Files**:
   - By default Vite disallows JSX inside `.js` files. For legacy CRA projects retaining `.js` extensions, adding a lightweight pre-plugin with `transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' })` and configuring `optimizeDeps.esbuildOptions.loader: { '.js': 'jsx' }` enables seamless JSX parsing without breaking git blame by renaming all files.

2. **Windows Environment Variables in Vite `define`**:
   - `loadEnv(mode, process.cwd(), '')` on Windows pulls in OS environment variables such as `CommonProgramFiles(x86)`. Using `process.env.CommonProgramFiles(x86)` directly inside `define` causes esbuild syntax parse errors due to parentheses in the identifier.
   - Filtering `loadEnv` with specific prefixes like `['REACT_APP_', 'NODE_ENV']` completely avoids leaking OS environment variables and prevents invalid JS token definitions.

3. **`styled-components` v5 + React 19 Peer Dependencies**:
   - `styled-components@5.3.11` requires `--legacy-peer-deps` with React 19.
   - In production builds under Rollup, `styled-components` requires explicit installation of `react-is` at project level so Rollup can resolve it.

4. **Vitest Test File Discovery**:
   - By default, Vitest scans all `**/*.{test,spec}.*` files, which inadvertently includes Playwright E2E suites under `tests/` that import `@playwright/test`.
   - Configuring `include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}']` and excluding `tests` scopes Vitest cleanly to unit tests.
   - Mocking `HTMLCanvasElement.prototype.getContext` in `setupTests.js` prevents jsdom crashes in canvas background animations (`LatentSpace`).

## Ticket #3: Secure Public Portfolio Data Pipeline

1. **Decoupling Direct Database Imports from Public Client Bundles**:
   - Statically importing database drivers (`@netlify/neon`, `@neondatabase/serverless`) pulls heavy database connectivity and websocket polyfills into client bundles. Moving public data ingestion to a serverless aggregation endpoint (`/api/portfolio`) and using dynamic imports for legacy admin CRUD isolates the DB client completely from public client chunks.
   - Vite and Rollup automatically code-split dynamically imported modules (`db.js`) into standalone asynchronous chunks (`db-*.js`), preventing DB drivers from bloating the main bundle and ensuring public landing pages load 0 database packages.

2. **Frontend Relative URL Resolution in Testing (Node undici vs Browser fetch)**:
   - Node's native `undici` fetch implementation in jsdom throws `TypeError: Failed to parse URL from /api/portfolio` when receiving relative URLs without an explicit host origin.
   - Guarding the fetch client with `window.location?.origin` safely prepends origin during browser/jsdom runtime, while mocking the endpoint in `setupTests.js` guarantees smooth unit testing across both component and service suites.

3. **Git Tracking for Specific Files in Ignored Directories**:
   - In git, ignoring a folder with `scripts/` prevents git from recursing into the directory, which ignores negation patterns like `!scripts/migrate_db.js`.
   - Using `scripts/*` alongside `!scripts/migrate_db.js` allows git to scan the folder while strictly tracking only approved scripts.
