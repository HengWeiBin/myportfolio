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
