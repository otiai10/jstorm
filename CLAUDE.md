# CLAUDE.md

## Project Overview

**jstorm** is a JavaScript/TypeScript Storage ORM (Object-Relational Mapper) for LocalStorage, Chrome Storage API, and custom data stores. It provides ActiveRecord-style CRUD operations over pluggable storage backends.

- **Version**: 0.17.0
- **License**: MIT
- **Author**: otiai10
- **NPM package**: `jstorm`

## Quick Reference

```bash
# Install dependencies
pnpm install

# Run unit tests
pnpm test

# Run unit tests with coverage
pnpm test -- --coverage

# Build the library (TypeScript -> lib/)
pnpm run build:lib

# Run E2E tests (builds lib + extension, runs Puppeteer)
pnpm run e2e

# Run all tests (unit + E2E)
pnpm run test:all

# Full build (lib + E2E + docs)
pnpm run build

# Clean build artifacts
pnpm run clean
```

## Repository Structure

```
jstorm/
├── src/                        # TypeScript source code
│   ├── index.ts                # Main entry: exports Model and Types
│   ├── interface.ts            # StorageArea interface definition
│   ├── model/
│   │   └── index.ts            # Core Model class (CRUD, ID generation, schema)
│   ├── types/                  # Schema type system for validation
│   │   ├── index.ts            # Exports: bool, string, date, model, arrayOf, dictOf, shape
│   │   ├── base.ts             # TypeCheckFunc interface and base validator
│   │   ├── primitive.ts        # Primitive type checkers (string, number, bool)
│   │   ├── model.ts            # Model reference type checker (with eager loading)
│   │   ├── arrayof.ts          # Array type checker
│   │   ├── dictof.ts           # Dictionary type checker
│   │   ├── date.ts             # Date type checker (JSON -> Date deserialization)
│   │   └── shape.ts            # Object shape type checker
│   ├── browser/                # Browser WebStorage adapters
│   │   ├── local/index.ts      # window.localStorage backend
│   │   └── session/index.ts    # window.sessionStorage backend
│   ├── chrome/                 # Chrome extension storage adapters
│   │   ├── local/index.ts      # chrome.storage.local backend
│   │   └── sync/index.ts       # chrome.storage.sync backend
│   ├── runtime/
│   │   ├── node/index.ts       # Node.js in-memory storage backend
│   │   └── onmemory.ts         # In-memory WebStorage implementation
│   └── polyfill/
│       └── index.ts            # WebStorage -> chrome.storage.StorageArea adapter
├── tests/                      # Jest unit tests
│   ├── all.spec.ts             # Main test suite (CRUD, schema, relations)
│   └── onmemory.spec.ts        # In-memory storage tests
├── e2e/                        # End-to-end tests
│   ├── run.ts                  # Puppeteer test runner
│   └── app/                    # Chrome extension test app
│       ├── manifest.json
│       └── src/background.js   # Service worker test code
├── docs/                       # Documentation / demo app
│   ├── main.tsx                # React TODO app demo
│   └── index.html
├── lib/                        # Compiled output (gitignored)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── jest.config.ts
├── jest.setup.ts               # Chrome storage mock for tests
└── Makefile                    # Release/publish tasks
```

## Tech Stack

- **Language**: TypeScript 5.4, compiled to ES5
- **Package manager**: pnpm (v9)
- **Test framework**: Jest 29 with ts-jest preset
- **E2E testing**: Puppeteer (headless Chrome)
- **Bundler**: Parcel 2 (for E2E and docs only; library uses plain tsc)
- **Production dependencies**: None (zero-dependency library)

## Development Workflow

### Running Tests

Unit tests use Jest with a mock `chrome.storage.local` provided in `jest.setup.ts`:

```bash
pnpm test
```

Tests are in `tests/all.spec.ts` and `tests/onmemory.spec.ts`. The test environment is Node.js with a mock chrome storage object.

### Building

The library compiles TypeScript to JavaScript with type declarations:

