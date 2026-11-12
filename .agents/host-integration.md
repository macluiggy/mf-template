# Host integration

How the host `frontcontainer` loads this remote, and the contract both sides must keep.

## How the host loads a remote

1. At boot the host reads the manifest from ms-core (`GET ${API_URL}/ms-core/authentication/manifest`;
   in DEV a local `src/assets/container.json`).
2. For each row it builds a route (`src/app/config/config-routing.ts` in the host):
   ```ts
   [entry.typeRemote === 'module' ? 'loadChildren' : 'loadComponent']: () =>
     loadRemoteModule({ remoteEntry, exposedModule: `./${entry.exposedModule}` })
       .then((m) => m[entry.exposedModule])
   ```
3. Rows with `isAuthRoute: true` go into the authenticated layout (with `menuGuard`); the rest are
   public routes.

## Registering this MF in the host

Add one manifest row per exposed entry in ms-core (no host code change is needed):

```json
{
  "name": "Template",
  "remoteEntry": "https://<mf-host>/remoteEntry.json",
  "path": "template",
  "exposedModule": "TemplateRoutes",
  "isAuthRoute": true,
  "moduleName": "Administration",
  "typeRemote": "module",
  "guards": []
}
```

| Field           | Meaning                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `name`          | Title and breadcrumb label                                                                                  |
| `remoteEntry`   | Public URL of this MF's `remoteEntry.json` (the host also accepts the old `remoteEntry.js` and rewrites it) |
| `path`          | Route path in the host; the exposed `Routes` are mounted under it                                           |
| `exposedModule` | Exposed key **without** `./`, equal to the exported symbol (`TemplateRoutes`)                               |
| `isAuthRoute`   | `true` = authenticated layout + menu guard                                                                  |
| `moduleName`    | Parent breadcrumb                                                                                           |
| `typeRemote`    | `module` for a `Routes` array (`loadChildren`), `component` for a standalone component (`loadComponent`)    |
| `guards`        | Guard names resolved by the host                                                                            |

## Exposing a module

`federation.config.mjs`:

```js
exposes: {
  './TemplateRoutes': './src/app/modules/template/template.routes.ts',
},
```

- The key (`./TemplateRoutes`) must equal the exported symbol (`export const TemplateRoutes: Routes`).
- Every exposed file is also listed in `tsconfig.federation.json` `files`.
- `bun run generate:module -- --name=<name> --expose` does both edits.
- Verify after `bun run build:federation`: `dist/browser/remoteEntry.json` → `exposes[].key`.

## Interceptors

The host never executes this app's `app.config.ts`; it only imports the exposed file. The template
follows the same rule as frontcore:

- **Hosted mode:** exposed `Routes` do **not** provide an HttpClient. Requests go through the host's
  HttpClient and its interceptors (`AuthInterceptor`, `ErrorHandlerInterceptor`, `loaderInterceptor`
  in `frontcontainer/src/app/app.config.ts`), so the host shows the loader and error toasts.
- **Standalone dev (`bun run start`):** `app.config.ts` registers `provideMfHttpClient()`
  (`src/app/shared/providers/http.providers.ts`) with the MF's own `authInterceptor`.
- Never add `provideHttpClient()`/`provideMfHttpClient()` to the `providers` of an exposed route: it
  creates a separate HttpClient that bypasses the host interceptors.

## Locale

The host (`frontcontainer`) provides no `LOCALE_ID`: the pipes of a remote mounted by the host
would default to `en-US`. The remote fixes it itself, because the host never runs the remote's
`app.config.ts` (same rule as the interceptors above).

- `app.config.ts` calls `provideNeocoreLocale()` for standalone dev.
- Every exposed `Routes` array provides it in the root route's `providers`, so a hosted remote
  formats dates, numbers and currency in Spanish (Ecuador) with USD as the default currency.

`provideNeocoreLocale()` registers Angular's locale data and provides `LOCALE_ID` (`es-EC`) and
`DEFAULT_CURRENCY_CODE` (`USD`).

The locale data is imported with a **relative** path from `node_modules`
(`../../../../node_modules/@angular/common/locales/es`), never with the bare specifier
`@angular/common/locales/*`:

- `@angular/common` is a shared singleton of the federation, so the bare specifier is an external
  of that package and is left to the import map.
