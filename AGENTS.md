# AGENTS.md (Repository Guide for Coding Agents)

AI Translator is a cross-browser (Chrome/Firefox) MV3 extension with a small Bun-based build script.

## Quick Start

- Chrome/Chromium: `chrome://extensions/` → enable Developer mode → “Load unpacked”.
- Firefox: `about:debugging#/runtime/this-firefox` → “Load Temporary Add-on…”.
- Source layout is flat (most code in repo root).
- Build output goes to `dist/` (generated, gitignored).

## Commands (Build / Lint / Test)

### Prereqs

- Install Bun: https://bun.sh

### Build

- Build Chrome + Firefox into `dist/`: `bun run build.ts`
- Build + zip artifacts: `bun run build.ts --zip`
- Legacy bash build (also zips): `./build.sh`

Notes:
- GitHub Actions uses `bun run build.ts --zip` (`.github/workflows/release.yml`).
- Don’t edit anything under `dist/` by hand.

### Lint / Format

There is no ESLint/typecheck configured in `package.json`. Formatting is via Prettier.

- Check formatting: `prettier --check .`
- Format all: `prettier --write .`
- Format one file: `prettier --write background.js`

If Prettier isn’t installed globally:
- `bunx prettier --check .` (or `--write .`)
- `npx prettier --check .`

Important:
- `**/*.min.js` is ignored by Prettier (`.prettierignore`). Do not reformat vendored/minified files.

### Tests

No automated test runner is currently configured (no `test` script, no vitest/jest, etc.).

Manual smoke checks:
- Context menu → “Translate Selected Text” shows popup + result.
- Context menu → “Translate Entire Page” shows indicator + applies translation.
- Options page persists provider settings (`chrome.storage.sync`).
- Full-page translation on a link-heavy page (e.g., Wikipedia) preserves anchor tags and hrefs.
- Formatting-heavy page (tables, lists, code blocks) keeps structure and inline styling.
- Regression: no placeholder artifacts or missing HTML after full-page translation.

Single-test guidance:
- N/A today.
- If/when tests are added, document both:
  - “run one file” (e.g., `bun test path/to/foo.test.js`)
  - “run one test by name” (framework-specific; for Bun’s runner: `bun test path/to/foo.test.js --test-name-pattern "regex"`).

## Cursor / Copilot Rules

- No Cursor rules found in `.cursor/rules/` or `.cursorrules`.
- No Copilot rules found in `.github/copilot-instructions.md`.

## Code Style & Conventions

### Formatting (from `.prettierrc`)

- 4 spaces indent (`tabWidth: 4`)
- Semicolons (`semi: true`)
- Double quotes (`singleQuote: false`)
- Trailing commas where valid (`trailingComma: "all"`)
- Wrap at 90 chars (`printWidth: 90`)

### JavaScript / TypeScript

- Extension runtime is plain JS (`background.js`, `content.js`, `options.js`).
- `build.ts` is TypeScript running on Bun.
- Prefer `const`; use `let` only when reassigned.
- Prefer `async/await` over promise chains where it improves readability.

### Imports (mainly `build.ts`)

- Order: built-in → third-party → local.
- Keep import specifiers grouped and sorted.

### Naming

- Constants: `UPPER_SNAKE_CASE` (e.g., `PROVIDER_DEFAULTS`).
- Functions/vars: `camelCase`.
- Booleans: `isX` / `hasX` / `shouldX`.
- DOM ids/classes: keep aligned with `options.html`.

### Types / Data Shapes

- Do not introduce TS-only syntax in `*.js`.
- Prefer JSDoc when “types” help (fetch payloads, storage shapes, message payloads).

Storage schema conventions:
- Uses `chrome.storage.sync`.
- Provider-scoped settings:
  - `providerSettings[provider] = { apiKey, apiEndpoint, modelName, translationInstructions }`
- Backwards compatibility exists for legacy flat keys (`apiKey`, `apiEndpoint`, `apiType`, `modelName`).

### Error Handling

- Fail early with user-actionable messages.
- Never log secrets (API keys); mask/omit them.

Extension patterns:
- For `chrome.*` callback APIs, check `chrome.runtime.lastError`.
- For `chrome.runtime.onMessage`, `return true` when responding asynchronously.
- Wrap `fetch` in `try/catch`; include HTTP status and safe response details in errors.
- Throw `Error` objects with context (provider/action/status), not raw strings.

### Logging

- Keep `console.log` noise reasonable.
- Use `console.warn` for recoverable issues and `console.error` for failures.
- Avoid logging full-page HTML or large responses unless debugging.

### Security & Safety

- Treat anything touching the DOM as untrusted.
- When inserting translated HTML, sanitize it (repo includes `purify.min.js`; used by `content.js`).
- Don’t weaken Content Security Policy in manifests.
- Avoid `eval`/`new Function`.

Secrets:
- Never commit keys; `private-key.pem` may exist locally and is gitignored.

### Browser Extension Constraints

- Chrome: `background.js` is MV3 service worker; keep it event-driven.
- Firefox: uses `manifest.firefox.json`; don’t assume Chrome-only manifest fields.

## What Not To Touch

- `dist/` (generated build output)
- `*.min.js` (vendored/minified)
- Manifest permissions/versions unless required for a change

## When Making Changes

- If a manifest field changes, update both `manifest.json` and `manifest.firefox.json`.
- Keep provider lists/defaults in sync between `background.js` and `options.js`.
