# AGENTS.md

Context for AI agents (Claude Code, Copilot, Cursor, OpenCode, ...) working in this repo.

This is a **generic Angular 22 template**: a plain standalone SPA (standalone components, signals,
`inject()`, OnPush) that any project can start from. Two optional presets ride on top of it, and
neither one is required:

- **Native Federation remote** — `bun run build:federation` emits a `remoteEntry.json` that a host
  container can load at runtime.
- **NEOCORE host integration** — `provideNeocoreHost()` binds the core ports (`Notifier`,
  `KeyValueStorage`, `AUTH_TOKEN_PROVIDER`, `PermissionChecker`) to the NEOCORE host
  (`frontcontainer`): PubSub topics, encrypted storage with the host's `SECRET_KEY`, device info and
  permission headers.

Without them the app runs on the core ports: console notifier, plain `localStorage`, no token,
allow-all permissions. Dropping the NEOCORE story is deleting `src/app/integrations/neocore/` and
its two `provideNeocoreHost()` calls (see its README).

This file is the **compass**: a short map of what already exists plus the mandatory rules. Details
live in [`.agents/`](.agents/); open the relevant doc before touching that area.

## Mandatory rules

- ⚠️ **Before building anything shared (`src/app/shared/`), check the capability map below** — reuse
  what exists instead of reimplementing it.
- ⚠️ **If you add, change the contract of, or remove a shared capability, update its map row in the
  same commit.** Fork-only capabilities go in [`.agents/capabilities.local.md`](.agents/capabilities.local.md).
- ⚠️ **Ports before adapters.** `src/app/core/` owns the ports and their safe local defaults
  (`Notifier`, `KeyValueStorage`, `AUTH_TOKEN_PROVIDER`, `PermissionChecker`); `src/app/shared/` and
  `src/app/modules/` depend only on them. Host-specific adapters live in
  `src/app/integrations/<host>/` and are wired by that integration's `provideX()` alone — never
  import an integration folder from core, shared or a feature module. Removing an integration =
  delete the folder and its `provideX()` calls (see its README).
- ⚠️ Angular 17+ syntax only: standalone components, `@if`/`@for`/`@switch`, `inject()`, signals,
  OnPush. No NgModules, no `*ngIf`/`*ngFor`, no constructor injection. See
  [`.agents/architecture.md`](.agents/architecture.md).
