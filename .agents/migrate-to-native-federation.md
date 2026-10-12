# Migrate to Native Federation

How to turn this standalone app back into a Neocore-style remote loaded by a host (for example
`frontcontainer`). The reference implementation is the upstream `front-template` repository: when
in doubt, diff against it (`git diff upstream/main -- <path>`).

The feature layout already matches what a remote exposes (`<Feature>Routes` arrays), so the
migration only adds the federation build and the host contract.

## 1. Pin versions to the host

Federation shares Angular, rxjs and tslib as strict singletons. Pin `@angular/*`, `@angular/build`,
`@angular/cli`, `typescript` and `rxjs` **exactly** to the host's versions (no `^`/`~`), then
`bun install`. A drift fails loudly at load time.

## 2. Add Native Federation

```bash
bun add @angular-architects/native-federation@<host version> es-module-shims
ng add @angular-architects/native-federation --project app-template --port 4250 --type remote
```

Review what the schematic generated against upstream: `angular.json` keeps an `esbuild` target
(`@angular/build:application`, polyfills `es-module-shims`) wrapped by
`@angular-architects/native-federation:build` for `build` and `serve`, and the `test` target builds
through a plain `build-test` target (the federation builder cannot be used by `unit-test`).

## 3. `federation.config.mjs`

Expose every feature as `./<Feature>Routes`; the key **must equal** the exported symbol, because the
host resolves `m[exposedModule]`:

```js
exposes: {
  './TemplateRoutes': './src/app/modules/template/template.routes.ts',
},
```

Copy the `shared` policy (`shareAll` strict singletons, `includeSecondaries` for `@angular/common`,
`@angular/platform-browser`, `rxjs`) and the `skip` list (CommonJS packages such as
`encrypt-storage`) from upstream. List every exposed file in `tsconfig.federation.json` `files`.
Give the remote a `name` unique across the host manifest.

## 4. Two-step bootstrap

```ts
// src/main.ts
import { initFederation } from '@angular-architects/native-federation';
initFederation({}, { sse: false })
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
```

Move the current `bootstrapApplication(App, appConfig)` to `src/bootstrap.ts`.

## 5. Host HttpClient rule

When hosted, the host never runs this app's `app.config.ts`. Exposed `Routes` must **not** provide
an HttpClient: requests go through the host's HttpClient and interceptors (auth, errors, loader).
Keep `provideAppHttpClient()` only in `app.config.ts` for standalone development. Loader and toasts
move to the host's PubSub topics (see upstream `PubSubService`).

## 6. SECRET_KEY rule

The host writes the access token to encrypted localStorage. `SECRET_KEY` must be **identical to the
host's**, and `StorageEnum` names must match the host's byte for byte; otherwise reads silently
return `undefined` and requests go out without `Authorization`.

## 7. Deployment and registration

- nginx must send CORS headers (the host fetches `remoteEntry.json` and chunks cross-origin) and
  must not cache `remoteEntry.json`. Take `nginx.conf` from upstream.
- Register one manifest row per exposed entry in the host (ms-core), with `exposedModule`
  `<Feature>Routes` and `typeRemote: 'module'`.
- Verify: `bun run build` produces `dist/browser/remoteEntry.json` listing every exposed key.
