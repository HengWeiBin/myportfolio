# Decisions

## Ticket #2: Migrate to Vite, React 19, Vitest, and Clean Secret Tracking

1. **Toolchain Migration to Vite & React 19**:
   - Replaced deprecated `react-scripts` with Vite v6 and `@vitejs/plugin-react`.
   - Upgraded `react` and `react-dom` to `^19.0.0`.
   - Kept root `package.json` without `"type": "module"` to ensure CommonJS compatibility with Netlify Functions (`require`) and Playwright configuration (`require('@playwright/test')`).
   - Maintained `outDir: 'build'` in `vite.config.js` to match Netlify (`publish = "build"`) and `gh-pages -d build` targets.

2. **Secret Tracking Cleanup**:
   - Removed `.env` from git tracking cache via `git rm --cached .env`.
   - Added `.env` explicitly to root `.gitignore`.
   - Removed `AGENTS.md` from `.gitignore` so agent instructions and architecture documentation are tracked in source control.

3. **Backward Compatibility for `process.env`**:
   - Configured Vite `define` to inject filtered `REACT_APP_*` and `NODE_ENV` environment variables into `process.env` at build/runtime. This allows existing database and storage services (`src/services/api.js`, `src/services/upload.js`, `src/services/db.js`) to function without breaking prior to the Ticket #3 refactor.

4. **Testing Framework**:
   - Switched unit test runner from CRA Jest to Vitest v3 with `jsdom`.
   - Configured setup file `src/setupTests.js` with `@testing-library/jest-dom/vitest` and canvas context mock for jsdom.
   - Scoped Vitest `include` pattern to `src/**/*.{test,spec}.{js,jsx,ts,tsx}` to isolate unit tests from Playwright E2E tests in `tests/`.

## Ticket #3: Secure Public Portfolio Data Pipeline

1. **Serverless Data Aggregation via Netlify Functions**:
   - Implemented `netlify/functions/portfolio.js` (`GET /api/portfolio`) that queries Neon serverless PostgreSQL and aggregates `{ profile, skills, projects, experience, certificates }` in a single network round-trip.
   - Configured proxy rewrites in both `netlify.toml` and `vite.config.js` to redirect `/api/portfolio` transparently to `/.netlify/functions/portfolio`.
   - Stripped private database columns and admin credentials from the aggregation endpoint response.

2. **Database Migration Runner and `schema_migrations` Table**:
   - Enhanced `scripts/migrate_db.js` to ensure the `schema_migrations` tracking table is provisioned (`CREATE TABLE IF NOT EXISTS schema_migrations ...`).
   - Implemented transaction-safe migration runner that executes pending migrations in order and skips previously recorded migrations.
   - Exposed npm script `"migrate": "node scripts/migrate_db.js"`.

3. **Front-End Bundle Credential Scrubbing**:
   - Configured `vite.config.js` to filter out any environment variables matching `DATABASE_URL` (including `REACT_APP_DATABASE_URL` and `VITE_DATABASE_URL`) from Vite `define` replacements.
   - Decoupled static `db.js` dependencies from `src/services/api.js` and `src/services/auth.js` via lazy dynamic imports, allowing Rollup to separate DB client code into a deferred chunk and keeping the main public bundle 100% free of database connection strings and Neon drivers.

4. **Unified React Context Consumption & Skeleton Loading**:
   - Upgraded `ProfileContext.js` into an aggregated portfolio state provider exposing both `useProfile` and `usePortfolio` hooks.
   - Migrated all public sections (`Projects`, `Certificates`, `Experience`, `Skills`) to consume `usePortfolio()` with skeleton loading states, completely removing direct `db.js` imports across all public components.

## Ticket #4: Hardened Admin Authentication with Bcrypt and HttpOnly JWT

1. **Pure JavaScript Bcrypt (`bcryptjs`) & Schema Migration**:
   - Adopted `bcryptjs` over native `bcrypt` to prevent native C++ compilation failures during cross-platform installations (Windows/Linux/macOS/Netlify CI).
   - Created database migration `004_harden_admin_passwords_bcrypt` in `scripts/migrate_db.js` that updates `admins.password` to `VARCHAR(255)` and safely hashes existing plaintext passwords in-place.

2. **HttpOnly Cookie-Based Session Architecture**:
   - Partitioned authentication into three dedicated Netlify serverless functions:
     - `auth-login.js` (`POST /api/auth/login`): Verifies credentials via `bcrypt.compare`, issues signed JWT in an `HttpOnly; Path=/; SameSite=Lax` cookie, and returns sanitized `{ success: true, user: { id, email } }`.
     - `auth-logout.js` (`POST /api/auth/logout`): Clears the session cookie via `Max-Age=0`.
     - `auth-session.js` (`GET /api/auth/session`): Verifies JWT signature and expiry, returning `{ authenticated: true, user }` or evicting expired cookies.
   - Configured proxy redirects across both `netlify.toml` and `vite.config.js` for `/api/auth/login`, `/api/auth/logout`, and `/api/auth/session`.

