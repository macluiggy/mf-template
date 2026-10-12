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

| Field | Meaning |
|---|---|
| `name` | Title and breadcrumb label |
| `remoteEntry` | Public URL of this MF's `remoteEntry.json` (the host also accepts the old `remoteEntry.js` and rewrites it) |
| `path` | Route path in the host; the exposed `Routes` are mounted under it |
| `exposedModule` | Exposed key **without** `./`, equal to the exported symbol (`TemplateRoutes`) |
| `isAuthRoute` | `true` = authenticated layout + menu guard |
| `moduleName` | Parent breadcrumb |
| `typeRemote` | `module` for a `Routes` array (`loadChildren`), `component` for a standalone component (`loadComponent`) |
| `guards` | Guard names resolved by the host |

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
- Verify after `bun run build`: `dist/browser/remoteEntry.json` → `exposes[].key`.

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

## PubSub contract

The host subscribes to these topics (`frontcontainer/src/app/app.component.ts`); use
`PubSubService` / `PubSubTopic`, never raw strings:

| Topic | Payload | Host reaction |
|---|---|---|
| `loading` | `boolean` | Global loader on/off |
| `error` | message or error payload | Error toast |
| `success` / `warning` / `info` | `string` | Toast |
| `login-redirect` | `boolean` | Post-login navigation |
| `clearBreadCrumb` | `boolean` | Clears the breadcrumb |

`pubsub-js` is skipped from federation sharing (CommonJS shape), so every app bundles its own copy.
The bus is still shared: pubsub-js registers itself on `window.PubSub` and a later copy reuses the
existing instance (it logs "PubSub already loaded, using existing version" — expected, not an error).

## Version alignment

Federation shares Angular, rxjs and tslib as `singleton + strictVersion`. The host currently runs:

| Package | Version |
|---|---|
| `@angular/*` | 22.1.7 |
| `@angular/build`, `@angular/cli` | 22.1.8 |
| `@angular-architects/native-federation` | 22.1.3 |
| `typescript` | ~6.0.3 |
| `rxjs` | ~7.8.2 |

When the host upgrades Angular, upgrade this template in the same release train and propagate to
the forks (see [`merge-changes-from-front-template.md`](merge-changes-from-front-template.md)).

## Ports

Local dev ports already in use: container 4200, core/auth 4201, virtual office broker 4211. This
template serves on **4250**; a fork picks a free port in `angular.json` (`serve-original.options.port`).
