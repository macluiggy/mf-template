# Testing

| Command | Runs |
|---|---|
| `bun run test` | `load-env` (no remote call) → Angular unit tests (vitest via `@angular/build:unit-test`, jsdom) → `test:scripts` |
| `bun run test:watch` | Angular unit tests in watch mode |
| `bun run test:scripts` | `node --test` for `scripts/**/*.test.js` (generator) |

## Rules

- Specs live next to the file they test (`*.spec.ts`). Globals (`describe`, `it`, `expect`, `vi`)
  come from `vitest/globals`.
- Behavior changes start with a failing test (RED), then the implementation (GREEN).
- Before modifying existing code without tests, add characterization tests of the current behavior.
- Services: `provideHttpClient()` + `provideHttpClientTesting()` and `HttpTestingController`; assert
  URL, params and permission headers; `controller.verify()` in `afterEach`.
- Presentational components: drive them with `fixture.componentRef.setInput()` and subscribe to
  outputs; no service mocks needed.
- Pages: provide mocked services with `{ provide: X, useValue: {...} }` and assert rendering and
  PubSub calls.
- Interceptors: `provideHttpClient(withInterceptors([fn]))` + `HttpTestingController`.
- Tests must be deterministic and offline: never hit `API_URL`.

The `test` architect target builds through `build-test` (plain `@angular/build:application`, no
federation, no `es-module-shims`) because the federation builder cannot be used by `unit-test`.
