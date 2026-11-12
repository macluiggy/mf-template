# `template` module

Reference feature module. Every new feature of a Neocore micro-frontend starts as a copy of
this folder, made by the generator (this README is not copied):

```bash
bun run generate:module -- --name=user-profile            # module only
bun run generate:module -- --name=user-profile --expose   # module + exposed to the host
```

## Layout

| Path                            | Role                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `template.routes.ts`            | `TemplateRoutes: Routes` — the exposed entry. No HttpClient providers: hosted requests use the host's interceptors |
| `pages/template-list/`          | Container page: signals state, calls the service, reports through `Notifier`/`LoadingTrackerService`               |
| `components/template-table/`    | Presentational component: `input()`/`output()` only, no services                                                   |
| `services/template.service.ts`  | HTTP calls: `${environment.apiUrl}/${TEMPLATE_API_PATH}`                                                            |
| `interfaces/`                   | Request/response types of this module                                                                              |
| `enums/template-action.enum.ts` | Permission resource and actions, for `PermissionChecker`/`permissionGuard`                                         |
| `constants/`                    | Module constants: page size, endpoint path                                                                         |

## Rules this module demonstrates

- Standalone components, `ChangeDetectionStrategy.OnPush`, signals, `inject()`, `@if`/`@for`/`@switch`.
  No NgModules, no `*ngIf`/`*ngFor`, no constructor injection.
- Container-presentational split: only pages inject services; components render inputs and emit outputs.
- Loading and toasts go through the `Notifier` port (`loading`, `success`, `error`, ...); overlapping
  requests use `LoadingTrackerService` so the loader is ref-counted. The default adapter logs to the
  console; `provideNeocoreHost()` publishes the host's topics.
- Permissions go through the `PermissionChecker` port or `permissionGuard(resource, action)`; the
  default allows everything, the NEOCORE integration reads the host's payloads.
- HTTP is generic: `environment.apiUrl` plus a module-local path constant. Host-specific pieces
  (`x-api-key` via `buildPermissionHeaders`, `MsPrefixEnum`, device info) live in
  `src/app/integrations/neocore/`, never in a feature module.
- Specs live next to the file they test (`*.spec.ts`, vitest): service with `HttpTestingController`,
  component through its inputs/outputs, page with mocked service and `Notifier`.

## After generating a module

1. Change the resource/actions in `enums/<name>-action.enum.ts` and the endpoint path in
   `constants/<name>.constants.ts`.
2. Standalone dev: add the lazy route to `src/app/app.routes.ts` (the generator prints it).
3. Host: expose it (`--expose`) and register the manifest row in ms-core (see `AGENTS.md`).

The generator renames `template`/`Template`/`TEMPLATE_` in file names and contents and keeps Angular
keywords (`templateUrl`, `template:`, `ng-template`, `TemplateRef`). Identifiers that merely start with
`template` (e.g. `templateItems`) are not renamed — avoid them in this module.
