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

## Ticket #9: Serverless LLM Proxy, Rate Limiting, and Guardrails

1. **AES-256-GCM Key Management & In-Memory Key Derivation**:
   - Node.js native `crypto.createCipheriv` with `aes-256-gcm` requires a 32-byte key and a 12-byte initialization vector (IV). Deriving the key via SHA-256 (`crypto.createHash('sha256').update(secret).digest()`) allows arbitrary secret passphrases while guaranteeing an exact 256-bit key.
   - Enforcing GCM auth tag verification (`decipher.setAuthTag(...)`) ensures payload tampering or incorrect encryption secrets immediately trigger integrity exceptions instead of silently yielding garbage text.

2. **Daily Salted IP Hashing for Privacy-Preserving Rate Limiting**:
   - Storing raw visitor IP addresses violates privacy norms and poses compliance risks. Combining `sha256(ip + date + SALT)` creates a one-way rotating hash that strictly isolates quotas to a single UTC calendar day while preventing IP address reversal or persistent tracking.
   - Employing atomic PostgreSQL `ON CONFLICT (ip_hash, date) DO UPDATE SET request_count = agent_usage.request_count + 1` provides concurrency-safe rate limit counters without distributed locks or Redis overhead.

3. **Server-Sent Events (SSE) Protocol in Serverless Handlers**:
   - Netlify Function handlers can deliver streaming responses using standard SSE protocol formatting (`Content-Type: text/event-stream; charset=utf-8` with frames `event: <type>\ndata: <json>\n\n`).
   - Emitting typed SSE events (`event: tool_call`, `event: token`, `event: done`, `event: error`) allows client EventSource / fetch streams to dynamically render tool execution traces, word-by-word streaming typography, and structured rate limit exhaustion notifications.

## Ticket #6: Mission Control Design Tokens, 5-Section Layout, and Archive Route

1. **Tailwind CSS v4 `@theme` Architecture & PostCSS Toolchain**:
   - Tailwind CSS v4 eliminates `tailwind.config.js` in favor of declarative `@theme` blocks directly in CSS (`src/index.css`), driven by `@tailwindcss/postcss`. Defining design tokens (`--color-cyber-bg`, `--color-cyan-electric`, `--color-purple-neon`, `--font-mono`, `--font-sans`) within `@theme` injects custom utility classes (such as `bg-cyber-bg`, `text-cyan-electric`, `border-cyan-electric`) natively into Vite's PostCSS pipeline without extra plugins.

2. **Decoupling `styled-components` from Public SPA Bundles**:
   - Migrating all public presentation layers (`Hero`, `Projects`, `Experience`, `Skills`, `Certificates`, `Contact`, `TerminalLayout`, `Navbar`, and visualizations) to pure Tailwind utility classes completely removes runtime CSS-in-JS compilation overhead and emotion/styled DOM tagging from public visitor paths, significantly boosting render performance and lighthouse scores while preserving styled-components in `/admin` without breakage.

3. **Defensive Browser API Integration in Test Environments (`IntersectionObserver`)**:
   - When building scroll-spying navigation bars with `IntersectionObserver`, jsdom test environments throw `ReferenceError: IntersectionObserver is not defined` unless guarded or polyfilled. Guarding with `if (typeof window === 'undefined' || !window.IntersectionObserver) return;` in component hooks and registering a mock class in `setupTests.js` ensures rock-solid execution across both browser runtimes and headless Vitest suites.

## Ticket #7: Ambient WebGL Galaxy with Capabilities Sync

1. **Asynchronous WebGL Code-Splitting Behind a Synchronous CSS Fallback Poster**:
   - Bundling 3D graphics libraries like Three.js adds significant weight (~530kB minified). Loading the WebGL canvas asynchronously via `React.lazy` and `Suspense` behind a zero-layout-shift synchronous `FallbackPoster` guarantees rapid First Contentful Paint (FCP) and 0 Cumulative Layout Shift (CLS), while Rollup/Vite cleanly isolates Three.js into a standalone chunk.

2. **Headless WebGL Mocking in Vitest/jsdom Environment**:
   - In jsdom, Three.js `WebGLRenderer` queries shader precision formats, capabilities, and texture parameters on the canvas GL context (`gl.getShaderPrecisionFormat`, `gl.VERSION`, `gl.createTexture`). Selectively mocking `THREE.WebGLRenderer` in `setupTests.js` preserves full access to Three.js math, vectors, and geometry classes while allowing unit tests to exercise React component lifecycles, canvas mounts, and resource disposal without headless GPU driver crashes.

3. **Hardware-Aware & Motion-Sensitive Ambient Animation Lifecycle**:
   - Querying `prefers-reduced-motion` and `navigator.hardwareConcurrency` alongside `document.visibilitychange` and `IntersectionObserver` enables full suspension of `requestAnimationFrame` loops during background tab execution or off-screen scrolling, eliminating battery drain and maintaining 60 FPS performance on resource-constrained devices.