- Sharing the locale files (`resolveGlob: true`) scopes the whole `@angular/common` package,
  `@angular/common/http` included, to the remote: the remote loses the host's HttpClient and its
  interceptors.
- The locale file is self-contained data, so it is bundled into the remote instead. Same approach
  as `frontbills` and `frontvirtualofficebroker`.

## PubSub contract

The host subscribes to these topics (`frontcontainer/src/app/app.component.ts`); use
`PubSubService` / `PubSubTopic`, never raw strings:

| Topic                          | Payload                  | Host reaction         |
| ------------------------------ | ------------------------ | --------------------- |
| `loading`                      | `boolean`                | Global loader on/off  |
| `error`                        | message or error payload | Error toast           |
| `success` / `warning` / `info` | `string`                 | Toast                 |
| `login-redirect`               | `boolean`                | Post-login navigation |
| `clearBreadCrumb`              | `boolean`                | Clears the breadcrumb |

- Never publish `loading(true)`/`loading(false)` by hand: the host shows one global loader, so
  overlapping operations would hide it too early. Use `LoadingTrackerService.track()`, which
  reference-counts them and publishes `loading(false)` only when the last one finishes.
- For errors, publish `pubSub.error(toUserMessage(err))`: it reads the `message` of the backend
  envelope. In hosted mode the host's error interceptor already toasts HTTP errors, so show one
  yourself only for non-HTTP failures (validation, file parsing, a rejected promise).

`pubsub-js` is skipped from federation sharing (CommonJS shape), so every app bundles its own copy.
The bus is still shared: pubsub-js registers itself on `window.PubSub` and a later copy reuses the
existing instance (it logs "PubSub already loaded, using existing version" — expected, not an error).

## Version alignment

Federation shares Angular, rxjs and tslib as `singleton + strictVersion`. The host currently runs:

| Package                                 | Version |
| --------------------------------------- | ------- |
| `@angular/*`                            | 22.2.1  |
| `@angular/build`, `@angular/cli`        | 22.2.1  |
| `@angular-architects/native-federation` | 22.2.2  |
| `typescript`                            | ~6.0.3  |
| `rxjs`                                  | ~7.8.2  |

When the host upgrades Angular, upgrade this template in the same release train and propagate to
the forks (see [`merge-changes-from-front-template.md`](merge-changes-from-front-template.md)).

## Ports

Local dev ports already in use: container 4200, core/auth 4201, virtual office broker 4211. This
template serves on **4250**; a fork picks a free port in `angular.json` (`serve.options.port`).

## Hot reload in the host

Angular's dev-server HMR only replaces stylesheets. When this remote is loaded by `frontcontainer`,
template/view edits (the template, `@if`/`@for`/`@defer` content, component styles) are applied by
the **host's** `watchLocalRemoteRebuilds()`: it listens to the remote's Native Federation
`buildNotificationsEndpoint` and hot-swaps the live component with `ɵɵreplaceMetadata`. The component
instance and its state survive and no HTTP call is repeated. Edits to logic, services or any
non-component code fall back to a full page reload by design.

Requirements: the remote runs from a `localhost` dev server and the host manifest row points at its
`remoteEntry.json` (see `frontcontainer/docs/local-development.md`). Restart `ng serve` after changing
`angular.json` polyfills. Measured on this template: ~0.8 s from file save to hot patch.

## Dev server

`bun run start` is `load-env` + `ng serve` (plain standalone SPA). To serve the remote to the host,
use `bun run start:federation` (`load-env` + `ng run <project>:serve-federation`), the same as
frontcore and frontzohoadmin: no wrapper script. Startup and rebuild time grow with the size of
the remote (exposes, components), not with extra tooling.

- HMR needs no flag: the dev server enables it by default (`hmr` defaults to `liveReload`, which is
  `true`). Template/style edits reach the host through its `watchLocalRemoteRebuilds()` hot-swap.
- `rebuildDelay: 0` (federation `serve`) skips the default 500 ms wait before each federation rebuild.
- `sourceMap: true` in `development` keeps `.ts` breakpoints in the browser.
- Angular's first rebuild after startup recompiles the whole program (slower in large remotes);
  later rebuilds are incremental.

