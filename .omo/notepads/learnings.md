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

## Ticket #4: Hardened Admin Authentication with Bcrypt and HttpOnly JWT

1. **`cookie` Package Semantic Breaking Changes (v2 vs v0.7.x)**:
   - `cookie` v2 drastically refactored its public API, removing `cookie.serialize` and `cookie.parse` in favor of `stringifyCookie`/`stringifySetCookie`/`parseCookie`.
   - Using `cookie@^0.7.2` guarantees standard, long-term compatibility for `cookie.serialize(name, val, options)` with `HttpOnly`, `Path`, `SameSite`, `Max-Age`, and `Secure` attributes across Netlify Functions, AWS Lambda, and Node.js runtimes.

2. **HttpOnly Cookie Transmission & CORS with Credentials**:
   - When requests include `credentials: 'include'`, the standard requires `Access-Control-Allow-Credentials: 'true'` and explicit origin reflection rather than wildcard `*`.
   - Returning both standard `Set-Cookie` in `headers` and `multiValueHeaders['Set-Cookie']` ensures robust cookie setting across local Netlify CLI, Vite dev proxy, and Netlify production serverless functions.

3. **Asynchronous Session Verification in React Route Guards**:
   - Replacing synchronous `localStorage` checks with an asynchronous `/api/auth/session` verification call in admin route guards prevents client-side session spoofing.
   - Displaying an interim verifying state avoids route flashing while keeping local non-sensitive user metadata synced for dashboard header display and E2E compatibility.

## Ticket #5: Schema Tiered Content, NDA Case Studies, and Migration Runner

1. **Idempotent Column Migrations in PostgreSQL (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`)**:
   - Using PostgreSQL 9.6+ `ADD COLUMN IF NOT EXISTS` combined with defensive `UPDATE ... WHERE ... IS NULL` guarantees clean, non-destructive migration execution on Neon serverless databases across multiple environments without dropping or corrupting existing rows.
   - Wrapping migration execution in explicit `BEGIN ... COMMIT / ROLLBACK` transactions within the migration runner prevents partial application states during connection drops.

2. **Dual Representation for Content Tiering (Array Backwards-Compatibility + Object Dictionary)**:
   - Modifying public data endpoints from arrays to dictionaries risks breaking frontend consumers relying on `.map()`.
   - Returning both the sequential array (`projects`, filtered by query params if requested) and structured dictionaries (`tiered_projects`, `tiered: { projects, certificates }`) preserves backwards compatibility for legacy components and UI skeletons while enabling tiered UI rendering.

3. **Multi-Vector Admin Authorization Detection in Serverless Endpoints**:
   - Aggregation endpoints serving both public visitors and authenticated admins require robust identity inspection across multiple vectors: `admin_jwt` HttpOnly cookie, `Authorization: Bearer <token>`, and `x-admin-key` header.
   - Graceful redaction (setting `link: null` and `metrics: {}` for non-admins when `is_confidential === true`) prevents NDA data leaks at the network layer while preserving project metadata for portfolio case studies.

