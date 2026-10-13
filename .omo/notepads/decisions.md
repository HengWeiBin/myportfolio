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