3. **Client-Side Auth Hardening & UI State Synchronization**:
   - Stripped all client-side plaintext password comparisons and direct database imports from `src/services/auth.js`.
   - Updated `src/pages/Admin/Login.js` and `src/pages/Admin/AdminLayout.js` to asynchronously verify authentication status against `/api/auth/session`, eliminating localStorage tampering vulnerabilities while retaining local non-sensitive profile state for UI consistency.
   - Fixed missing API query methods in `src/pages/Admin/Dashboard.js` to consume `getProjects`, `getCertificates`, and `getExperience` instead of obsolete undeclared `sql` template tags.

## Ticket #5: Schema Tiered Content, NDA Case Studies, and Migration Runner

1. **Sequential SQL Migration System with Idempotent Tracking**:
   - Established `migrations/` directory tracking raw SQL migration files (`001_...` through `005_...`).
   - Extended `scripts/migrate_db.js` with `loadSqlMigrations` to automatically discover and execute raw `.sql` files alongside programmatic migrations, recording applied runs inside `schema_migrations`.
   - Migration `005_tiered_content_and_nda_metadata` extends `projects` (`tier`, `sort_order`, `visual_type`, `is_confidential`, `repo_visibility`, `metrics`), `certificates` (`category`, `tier`, `sort_order`), and `experience` (`sort_order`).

2. **Server-Side NDA Redaction and Tiered Structuring in `/api/portfolio`**:
   - Enhanced `netlify/functions/portfolio.js` to sort items by `sort_order ASC`.
   - Added support for `?tier=<tier>` query parameter filtering.
   - Output structured dictionaries `tiered_projects` and `tiered: { projects, certificates }` without altering the existing array contract on `payload.projects`.
   - Automatically redacts `link` (sets to `null`) and private `metrics` (sets to `{}`) for projects where `is_confidential === true` unless authenticated with valid `admin_jwt` cookie, Bearer token, or `x-admin-key`.

3. **Protected Admin CRUD Endpoint (`/api/admin/crud`)**:
   - Implemented `netlify/functions/admin-crud.js` providing authenticated mutation operations for projects, certificates, and experience.
   - Configured route rewrite `/api/admin/crud` in `netlify.toml`.
   - Updated `src/services/api.js` and `src/pages/Admin/Dashboard.js` to support editing and updating tiered content, sort orders, and NDA parameters.
   - Updated `src/components/Sections/Experience.js` to support markdown rendering for job descriptions via `ReactMarkdown`.

## Ticket #9: Serverless LLM Proxy, Rate Limiting, and Guardrails

1. **At-Rest LLM Credential Encryption (`llm_config` + AES-256-GCM)**:
   - Added migration `006_llm_config_and_agent_telemetry.sql` and updated `scripts/migrate_db.js` with `llm_config`, `agent_usage`, and `conversations` tables.
   - Encrypted LLM keys are stored as `{ api_key_encrypted, iv, auth_tag }` and decrypted server-side only when resolving configuration. Decrypted keys are never serialized in API responses, SSE event frames, or client telemetry.

2. **Serverless Streaming LLM Proxy (`/api/agent/chat`)**:
   - Implemented `netlify/functions/agent-chat.js` responding with `Content-Type: text/event-stream; charset=utf-8`.
   - Wired redirects in `netlify.toml` (`/api/agent/chat` -> `/.netlify/functions/agent-chat`) and Vite proxy in `vite.config.js`.
   - Implemented read-only tools: `get_profile`, `list_projects`, `get_experience`, `list_skills`, `list_certificates` with strict NDA redaction (stripping private metrics and setting `link: null` when `is_confidential === true`).

3. **Privacy-Preserving Rate Limiting & Safety Guardrails**:
   - One-way salted hash `sha256(ip + date + SALT)` ensures user privacy while restricting usage to 5 queries per calendar day.
   - Quota exhaustion returns structured SSE event: `event: error\ndata: {"code":"RATE_LIMIT_EXCEEDED","message":"Daily rate limit reached. Reverting to scripted playback."}\n\n`.
   - Built-in guardrails defend against off-topic inquiries, prompt injection attempts, and NDA disclosure requests by redirecting visitors to portfolio inquiries or direct communication.

## Ticket #6: Mission Control Design Tokens, 5-Section Layout, and Archive Route

1. **Mission Control Cyber Aesthetic Design Tokens with Tailwind CSS v4 `@theme`**:
   - Configured custom dark shades (`--color-cyber-bg: #07090e`, `--color-cyber-dark: #0a0d14`, `--color-cyber-card: #0f1422`, `--color-cyber-surface: #131a29`, `--color-cyber-panel: #172033`, `--color-cyber-border: #1e293b`), electric cyan (`#00f0ff`), and neon purple (`#a855f7`) gradients in `src/index.css`.
   - Built reusable glassmorphism utility classes (`.glass-panel`, `.glass-panel-glow`, `.glass-card`) with subtle 1px border glows and backdrop filters.

