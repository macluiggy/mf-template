# AGENTS.md

Context for AI agents (Claude Code, Copilot, Cursor, OpenCode, ...) working in this repo.
`front-template` is the base of every Neocore micro-frontend (MF): it is cloned/forked to start a
new MF and is never deployed as-is. It is an Angular 22 **remote** loaded at runtime by the host
`frontcontainer` through Native Federation.

This file is the **compass**: a short map of what already exists plus the mandatory rules. Details
live in [`.agents/`](.agents/); open the relevant doc before touching that area.

## Mandatory rules

- ⚠️ **Before building anything shared (`src/app/shared/`), check the capability map below** — reuse
  what exists instead of reimplementing it.
- ⚠️ **If you add, change the contract of, or remove a shared capability, update its map row in the
  same commit.** Fork-only capabilities go in [`.agents/capabilities.local.md`](.agents/capabilities.local.md).
- ⚠️ [Angular versions are pinned EXACTLY to the host's](.agents/host-integration.md#version-alignment)
  (`@angular/*` 22.1.7, `@angular/build`/`cli` 22.1.8, TypeScript ~6.0.3). Federation shares them as
  strict singletons: a drift breaks loading in the host. Never use `^`/`~` on `@angular/*`.
- ⚠️ [Exposes key `./X` must equal the exported symbol `X`](.agents/host-integration.md#exposing-a-module)
  — the host resolves `m[exposedModule]`. Each exposed `Routes` array registers `provideMfHttpClient()`
  in its root route `providers`, because the host never runs this app's `app.config.ts`.
- ⚠️ [`SECRET_KEY` must be identical to the host's](.agents/environment.md) — the access token lives in
  encrypted localStorage written by the host; a different key reads nothing, silently.
- ⚠️ [Talk to the host only through the PubSub topics](.agents/host-integration.md#pubsub-contract)
  (`loading`, `error`, `success`, `warning`, `info`, `login-redirect`, `clearBreadCrumb`). Never
  subscribe to host UI topics from a remote.
- ⚠️ Angular 17+ syntax only: standalone components, `@if`/`@for`/`@switch`, `inject()`, signals,
  OnPush. No NgModules, no `*ngIf`/`*ngFor`, no constructor injection. See
  [`.agents/architecture.md`](.agents/architecture.md).
- ⚠️ [New feature modules come from the generator](.agents/architecture.md#creating-a-module), never
  from copy-paste: `bun run generate:module -- --name=<kebab-name> [--expose]`.
- ⚠️ [Tests next to the file they cover, written first when behavior changes](.agents/testing.md).
- ⚠️ Never commit `.env`, `.npmrc`, `src/environments/*`, `dist/` — they are gitignored on purpose.

## Capability map

<!-- capability-map:start -->
| If you need… | Already exists | Entry point | Read |
|---|---|---|---|
| HttpClient with auth for every request (also: interceptor, Bearer, x-device-info) | `provideMfHttpClient()` + functional `authInterceptor` (Bearer from host token, `x-device-info`) | `src/app/shared/providers/http.providers.ts`, `src/app/shared/interceptors/auth.interceptor.ts` | [`.agents/host-integration.md`](.agents/host-integration.md#interceptors) |
| Read/write encrypted localStorage shared with the host (also: token, session, encrypt-storage) | `StorageService` + `StorageEnum` (same key names as host/frontcore) | `src/app/shared/services/storage.service.ts`, `src/app/shared/enums/storage.enum.ts` | [`.agents/environment.md`](.agents/environment.md) |
| Show loader/toasts in the host (also: notifications, pubsub, events) | `PubSubService` + `PubSubTopic` | `src/app/shared/services/pubsub.service.ts`, `src/app/shared/enums/pubsub-topic.enum.ts` | [`.agents/host-integration.md`](.agents/host-integration.md#pubsub-contract) |
| Permission headers for the gateway (also: x-api-key, resource:action) | `buildPermissionHeaders(resource, action)` | `src/app/shared/helpers/permission-headers.helper.ts` | [`.agents/architecture.md`](.agents/architecture.md) |
| Backend URL prefix (also: ms-core, gateway path) | `MsPrefixEnum` | `src/app/shared/enums/ms-prefix.enum.ts` | [`.agents/architecture.md`](.agents/architecture.md) |
| Standard response types (also: pagination, envelope) | `ServiceResponseInterface`, `PaginationResponseInterface` | `src/app/shared/interfaces/response.interface.ts` | — |
| Validate a bearer token value | `isUsableBearerToken()` | `src/app/shared/helpers/bearer-token.helper.ts` | — |
| Build-time configuration (also: env, API_URL, environment.ts) | `load-env.js` → `src/environments/environment.ts` | `bun run env` | [`.agents/environment.md`](.agents/environment.md) |
| Create a feature module (also: scaffold, generator) | Generator cloning `src/app/modules/template` | `bun run generate:module -- --name=<name> [--expose]` | [`src/app/modules/template/README.md`](src/app/modules/template/README.md) |
<!-- capability-map:end -->

Fork-only capabilities: [`.agents/capabilities.local.md`](.agents/capabilities.local.md).

## Documentation map

- Architecture, folder layout, module anatomy → [`.agents/architecture.md`](.agents/architecture.md)
- Host integration (manifest row, exposes, interceptors, PubSub, versions) → [`.agents/host-integration.md`](.agents/host-integration.md)
- Environment variables and `SECRET_KEY` → [`.agents/environment.md`](.agents/environment.md)
- Testing → [`.agents/testing.md`](.agents/testing.md)
- Docker, nginx, CI/CD → [`.agents/deployment.md`](.agents/deployment.md)
- Sync a fork with this repo → [`.agents/merge-changes-from-front-template.md`](.agents/merge-changes-from-front-template.md)
- Example module → [`src/app/modules/template/README.md`](src/app/modules/template/README.md)

## Commands

```bash
bun install                  # also creates .env from .env.example (never overwrites)
bun run start                # load-env + dev server on http://localhost:4250
bun run build                # load-env + federation build -> dist/browser/remoteEntry.json
bun run test                 # vitest (Angular unit tests) + node:test (scripts)
bun run lint                 # Biome lint
bun run format               # Biome format (write)
bun run check                # Biome lint + format + imports (verify only)
bun run generate:module -- --name=<kebab-name> [--expose]
```

## What NOT to do

- No npm/yarn/pnpm, no `package-lock.json`: the lockfile is `bun.lock`.
- No ESLint/Prettier configuration: Biome is the linter/formatter.
- No `^`/`~` ranges on `@angular/*`, `@angular/build`, `@angular/cli`, `@angular-architects/native-federation`.
- No `.npmrc` with tokens in the repo (CI generates it with `CI_JOB_TOKEN`).
- No webpack/Module Federation config: this is Native Federation (`federation.config.mjs`).
- Do not rename or remove an exposed symbol without updating the ms-core manifest row.
- Do not edit `src/environments/*` by hand: it is regenerated on every start/build/test.
