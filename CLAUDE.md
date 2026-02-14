# CLAUDE.md

TypeScript Storage ORM for LocalStorage, Chrome Storage API, and custom stores. Zero production dependencies.

## Commands

```bash
pnpm install              # Install dependencies
pnpm test                 # Run unit tests (Jest)
pnpm test -- --coverage   # Unit tests with coverage
pnpm run build:lib        # Compile TypeScript -> lib/
pnpm run e2e              # E2E tests (Puppeteer + Chrome)
pnpm run test:all         # Unit + E2E
```

## Project Structure

- `src/model/index.ts` — Core Model class (CRUD operations, ID generation, schema decoding)
- `src/types/` — Schema type system (`Types.string`, `.number`, `.bool`, `.date`, `.model()`, `.arrayOf()`, `.dictOf()`, `.shape()`)
- `src/chrome/`, `src/browser/`, `src/runtime/` — Storage backend adapters (each re-exports Model with `_area_` pre-configured)
- `src/polyfill/index.ts` — Adapts WebStorage to `chrome.storage.StorageArea` interface
- `tests/all.spec.ts` — Main test suite; `jest.setup.ts` — Chrome storage mock
- `e2e/` — Puppeteer-based Chrome extension E2E tests

## Conventions

- All storage operations are **async** (return `Promise`)
- `$`-prefixed properties are **volatile** (not persisted to storage)
- Internal methods use double underscores: `__ns__()`, `__rawdict__()`, `__decode__()`, `__volatilize__()`
- Overridable static props use underscore wrapping: `_area_`, `_namespace_`, `_nextID_`
- Storage backend is selected by import path: `jstorm/chrome/local`, `jstorm/browser/local`, `jstorm/runtime/node`, etc.
- `tsconfig.json` explicitly lists entry files (not a wildcard)
- Library is compiled to ES5/CommonJS via `tsc` (Parcel is only for E2E and docs)

## CI

GitHub Actions runs on pushes/PRs to `main` and `develop`:
- Unit tests on Ubuntu, macOS, Windows (Node 20) with Codecov upload
- E2E Chrome extension tests on macOS