2. **5-Section Narrative Architecture**:
   - Structured the homepage into a cohesive 5-act narrative:
     1. `Hero`: Mission Control header, terminal window bar, system status indicator, bio, action CTAs (`$ view_projects.sh`, `$ cat resume.txt`, `$ initiate_handshake.sh`), and real-time training animation.
     2. `Featured Work` (`#projects`): Highlights `featured` tier projects, NDA safeguards (`🔒 [NDA Protected]`), metric chips, and visualization sandboxes.
     3. `System Evolution` (`#experience`): Chronological career and ML research timeline with glowing nodes and rich markdown descriptions.
     4. `Technical Arsenal` (`#skills`): Categorized capabilities grid with tech stack badges.
     5. `Credentials & Handshake` (`#certificates` & `#contact`): Peer recognition badges, proof modal previews, direct contact channels, and transmission end indicator.

3. **Dedicated Archive Route (`/archive`)**:
   - Created `src/pages/Archive.js` mounted at `/archive` with live client-side keyword search (title, tags, technologies, issuer, description), type filters (`All`, `Projects`, `Credentials`), and tier filters (`All Tiers`, `Featured`, `Standard`, `Foundation`).
   - Integrated full credential proof preview modals and NDA badges for archived items.

4. **Responsive Mobile Navigation Drawer**:
   - Created standalone `src/components/Layout/Navbar.js` with smooth anchor scrolling across all 5 sections, `/archive` route switching, active section tracking, system status badge, and an accessible mobile drawer overlay.

## Ticket #7: Ambient WebGL Galaxy with Capabilities Sync

1. **Pure Three.js Canvas Architecture with React 19 Compatibility**:
   - Selected pure Three.js over `@react-three/fiber` to ensure seamless React 19 compatibility without experimental reconciler flags or peer dependency breakages.
   - Encapsulated Three.js scene creation, buffer geometries, particle sprite glow texture generation, and memory disposal directly inside `src/components/Background/LatentGalaxy.js`.

2. **Synchronous FallbackPoster Layering with Code-Split WebGL**:
   - Built lightweight `src/components/Background/FallbackPoster.js` rendering pure CSS gradient meshes and SVG celestial grid patterns synchronously in `TerminalLayout`.
   - Dynamically imported `LatentGalaxy` via `React.lazy` and `React.Suspense`, code-splitting the ~530kB 3D bundle into a deferred chunk (`LatentGalaxy-*.js`) with zero initial paint layout shift (CLS: 0).

3. **Decoupled Visual State Synchronization (`VisualSyncContext`)**:
   - Provisioned `src/context/VisualSyncContext.js` exposing `useVisualSync()` with `highlightSkill` and `clearHighlight`.
   - Updated `src/components/Sections/Skills.js` to dispatch hover events on skill chips.
   - Connected `LatentGalaxy` to dynamically highlight semantic particle clusters and render glowing quadratic bezier splines (`THREE.QuadraticBezierCurve3`) connecting hovered skills to related project nodes.

4. **Resource-Conserving Animation Suspension & Accessibility Safeguards**:
   - Configured lifecycle suspension hooks: pauses `requestAnimationFrame` on `document.hidden` and viewport exit (`IntersectionObserver`).
   - Automatically respects `prefers-reduced-motion: reduce`, low hardware concurrency (`navigator.hardwareConcurrency <= 1`), and headless/unsupported WebGL environments by falling back to static poster rendering without battery drain.

## Ticket #8: Modular Admin Dashboard and NDA Case Study Management

1. **Modular Tab and Modal Component Partitioning (< 250 LOC per module)**:
   - Decomposed monolithic `Dashboard.js` into modular panels (`ProjectsTab`, `ProjectModal`, `CertificatesTab`, `CertificateModal`, `ExperienceTab`, `ExperienceModal`, `SkillsTab`, `SkillModal`, `ProfileTab`).
   - Slimmed down `Dashboard.js` to 188 LOC, acting purely as an orchestrating container managing data fetching, active tabs, and shared deletion modals.

2. **Unified Tailwind CSS v4 Design Token Component Library (`Shared/`)**:
   - Built reusable form components under `src/pages/Admin/components/Shared/` (`FormInput`, `FormSelect`, `FormTextarea`, `StatusBadge`, `AdminButton`, `ImageDropzone`) styled entirely with Tailwind CSS v4 tokens (`bg-cyber-card`, `border-cyber-border`, `text-cyan-electric`, `text-terminal-rose`).
   - Retained backward-compatible API props (e.g. `$danger`) ensuring zero breaking changes across existing patterns.

3. **Split-Screen Live Markdown Authoring with Cyber Styling**:
   - Integrated live two-pane markdown editing in `ProjectModal` and `ExperienceModal`, rendering input textarea on the left and realtime `ReactMarkdown` preview with cyber dark styling on the right.

4. **Instant In-Place Mutation for Content Tiering and Sort Ordering**:
   - Added interactive tier selectors (`featured`, `standard`, `foundation`, `archive`) and increment/decrement sorting controls (`▲`/`▼`) directly in `ProjectsTab` and `CertificatesTab` table rows.
   - Preserved full backward compatibility with Playwright E2E selectors (`button:has-text("+ New Entry")`, `input[placeholder="Title"]`, `textarea[placeholder="Description (Markdown supported)"]`, `button:has-text("Save Changes")`, `button:has-text("UPDATE SYSTEM PROFILE")`).


