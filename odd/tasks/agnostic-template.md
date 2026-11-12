# Agnostic mf-template (plain SPA by default, NEOCORE host as an optional adapter)

Objective: mf-template works as a normal standalone Angular app for any project; Native Federation and the NEOCORE host contract (PubSub, encrypt-storage with the host SECRET_KEY, x-device-info, x-api-key, ms-core paths) become opt-in pieces behind small ports, removable in one place. Branch: `refactor/agnostic-template`. Runner: `bun run lint`, `bun run format:check`, `bun run build`, `bun run test`.

## Specs

- S1 (user, 2026-11-12, verbatim): "siguiendo la filosofia de legos, qque nada este acoplado para que si maniana quiero mi propio logs puedo cambiar en un solo lugar, asi que usnado adaptadores nomas"
- S2 (user, verbatim): "lo que veas que quede lo mas agnostico posible hazlo en los templates primero ... refinamos los templates, para quitar lo que esta muy de neocore"
- S3: `bun run build` / `bun run start` produce a plain SPA (`@angular/build:application`, `main.ts` bootstraps directly); federation is `build:federation` / `start:federation`.
- S4: Ports with safe local defaults: `Notifier` (loading/success/error/warning/info), `KeyValueStorage` (plain localStorage), `TOKEN_PROVIDER` (none), `PermissionChecker` (allow-all); `provideNeocoreHost()` binds the PubSub, encrypt-storage, permission, device-info and permission-header adapters.
- S5: `load-env.js` requires only `API_URL`; `SECRET_KEY`/`ENTITY_ROOT` only with the NEOCORE preset; the remote env fetch is opt-in (`ENV_REMOTE_URL`).
- S6: No NEOCORE leftovers in the default template: `@neocore/lib-components` refs, gitads CI preset forced by default, host docs/skills in the generic path, es-EC hardcoded (becomes `provideAppLocale(...)` with an es-EC preset).

## Tasks

| ID | Specs | What | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S3 | Standalone by default, federation opt-in (angular.json targets, main.ts/main.federation.ts, scripts, compose healthcheck, CI remoteEntry check conditional, temporal/generate-module tests) | delegated | done | e65c0ae |
| T2 | S4 | Ports + defaults in `src/app/core/`, NEOCORE adapters in `src/app/integrations/neocore/` with `provideNeocoreHost()`; example module and test kit use the ports | delegated | done | (this commit) |
| T3 | S5 | load-env generic | delegated | done | — |
| T4 | S6 | Generic locale provider, drop lib-components refs, nginx CORS include only for federation | delegated | done | — |
| T5 | S6 | CI/scaffold/docs/skills neutral, AGENTS.md rules conditional on federation | delegated | pending | — |

## Log

- L1 (2026-11-12): inventory by read-only explorer. The real `@angular/build:application` config already exists as the `esbuild` target; going standalone is renaming targets plus a direct-bootstrap `main.ts`. `storage.service.ts` creates `EncryptStorageNoble(environment.secretKey)` at module load, so today any app needs a 10+ char SECRET_KEY. Risky tests: `scripts/temporal.test.js` (reads target `esbuild`), `generate-module.test.js` (`--expose`), `gitlab-ci-scaffold.test.js` (remoteEntry, `mf-` prefix), `load-env.test.js`, host-contract specs.
- L2 (2026-11-12): T1 done (e65c0ae): plain SPA by default, federation via build:federation/start:federation. Gates: lint, format:check, build (index.html, no remoteEntry), build:federation (remoteEntry.json), vitest 68/68, node:test 46/46.
- L3 (2026-11-12): T2 done: ports in src/app/core (Notifier, KeyValueStorage, AUTH_TOKEN_PROVIDER, PermissionChecker) with defaults; NEOCORE adapters in src/app/integrations/neocore behind provideNeocoreHost(); encrypt-storage created lazily; provideMfHttpClient kept as alias. Gates: lint 0, format:check 0, build 0, build:federation 0, vitest 97/97, node:test 46/46. Lego check: a copy without src/app/integrations/neocore and without the provideNeocoreHost() lines builds (exit 0).
- L4 (2026-11-12): T3 done: only API_URL is required; SECRET_KEY/ENTITY_ROOT optional (SECRET_KEY validated only when set, >= 10 chars); the remote env fetch is opt-in via ENV_REMOTE_URL (SKIP_ENV_FETCH still wins); the generated interface keeps secretKey/entityRoot optional; the NEOCORE storage adapter throws on first use without SECRET_KEY. Gates: lint 0, format:check 0, build 0 (with a .env holding only API_URL), build:federation 0 (remoteEntry.json present), vitest 98/98, node:test 55/55. The CI scaffold (.env with SECRET_KEY/ENTITY_ROOT) was left untouched: empty values now count as unset, so the generic path works without them.
- L5 (2026-11-12): T4 done: `provideAppLocale(options?)` lives in `src/app/core/app-locale.ts` with the `ES_EC_LOCALE` preset (es-EC + USD + the 'es' locale data, relative node_modules import kept), so the behavior does not change; `provideNeocoreLocale()`/`registerNeocoreLocale()` stay as deprecated aliases. The lib-components leftovers are out of `vitest.config.ts` (server.deps.inline) and `bunfig.toml` (minimumReleaseAgeExcludes); package.json was not touched. nginx splits the hardening headers (`nginx.remote-headers.conf`, always shipped) from the CORS (`nginx.federation-cors.conf`, shipped only with `--build-arg FEDERATION=true`, which CI passes when `federation.config.mjs` exists); `nginx.conf` includes every `/etc/nginx/conf.d/*.inc` in the server and in each location. Gates: lint 0, format:check 0, build 0, build:federation 0 (remoteEntry.json present), vitest 102/102, node:test 55/55, `nginx -t` 0 in both images (SPA: hardening only, no CORS; federation: hardening + CORS).
