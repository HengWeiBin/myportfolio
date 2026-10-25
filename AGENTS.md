# AGENTS.md - AI Coding Agent Instructions

## Project Overview

Personal portfolio website for a Machine Learning Engineer. React 19 SPA with a terminal/dark-theme aesthetic, Vite toolchain, Neon serverless PostgreSQL database, Cloudflare R2 object storage via Netlify Functions, and styled-components + Tailwind CSS v4.

- **Stack**: Pure JavaScript (ES6+), React 19 (`createRoot`), Vite (`vite` v6)
- **Styling**: `styled-components` v5 (transient `$props`), Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Database**: Neon PostgreSQL serverless (`@netlify/neon`)
- **Storage & Serverless**: Cloudflare R2 via Netlify Functions (`@aws-sdk/client-s3`), proxied locally via Vite `server.proxy`
- **Routing**: `react-router-dom` v6
- **Testing**: Vitest (`vitest` v3) + React Testing Library (`jsdom` environment), Playwright E2E

---

## Build / Dev / Test Commands

### Development
```bash
# Start Vite dev server (http://localhost:3000)
npm start

# Start Netlify Functions server (http://localhost:9999)
npm run start:functions

# Start full dev environment in parallel (Vite :3000 + Functions :9999 via npm-run-all)
npm run dev

# Netlify local development environment (proxies frontend and functions via Netlify CLI)
netlify dev
```

### Production Build & Deployment
```bash
# Production build (outputs to ./build via vite build)
npm run build

# Deploy build directory to GitHub Pages (gh-pages)
npm run deploy
```

### Linting (Biome)
```bash
# Run Biome linter across src, netlify, and scripts
npm run lint
```

### Unit Tests (Vitest + React Testing Library)
```bash
# Single test run (CI mode)
npm test

# Run tests in interactive watch mode
npm run test:watch

# Run a specific test file or name pattern
npm test -- src/App.test.js
npm test -- -t "renders terminal portfolio navigation"
```

### E2E Tests (Playwright)
```bash
# Run end-to-end tests (targets http://localhost:3000, configured in playwright.config.js)
npx playwright test

# Run Playwright test with UI runner
npx playwright test --ui

# View latest Playwright test report
npx playwright show-report
```
*Note: Playwright's `webServer` automatically boots `npm start` on port 3000 if not already running.*

---

## Git Branching & Release Discipline

- **Default Development Branch (`dev`)**:
  - The default working branch for all daily development, WIP features, agent skills, documentation, migration scripts, and tests is `dev`.
  - All new feature branches and agent PRs/commits must target `dev`.
- **Production Release Branch (`master`)**:
  - `master` is reserved strictly for production deployment releases affecting the live frontend (`src/`, `public/`, `index.html`) or serverless functions (`netlify/functions/`).
  - Do NOT commit or push non-frontend changes directly to `master`.
- **Local Verification & TDD Guardrail**:
  - Before committing or pushing, all changes must pass `npm run lint` and `npm test` locally.
  - **No GitHub Actions CI workflow** is configured or used in this repository. Local verification with `npm test` and `npm run lint` is mandatory and acts as the sole quality gate.

---

## Project Structure

```
.
├── index.html                        # Vite entry HTML template pointing to /src/index.js
├── vite.config.js                    # Vite configuration (React, proxy :9999, outDir build, Vitest)
├── netlify/
│   └── functions/
│       ├── get-upload-url.js         # Presigned PUT URL generator for R2 uploads
│       └── delete-storage-object.js  # R2 object deletion endpoint
├── netlify.toml                      # Netlify build, redirects & function config
├── playwright.config.js              # Playwright configuration (port 3000)
├── tests/
│   └── admin.spec.js                 # Playwright E2E tests (auth, CRUD, tabs)
├── src/
│   ├── index.js                      # Entry point (React 19 createRoot)
│   ├── App.js                        # Client router (<BrowserRouter>, <Routes>)
│   ├── components/
│   │   ├── Background/               # Canvas animations (LatentSpace.js)
│   │   ├── Common/                   # Reusable components (Loading.js)
│   │   ├── Hero/                     # Hero section components (TrainingLog.js)
│   │   ├── Layout/                   # Layout wrappers (TerminalLayout.js)
│   │   └── Sections/                 # Page sections (Hero, Skills, Projects, etc.)
│   ├── context/
│   │   └── ProfileContext.js         # Profile state management
│   ├── pages/
│   │   └── Admin/                    # Admin panel (Login.js, Dashboard.js, AdminLayout.js)
│   ├── services/
│   │   ├── api.js                    # Neon DB queries (projects, certs, skills, experience, profile)
│   │   ├── auth.js                   # Client-side session & auth helpers
│   │   ├── db.js                     # Neon client initialization (@netlify/neon)
│   │   └── upload.js                 # Client R2 upload and delete caller functions
│   └── styles/
│       └── GlobalStyles.js           # Theme variables and global styles
└── docs/agents/                      # Agent workflows (issue-tracker, triage-labels, domain)
```

---