- ⚠️ [New feature modules come from the generator](.agents/architecture.md#creating-a-module), never
  from copy-paste: `bun run generate:module -- --name=<kebab-name> [--expose]`.
- ⚠️ [Tests next to the file they cover, written first when behavior changes](.agents/testing.md).
- ⚠️ Dates use **Temporal**, never `Date` (lint `no-restricted-globals`). Browsers without native
  Temporal (Safari/iOS) get `temporal-polyfill/global`: from `angular.json` polyfills standalone,
  and from an `import 'temporal-polyfill/global';` in every exposed entry when hosted (a host never
  runs a remote's polyfills).
- ⚠️ Never commit `.env`, `.npmrc`, `src/environments/*`, `dist/` — they are gitignored on purpose.
- ⚠️ [Projects created from this template never carry its commits](.agents/projects-from-template.md):
  a new project starts from ONE snapshot commit plus `.template-sync`, and takes later template
  updates only with `node scripts/template-sync.js` (one `chore: sync` commit per update). Never
  `git merge`/`pull`/`cherry-pick` from the template remote in a project. The template itself keeps
  its full history.

## When running as a NEOCORE remote (optional)

These rules apply **only** when the app is deployed as a Native Federation remote of the NEOCORE
host (`frontcontainer`). A plain SPA ignores all of them.

- ⚠️ [Angular versions are pinned EXACTLY to the host's](.agents/host-integration.md#version-alignment)
  (`@angular/*` 22.2.1, `@angular/build`/`cli` 22.2.1, Native Federation 22.2.2, TypeScript ~6.0.3).
  Federation shares them as strict singletons: a drift breaks loading in the host. Never use `^`/`~`
  on `@angular/*`.
- ⚠️ [Exposes key `./X` must equal the exported symbol `X`](.agents/host-integration.md#exposing-a-module)
  — the host resolves `m[exposedModule]`. [Exposed `Routes` never provide an HttpClient](.agents/host-integration.md#interceptors):
  when hosted, requests use the host's HttpClient and interceptors (auth, errors, loader).
- ⚠️ [`SECRET_KEY` is optional, and only with `provideNeocoreHost()` it must be identical to the
  host's](.agents/environment.md) — the access token lives in encrypted localStorage written by the
  host; a different key reads nothing, silently. Without the integration the token is `null` and no
  Authorization header is sent.
- ⚠️ With `provideNeocoreHost()`, [talk to the host only through the PubSub topics](.agents/host-integration.md#pubsub-contract)
  (`loading`, `error`, `success`, `warning`, `info`, `login-redirect`, `clearBreadCrumb`). Never
  subscribe to host UI topics from a remote, and never import PubSub outside
  `src/app/integrations/neocore/`: generic code uses the `Notifier` port.
- ⚠️ [Register every exposed entry as a manifest row in the host's ms-core](.agents/host-integration.md#registering-this-mf-in-the-host).
  Never rename or remove an exposed symbol without updating that row.
- ⚠️ Shared UI belongs to `@neocore/lib-components`, not here: see
  [`.agents/deployment.md`](.agents/deployment.md#adding-neocorelib-components).
- ⚠️ **The template keeps evolving from its forks.** When working in a fork (above all while merging
  the template into it), if a change is general — a fix, tooling, config, CI, shared plumbing, test
  setup — and would help every new front/MF, propose upstreaming it to the template. Propose, never
  apply it there on your own; see the
  [merge skill](.agents/skills/merge-fork-from-front-template/SKILL.md).
- ⚠️ **If two or more repos implement the same functionality, it belongs in the template — detect
  it WITHOUT being asked.** Whenever you work in a front (implementing, reviewing, or merging the
  template) and see that another front already solves the same thing (an interceptor, a guard, a
  storage/permission helper, a pipe, a locale setup, test or build tooling), say so in your answer
  and propose moving it to the template as one shared capability: a single implementation with its
  capability-map row, which forks receive on their next sync and which replaces their copies.
  Build it like a lego piece: **high cohesion** (one capability, one responsibility, everything it
  needs in its own folder) and **loose coupling** (consumed only through its public entry point — a
  `provideX()` function, a service, a token — never through its internals, with safe defaults), so
  it can be added or removed without breaking the rest. Code used by a single front stays in that
  fork (`.agents/capabilities.local.md`). Upstreaming is a change in the template on its own
  branch: propose it, never apply it there on your own.

## Capability map

<!-- capability-map:start -->

| If you need…                                                                                                    | Already exists                                                                                   | Entry point                                                                                     | Read                                                                         |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| HttpClient for standalone dev (also: interceptor, extra interceptors; hosted mode uses the host's)              | `provideAppHttpClient(...extraInterceptors)` + functional `authInterceptor` (Bearer from `AUTH_TOKEN_PROVIDER`); `provideMfHttpClient()` is a deprecated alias | `src/app/shared/providers/http.providers.ts`, `src/app/shared/interceptors/auth.interceptor.ts` | [`.agents/host-integration.md`](.agents/host-integration.md#interceptors)    |
| Read the bearer token (also: access token, Authorization, login)                                                | `AUTH_TOKEN_PROVIDER` — `() => string \| null`, default `() => null`                            | `src/app/core/auth-token.ts`                                                                    | [`.agents/architecture.md`](.agents/architecture.md)                         |
| Show loader/toasts (also: notifications, events, feedback, logs)                                                | `Notifier` port + `ConsoleNotifier` default; `provideNeocoreHost()` swaps in PubSub             | `src/app/core/notifier.ts`                                                                      | [`.agents/host-integration.md`](.agents/host-integration.md#pubsub-contract) |
| Read/write app storage (also: token, session, key/value, localStorage)                                          | `KeyValueStorage` port + `LocalStorageKeyValueStorage` default (JSON, fail-safe)                | `src/app/core/key-value-storage.ts`                                                             | [`.agents/environment.md`](.agents/environment.md)                           |
| Global loader for overlapping operations (also: loading, spinner, counter, LoaderService)                       | `LoadingTrackerService` — ref-counted over `Notifier.loading`                                    | `src/app/shared/services/loading-tracker.service.ts`                                            | [`.agents/host-integration.md`](.agents/host-integration.md#pubsub-contract) |
| User message from an HTTP error (also: error toast, backend envelope message)                                   | `toUserMessage(error)`                                                                           | `src/app/shared/helpers/error-message.helper.ts`                                                | —                                                                            |
| Show/hide UI by permission (also: can, roles, checker)                                                          | `PermissionChecker.can(resource, action)` — `AllowAllPermissionChecker` default; NEOCORE reads role then user | `src/app/core/permission-checker.ts`                                                            | [`.agents/architecture.md`](.agents/architecture.md)                         |
| Protect a remote route by permission (also: guard, canActivate, resource:action)                               | `permissionGuard(resource, action)` — blocks and calls `Notifier.warning`                        | `src/app/shared/guards/permission.guard.ts`                                                     | [`.agents/architecture.md`](.agents/architecture.md)                         |
| Standard response types (also: pagination, envelope)                                                            | `ServiceResponseInterface`, `PaginationResponseInterface`                                        | `src/app/shared/interfaces/response.interface.ts`                                               | —                                                                            |
| Validate a bearer token value                                                                                   | `isUsableBearerToken()`                                                                          | `src/app/shared/helpers/bearer-token.helper.ts`                                                 | —                                                                            |
| Test doubles for the ports (also: mock, spy, HttpTestingController, test kit)                                   | `createNotifierMock`/`provideNotifierMock`, `createStorageMock`/`provideStorageMock`, `provideHttpTesting`; PubSub mock re-exported | `src/testing/index.ts`                                                                          | [`.agents/testing.md`](.agents/testing.md#test-kit)                          |
| Dates and times (also: Temporal, Date, timezone, now)                                                           | Global `Temporal` (native, or `temporal-polyfill/global`)                                        | `Temporal.Now.instant()`, `Temporal.PlainDate.from(...)`                                        | —                                                                            |
| App locale for pipes (also: LOCALE_ID, es-EC, currency, DatePipe, registerLocaleData)                           | `provideAppLocale(options?)` — es-EC + USD preset; `provideNeocoreLocale()` is deprecated        | `src/app/core/app-locale.ts`                                                                    | [`.agents/host-integration.md`](.agents/host-integration.md#locale)          |
| Build-time configuration (also: env, API_URL, environment.ts)                                                   | `load-env.js` → `src/environments/environment.ts` (only `API_URL` required; remote config opt-in via `ENV_REMOTE_URL`)                                                | `bun run env`                                                                                   | [`.agents/environment.md`](.agents/environment.md)                           |
| Create a feature module (also: scaffold, generator)                                                             | Generator cloning `src/app/modules/template`                                                     | `bun run generate:module -- --name=<name> [--expose]`                                           | [`src/app/modules/template/README.md`](src/app/modules/template/README.md)   |
| NEOCORE host adapters (optional preset; also: PubSub, encrypt-storage, permissions, device info, SECRET_KEY)     | `provideNeocoreHost()` — overrides the core defaults; delete the folder to drop NEOCORE         | `src/app/integrations/neocore/neocore.providers.ts`                                             | [`src/app/integrations/neocore/README.md`](src/app/integrations/neocore/README.md) |
| NEOCORE toasts/loader topics (only with `provideNeocoreHost()`; also: pubsub, events)                           | `PubSubService` + `PubSubTopic` (behind `PubSubNotifier`)                                        | `src/app/integrations/neocore/pubsub/`                                                          | [`.agents/host-integration.md`](.agents/host-integration.md#pubsub-contract) |
| Encrypted localStorage shared with the host (only with `provideNeocoreHost()`; also: encrypt-storage)          | `StorageService` + `StorageEnum` (the host's 12 key names, byte-identical)                       | `src/app/integrations/neocore/storage/`                                                         | [`.agents/environment.md`](.agents/environment.md)                           |
| Gateway permission header (only with `provideNeocoreHost()`; also: x-api-key, resource:action)                  | `buildPermissionHeaders(resource, action)`                                                       | `src/app/integrations/neocore/http/permission-headers.helper.ts`                                | [`.agents/architecture.md`](.agents/architecture.md)                         |
| Gateway URL prefix (only with `provideNeocoreHost()`; also: ms-core, gateway path)                              | `MsPrefixEnum`                                                                                   | `src/app/integrations/neocore/http/ms-prefix.enum.ts`                                           | [`.agents/architecture.md`](.agents/architecture.md)                         |

<!-- capability-map:end -->

Fork-only capabilities: [`.agents/capabilities.local.md`](.agents/capabilities.local.md).

## Documentation map

- Architecture, folder layout, module anatomy → [`.agents/architecture.md`](.agents/architecture.md)
- Environment variables and the optional `SECRET_KEY` → [`.agents/environment.md`](.agents/environment.md)
- Testing → [`.agents/testing.md`](.agents/testing.md)
- Docker, nginx, CI/CD → [`.agents/deployment.md`](.agents/deployment.md)
- Create a project from this template, or take template updates without its commits → [`.agents/projects-from-template.md`](.agents/projects-from-template.md)
- NEOCORE host preset (manifest row, exposes, interceptors, PubSub, versions) → [`.agents/host-integration.md`](.agents/host-integration.md)
- NEOCORE fork workflow (sync a fork with this repo) → [`.agents/merge-changes-from-front-template.md`](.agents/merge-changes-from-front-template.md) and the end-to-end [merge skill](.agents/skills/merge-fork-from-front-template/SKILL.md)
- Example module → [`src/app/modules/template/README.md`](src/app/modules/template/README.md)

## Commands

```bash
bun install                  # also creates .env from .env.example (never overwrites) and,
                             # the first time, indexes the repo with CodeGraph (.codegraph/)
bun run start                # load-env + ng serve (standalone SPA) on http://localhost:4250
bun run build                # load-env + ng build -> dist/browser (standalone SPA)
bun run start:federation     # Native Federation dev server (serves remoteEntry.json)
bun run build:federation     # load-env + federation build -> dist/browser/remoteEntry.json
bun run test                 # vitest (Angular unit tests) + node:test (scripts)
bun run lint                 # oxlint (warnings fail locally; advisory in CI)
bun run format               # oxfmt (write); format:check verifies
bun run verify               # oxlint + oxfmt --check (verify only, same as CI)
bun run generate:module -- --name=<kebab-name> [--expose]
node scaffold/generate.js --service=<name> --target=. --force   # regenerate .gitlab-ci.yml (NEOCORE GitLab preset)
```

## What NOT to do

- No npm/yarn/pnpm and no versioned lockfile: `bun.lock` is gitignored and regenerated by `bun install`.
  Dependencies change with every template update and internal packages are republished under the
  same version, so a committed lockfile breaks the CI install with an integrity error.
- Script names say what they do, not the tool (`format`, `format:check`, `verify`, `lint`), and no
  script is named `check`: it would shadow Bun's type checker (`bun check`). Pinned by
  `scripts/package-scripts.test.js`.
- Oxc mirrors backtemplate's Biome rules: 80 columns, single quotes, sorted imports, object keys
  (`sort-keys`) and interface members (`perfectionist/sort-interfaces`) in natural order, all
  autofixed by `bun run lint:fix` and the pre-commit.
- No ESLint/Prettier/Biome configuration: Oxc is the linter (`oxlint.config.ts`) and formatter
  (`oxfmt.config.ts`); a husky pre-commit runs `oxlint --fix` + oxfmt on staged files and reports
  findings without blocking. CI `lint`/`format:check` are advisory (`allow_failure: true`): forks
  carry legacy findings, so they warn instead of blocking `build_app`.
- Do not edit `.gitlab-ci.yml` by hand: it is generated from `scaffold/templates/gitlab-ci.yml`, the
  **NEOCORE GitLab preset**
  (`node scaffold/generate.js --service=<name> --target=. --force`, see `scaffold/README.md`). The
  generic CI is `.github/workflows/ci.yml`, and that one IS edited by hand.
- Do not hardcode Node/Bun versions: `.node-version` and `.bun-version` are the source of truth
  (CI `resolve_versions`, Dockerfile `ARG BUN_VERSION`, `package.json`), pinned by
  `scripts/tool-versions.test.js`.
- Do not turn off `strict` (`tsconfig.json`) or `strictTemplates` (`angularCompilerOptions`): every
  fork already compiles with both, and a new MF must not start weaker than them.
- No `^`/`~` ranges on `@angular/*`, `@angular/build`, `@angular/cli`, `@angular-architects/native-federation`.
- No `.npmrc` with tokens in the repo (CI generates it with `CI_JOB_TOKEN`).
- No webpack/Module Federation config: this is Native Federation (`federation.config.mjs`).
- Do not rename or remove an exposed symbol without updating the host manifest row.
- Do not edit `src/environments/*` by hand: it is regenerated on every start/build/test.
