# Testing

| Command                | Runs                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `bun run test`         | `load-env --example` (only `.env.example`, never your `.env`; no remote call) → Angular unit tests (vitest via `@angular/build:unit-test`, jsdom) → `test:scripts` |
| `bun run test:watch`   | Angular unit tests in watch mode                                                                                 |
| `bun run test:scripts` | `node --test` for `scripts/**/*.test.js` (generator)                                                             |

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

## Test kit

`src/testing/` ships the doubles for the shared services, so a spec never
hand-rolls them. Import from `src/testing` (never from the individual files):

| Helper                                     | Use it when…                                                          |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `createPubSubMock()` / `providePubSubMock()` | The spec asserts what the page published to the host (loader, toasts) |
| `createStorageMock(initial?)` / `provideStorageMock(initial?)` | The spec needs the encrypted localStorage (token, session) |
| `provideHttpTesting()`                     | The spec flushes the requests of a service with `HttpTestingController` |

```ts
import { provideHttpTesting, providePubSubMock } from '../../testing';

const { mock: pubsub, providers } = providePubSubMock();

TestBed.configureTestingModule({ providers: [provideHttpTesting(), ...providers] });
```

The kit is test-only: `tsconfig.app.json` excludes `src/testing/**`, so it
never reaches the app bundle.

The `test` architect target builds through `build-test` (plain `@angular/build:application`, no
federation, no `es-module-shims`) because the federation builder cannot be used by `unit-test`.

`vitest.config.ts` (the `runnerConfig` of the `test` target) holds the few options the Angular
builder does not own, such as inlining `@neocore/lib-components`. It is CommonJS on purpose:
`package.json` has no `"type": "module"`. Forks with zone.js and `fakeAsync` specs add
`zone.js/plugins/vitest-patch` to the `build-test` polyfills; migrating a Karma fork is covered in
the merge skill's `references/vitest-migration.md`.

## Test kit

`src/testing/` holds test-only doubles (excluded from `tsconfig.app.json`, so they never reach the
bundle). Import them from `src/testing` instead of writing a mock per spec:

| Helper | Use it when |
|---|---|
| `providePubSubMock()` → `{ mock, providers }` | The code under test talks to the host (loader, toasts); assert on `mock.loading`, `mock.error`… |
| `provideStorageMock(initial?)` → `{ mock, providers }` | The code reads/writes encrypted localStorage; seed it with `initial` (no `SECRET_KEY` needed) |
| `provideHttpTesting()` | A service spec that makes HTTP calls; pair it with `TestBed.inject(HttpTestingController)` |

`template-list.page.spec.ts` is the reference: the generator copies it into every new module.
If a fork needs another shared double, add it here (one file, exported from `index.ts`) instead of
in the fork.