## Architecture & Code Guidelines

### Pure JavaScript & React 19
- **Pure JavaScript**: Do NOT introduce TypeScript (`.ts`/`.tsx`). Use ES6+ (`.js`).
- **Vite JSX Support**: Configured in `vite.config.js` to transform JSX syntax in `.js` files using `transformWithEsbuild`.
- **React 19 Roots**: Always use `createRoot` (`src/index.js`).
- **Component Style**: Functional components with hooks (`useState`, `useEffect`, `useRef`, `useCallback`).

### Styling & CSS-in-JS
- **styled-components v5**: Use `$` prefix for transient props (e.g. `$primary`, `$isActive`) to avoid leaking non-standard attributes to the DOM.
- **Tailwind CSS v4**: Processed via `@tailwindcss/postcss`. Use alongside styled-components where convenient.
- **CSS Variables**: Core theme variables are declared in `src/styles/GlobalStyles.js`:
  - Backgrounds: `var(--bg-color)`, `var(--bg-dark)`
  - Text: `var(--text-primary)`, `var(--text-secondary)`
  - Accents: `var(--accent)`, `var(--border-color)`
  - States: `var(--success)`, `var(--warning)`, `var(--danger)`
  - Fonts: `var(--font-mono)` (`Fira Code`), `var(--font-sans)` (`Inter`)

### Neon PostgreSQL Database
- Client instantiated via `neon(process.env.REACT_APP_DATABASE_URL)` in `src/services/db.js`.
- **Parameterized queries only**: Always use tagged template literals (`sql`...``). Never concatenate or interpolate raw strings into queries:
  ```javascript
  import sql from './db';

  // CORRECT: Parameterized
  const project = await sql`SELECT * FROM projects WHERE id = ${id}`;

  // INCORRECT: Prone to SQL injection
  // const project = await sql`SELECT * FROM projects WHERE id = '${id}'`;
  ```

### Cloudflare R2 Storage & Netlify Functions
- **Upload Flow**:
  1. Client calls `uploadImageToR2(file, table)` in `src/services/upload.js`.
  2. Sends request to `POST /.netlify/functions/get-upload-url` with `x-admin-key`.
  3. Function validates key and returns a presigned S3 PUT URL + public access URL.
  4. Client directly PUTs file binary to Cloudflare R2 bucket.
- **Delete Flow**:
  1. Client calls `deleteImageFromR2(imageUrl)` in `src/services/upload.js`.
  2. Parses R2 object key using `REACT_APP_R2_PUBLIC_BASE_URL`.
  3. Sends request to `POST /.netlify/functions/delete-storage-object` with `x-admin-key`.
- **Local Dev Proxy**: Handled via Vite's `server.proxy` configuration in `vite.config.js`, forwarding `/.netlify/functions/*` to `http://localhost:9999` so client requests resolve seamlessly during `npm run dev`.

---

## Environment Variables

| Variable | Target Environment | Purpose |
|---|---|---|
| `REACT_APP_DATABASE_URL` | Client (`.env`, Netlify) | Neon PostgreSQL connection string |
| `R2_ACCESS_KEY_ID` | Netlify Functions | Cloudflare R2 S3 API access key ID |
| `R2_SECRET_ACCESS_KEY` | Netlify Functions | Cloudflare R2 S3 API secret access key |
| `R2_BUCKET_NAME` | Netlify Functions | Target Cloudflare R2 bucket name |
| `R2_ENDPOINT_URL` | Netlify Functions | Cloudflare S3 endpoint (`https://<account_id>.r2.cloudflarestorage.com`) |
| `R2_PUBLIC_BASE_URL` | Netlify Functions | Base URL for public asset delivery (`https://pub-<id>.r2.dev`) |
| `REACT_APP_R2_PUBLIC_BASE_URL` | Client (`.env`, Netlify) | Base URL prefix used by client to resolve R2 keys for deletion |
| `ADMIN_API_KEY` | Netlify Functions | Shared secret for securing Netlify storage endpoints |
| `REACT_APP_ADMIN_API_KEY` | Client (`.env`, Netlify) | Embedded secret sent in `x-admin-key` header (must match `ADMIN_API_KEY`) |

*Local `.env` must define `REACT_APP_*` variables for CRA/Vite and server variables when running functions. Vite config exposes `process.env.REACT_APP_*` for backward compatibility.*

---

## Agent Documentation Pointers

Agent workflow documentation lives in `docs/agents/`:
- **Issue Tracker**: GitHub Issues via `gh` CLI. See [docs/agents/issue-tracker.md](file:///d:/Users/WBSC1/Documents/Github/myportfolio/docs/agents/issue-tracker.md).
- **Triage Labels**: Canonical triage taxonomy (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See [docs/agents/triage-labels.md](file:///d:/Users/WBSC1/Documents/Github/myportfolio/docs/agents/triage-labels.md).
- **Domain Docs**: Architecture decision records and glossary format. See [docs/agents/domain.md](file:///d:/Users/WBSC1/Documents/Github/myportfolio/docs/agents/domain.md).
