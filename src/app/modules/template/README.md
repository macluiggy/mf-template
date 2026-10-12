# `template` module

Reference feature module. Every new feature of a Neocore micro-frontend starts as a copy of
this folder, made by the generator (this README is not copied):

```bash
bun run generate:module -- --name=user-profile            # module only
bun run generate:module -- --name=user-profile --expose   # module + exposed to the host
```

## Layout

| Path | Role |
|---|---|
| `template.routes.ts` | `TemplateRoutes: Routes` — the exposed entry. Root route carries `provideMfHttpClient()` |
| `pages/template-list/` | Container page: signals state, calls the service, publishes PubSub topics to the host |
| `components/template-table/` | Presentational component: `input()`/`output()` only, no services |
| `services/template.service.ts` | HTTP calls: `${environment.apiUrl}/${MsPrefixEnum.CORE}/template` + permission headers |
| `interfaces/` | Request/response types of this module |
| `enums/template-action.enum.ts` | Permission resource and actions (`x-api-key: template:listar`) |
| `constants/` | Module constants (page size, etc.) |

## Rules this module demonstrates

- Standalone components, `ChangeDetectionStrategy.OnPush`, signals, `inject()`, `@if`/`@for`/`@switch`.
  No NgModules, no `*ngIf`/`*ngFor`, no constructor injection.
- Container-presentational split: only pages inject services; components render inputs and emit outputs.
- Every request sends permission headers built with `buildPermissionHeaders(resource, action)`.
- Loading and toasts go through `PubSubService` (`loading`, `success`, `error`, ...), rendered by the host.
- Specs live next to the file they test (`*.spec.ts`, vitest): service with `HttpTestingController`,
  component through its inputs/outputs, page with mocked service and PubSub.

## After generating a module

1. Change the resource/actions in `enums/<name>-action.enum.ts` and the endpoint path in `services/`.
2. Pick the right `MsPrefixEnum` (add the prefix in `src/app/shared/enums/ms-prefix.enum.ts` if missing).
3. Standalone dev: add the lazy route to `src/app/app.routes.ts` (the generator prints it).
4. Host: expose it (`--expose`) and register the manifest row in ms-core (see `AGENTS.md`).

The generator renames `template`/`Template`/`TEMPLATE_` in file names and contents and keeps Angular
keywords (`templateUrl`, `template:`, `ng-template`, `TemplateRef`). Identifiers that merely start with
`template` (e.g. `templateItems`) are not renamed — avoid them in this module.