```bash
pnpm run build:lib    # Outputs to lib/
```

The `tsconfig.json` explicitly lists entry files (not a wildcard). Output goes to `lib/` with CommonJS module format and ES5 target.

### Release Process

```bash
make release    # clean + install + build + copy package files to release/
make publish    # release + pnpm publish ./release
```

The release directory contains the compiled `lib/` output plus `package.json`, `pnpm-lock.yaml`, and `README.md`.

## Architecture

### Storage Backend Pattern

All storage backends implement the `chrome.storage.StorageArea` interface. The library provides a polyfill (`src/polyfill/`) that adapts browser's `WebStorage` (localStorage/sessionStorage) to this interface.

Users select a storage backend by importing from a specific path:

```typescript
import { Model } from "jstorm/chrome/local";    // chrome.storage.local
import { Model } from "jstorm/chrome/sync";      // chrome.storage.sync
import { Model } from "jstorm/browser/local";    // window.localStorage
import { Model } from "jstorm/browser/session";  // window.sessionStorage
import { Model } from "jstorm/runtime/node";     // In-memory (Node.js/testing)
```

Each adapter module re-exports the `Model` class with `_area_` pre-configured to the appropriate storage.

### Data Model

- Models extend `Model` (which extends `IDProvider`)
- Records are stored as JSON under a namespace key (defaults to class name)
- Storage format: `{ "ModelName": { "id1": {...}, "id2": {...} } }`
- Instance `_id` is null until first `save()`, then auto-generated

### ID Generation Strategies

- `randomShortID()` (default): `Math.random().toString(36).slice(2)`
- `timestampID()`: `String(Date.now())`
- `sequentialID(ensemble)`: Increment from the highest existing ID

Override via: `static _nextID_ = Model.timestampID;`

### Schema & Type System

Models define schemas using `Types` for validation and deserialization:

```typescript
class Player extends Model {
    static schema = {
        name: Types.string.isRequired,
        score: Types.number,
        team: Types.model(Team, { eager: true }),
        tags: Types.arrayOf(Types.string),
        joined: Types.date,
    };
}
```

Type checkers support `.isRequired` and optional `.load()` for deserialization (e.g., JSON string -> Date object, or eager-loading related models).

### Volatile Properties

Properties prefixed with `$` are volatile and excluded from persistence. They are set to `undefined` during `save()`.

## Code Conventions

- **Classes**: PascalCase (`Model`, `Player`, `Team`)
- **Methods/functions**: camelCase (`save()`, `create()`, `__decode__()`)
- **Internal methods**: Double underscore prefix/suffix (`__ns__()`, `__rawdict__()`, `__decode__()`, `__volatilize__()`)
- **Constants**: SCREAMING_SNAKE_CASE (`JSTORM_VOLATILITY_PREFIX`)
- **Volatile properties**: `$` prefix (not persisted)
- **API**: All storage operations are async (return `Promise`)
- **Static properties**: `_area_`, `_namespace_`, `schema`, `default` (with underscore-wrapped names for overridable internal props)

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **node.yml**: Runs unit tests on ubuntu-latest, macos-latest, windows-latest with Node 20. Uploads coverage to Codecov.
- **chrome-test.yml**: Runs E2E tests on macos-latest with headless Chrome.
- **deploy-page.yml**: Builds and deploys documentation site.
- **npm-publish.yml**: Publishes to npm registry on release.

Triggered on pushes and PRs to `main` and `develop` branches.

## Key Files for Common Tasks

| Task | Files |
|------|-------|
| Add a new storage backend | `src/polyfill/index.ts`, create new adapter in `src/<backend>/` |
| Add a new Type checker | `src/types/base.ts` (interface), create new file in `src/types/`, export from `src/types/index.ts` |
| Modify CRUD behavior | `src/model/index.ts` |
| Add unit tests | `tests/all.spec.ts` |
| Update Chrome storage mock | `jest.setup.ts` |
| Change build targets | `tsconfig.json` (lib), `package.json` targets (parcel) |
