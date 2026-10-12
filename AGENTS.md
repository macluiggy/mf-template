# AGENTS.md

Context for AI agents (Claude Code, Copilot, Cursor, OpenCode, ...) working in this repo.
`front-template-standalone` is a plain Angular 22 single-page application template (standalone
components, signals, zoneless). It is derived from the Neocore micro-frontend template
(`upstream`) with Native Federation and the host contract removed, and keeps the same layout and
tooling so it can [receive upstream improvements](.agents/sync-from-upstream.md) and be
[turned back into a federated remote](.agents/migrate-to-native-federation.md) later.

This file is the **compass**: a short map of what already exists plus the mandatory rules. Details
live in [`.agents/`](.agents/); open the relevant doc before touching that area.

## Mandatory rules

- ⚠️ **Before building anything shared (`src/app/shared/`), check the capability map below** — reuse
  what exists instead of reimplementing it.
- ⚠️ **If you add, change the contract of, or remove a shared capability, update its map row in the
  same commit.** Project-only capabilities go in [`.agents/capabilities.local.md`](.agents/capabilities.local.md).
- ⚠️ One HttpClient for the whole app: [`provideAppHttpClient()`](src/app/shared/providers/http.providers.ts)
  in `app.config.ts`. Add interceptors to its list; never call `provideHttpClient()` in route providers.
- ⚠️ Angular 17+ syntax only: standalone components, `@if`/`@for`/`@switch`, `inject()`, signals,
  OnPush. No NgModules, no `*ngIf`/`*ngFor`, no constructor injection. The app is zoneless: never
  add `zone.js`. See [`.agents/architecture.md`](.agents/architecture.md).
- ⚠️ [New feature modules come from the generator](.agents/architecture.md#creating-a-module), never
  from copy-paste: `bun run generate:module -- --name=<kebab-name>`.
- ⚠️ [Tests next to the file they cover, written first when behavior changes](.agents/testing.md).
- ⚠️ [Everything in `environment.ts` is public](.agents/environment.md): no server-side secrets in `.env`.
- ⚠️ Never commit `.env`, `.npmrc`, `src/environments/*`, `dist/` — they are gitignored on purpose.

## Capability map

<!-- capability-map:start -->
| If you need… | Already exists | Entry point | Read |
|---|---|---|---|
| HttpClient with auth (also: interceptor, Bearer token) | `provideAppHttpClient()` + functional `authInterceptor` (Bearer from stored access token) | `src/app/shared/providers/http.providers.ts`, `src/app/shared/interceptors/auth.interceptor.ts` | [`.agents/architecture.md`](.agents/architecture.md#http) |
| Read/write encrypted localStorage (also: token, session, encrypt-storage) | `StorageService` + `StorageEnum` | `src/app/shared/services/storage.service.ts`, `src/app/shared/enums/storage.enum.ts` | [`.agents/environment.md`](.agents/environment.md#secret_key) |
| Standard response types (also: pagination, envelope) | `ServiceResponseInterface`, `PaginationResponseInterface` | `src/app/shared/interfaces/response.interface.ts` | — |
| Validate a bearer token value | `isUsableBearerToken()` | `src/app/shared/helpers/bearer-token.helper.ts` | — |
| Build-time configuration (also: env, API_URL, environment.ts) | `load-env.js` → `src/environments/environment.ts` | `bun run env` | [`.agents/environment.md`](.agents/environment.md) |
| Create a feature module (also: scaffold, generator) | Generator cloning `src/app/modules/template` | `bun run generate:module -- --name=<name>` | [`src/app/modules/template/README.md`](src/app/modules/template/README.md) |
<!-- capability-map:end -->

Project-only capabilities: [`.agents/capabilities.local.md`](.agents/capabilities.local.md).

## Documentation map

- Architecture, folder layout, module anatomy, HTTP → [`.agents/architecture.md`](.agents/architecture.md)
- Environment variables and `SECRET_KEY` → [`.agents/environment.md`](.agents/environment.md)
- Testing → [`.agents/testing.md`](.agents/testing.md)
- Docker, nginx, CI → [`.agents/deployment.md`](.agents/deployment.md)
- Merge improvements from the federated template → [`.agents/sync-from-upstream.md`](.agents/sync-from-upstream.md)
- Turn this app into a Native Federation remote → [`.agents/migrate-to-native-federation.md`](.agents/migrate-to-native-federation.md)
- Example module → [`src/app/modules/template/README.md`](src/app/modules/template/README.md)

## Commands

```bash
bun install                  # also creates .env from .env.example (never overwrites)
bun run start                # load-env + dev server on http://localhost:4200
bun run build                # load-env + production build -> dist/browser/index.html
bun run test                 # vitest (Angular unit tests) + node:test (scripts)
bun run lint                 # Biome lint
bun run format               # Biome format (write)
bun run check                # Biome lint + format + imports (verify only)
bun run generate:module -- --name=<kebab-name>
```

## What NOT to do

- No npm/yarn/pnpm, no `package-lock.json`: the lockfile is `bun.lock`.
- No ESLint/Prettier configuration: Biome is the linter/formatter.
- No `zone.js`, no NgModules, no Module Federation/webpack configuration.
- No `.npmrc` with tokens in the repo.
- Do not edit `src/environments/*` by hand: it is regenerated on every start/build/test.
- Do not copy files from upstream by hand: [merge them](.agents/sync-from-upstream.md).
