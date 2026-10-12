# Feature: mf-template-baseline

## Objective
Turn `front-template` (plain `ng new`) into the single source of truth for new Neocore
micro-frontends (MFs), mirroring the `backtemplate` philosophy: one example module named
`template`, a module generator, shared plumbing, CI/Docker, and an AGENTS.md capability map.
`mf-template` is a fork of this repo and is out of scope.

## Problem / Why
Each front (frontcore, frontvirtualofficebroker, frontauthentication, ...) was copy-pasted from
another, with drift: interceptor registration differs, test runners differ (karma/vitest),
stale nginx locations, AGENTS.md describing webpack. New MFs need one canonical starting point.

## Canonical pattern (from exploration of all fronts, 2026-10-12)
- Angular pinned to host versions (frontcontainer: @angular/* 22.1.7, @angular/build 22.1.8,
  TS ~6.0.3) because federation `shareAll` uses singleton + strictVersion.
- bun + bun.lock + bunfig.toml (`minimumReleaseAge`); Biome lint/format.
- Native Federation 22.1.3 (`@angular-architects/native-federation`), `es-module-shims`,
  `@softarc/native-federation-orchestrator ^4.6.0`; `federation.config.mjs` modeled on frontcore.
- Host loads remotes from ms-core manifest `{name, remoteEntry, path, exposedModule, isAuthRoute,
  moduleName, typeRemote, guards}`; exposes key `./X` must equal exported symbol `X`.
- Build-time env via `load-env.js` -> `src/environments/environment.ts`; `SECRET_KEY` must match host.
- Token in encrypted localStorage (`encrypt-storage`), functional auth interceptor
  (Bearer + x-device-info), PubSub topics to talk to the host.
- Docker: bun deps/build/prebuilt -> nginx alpine-slim non-root; nginx with CORS for remoteEntry.json.
- CI: install -> test -> security -> build -> docker -> deploy (dev/quality/pre-prod).

## Decisions
- Standalone + signals + new control flow (user's Angular 17+ standard); the example feature
  exposes a `Routes` array (`./TemplateRoutes`, typeRemote `module`). Interceptors are provided
  inside the exposed routes' `providers` so they also apply when hosted.
- Tests: vitest via `@angular/build:unit-test` (matches frontcontainer).
- Dev port 4250 (free: container 4200, core/auth 4201, vob 4211).
- Delivery strategy: `exception-ok` — new template bootstrap, delivered as one feature branch
  `feat/mf-template-baseline`; push/MR remain the user's decision.

## Tasks
- [x] T1 Tooling base: bun, Angular aligned to host, Biome, bunfig, .gitignore (.env, .npmrc)
- [x] T2 Native Federation: federation.config.mjs, tsconfig.federation.json, main/bootstrap, angular.json targets
- [x] T3 Env: load-env.js, env-helper, prepare-env, .env.example, environments
- [x] T4 Shared plumbing: storage, auth interceptor, pubsub topics, permission headers, ms prefix enum
- [x] T5 Example module `src/app/modules/template` (standalone, routes, page, component, service, interfaces, tests)
- [x] T6 `generate:module` script cloning `template`
- [x] T7 Dockerfile, nginx.conf, compose, .gitlab-ci.yml
- [x] T8 AGENTS.md capability map, CLAUDE.md -> @AGENTS.md, .agents/ docs, README

## Route
All tasks: delegated direct (one writer) — writer trigger (2+ non-trivial files) and preparation trigger.

## Acceptance criteria
- `bun install`, `bun run lint`, `bun run test`, `bun run build` pass.
- `dist/` contains `remoteEntry.json` exposing `./TemplateRoutes`.
- `bun run generate:module -- --name=foo` produces a compiling module.

## Progress / Evidence
COMMITS PENDING: the writer's permission policy denied `git add`/`git commit`, so T1–T8 are
implemented and verified in the working tree but not committed. Proposed work-unit commits (in order):
1. `chore: switch template to bun and pin angular to host versions` — package.json, bun.lock,
   package-lock.json (deleted), bunfig.toml, biome.jsonc, .gitignore, .vscode/extensions.json, tsconfig.app/spec.json (format)
2. `feat: expose template routes through native federation` — angular.json, federation.config.mjs,
   tsconfig.federation.json, src/main.ts, src/bootstrap.ts, src/index.html, src/app/app.* (app.html/app.scss deleted)
3. `feat: generate build-time environment from .env` — load-env.js, scripts/env-helper.js, scripts/prepare-env.js, .env.example
4. `feat: add shared storage, auth interceptor and pubsub plumbing` — src/app/shared/**
5. `feat: add reference template module` — src/app/modules/template/**
6. `feat: add generate:module script` — scripts/generate-module*.js
7. `ci: add docker, nginx and gitlab pipeline` — Dockerfile, nginx.conf, compose.yml, .dockerignore, .gitlab-ci.yml
8. `docs: add agent guide, capability map and quickstart` — AGENTS.md, CLAUDE.md, .agents/**, README.md, this file
(The tree was verified as a whole; intermediate commits were not re-verified individually.)

- T1 (delegated) — Angular pinned 22.1.7 / build+cli 22.1.8, npm -> bun, Biome lint enabled
  (frontcore had it disabled). Checks: install/lint/build/test OK. Exception to test-first: tooling.
  Deviation: `.prettierrc` left on disk (outside allowed surface); Prettier dependency removed.
- T2 (delegated) — `federation.config.mjs` (`mf-template`, `./TemplateRoutes`, strict singletons, skip
  encrypt-storage/pubsub-js, denseChunking); angular.json build/serve(4250)/esbuild/serve-original/
  build-test/test. Check: build OK, `dist/browser/remoteEntry.json` exposes `./TemplateRoutes`;
  dev server served remoteEntry.json + `/template` 200. Exception: config only.
- T3 (delegated) — load-env.js (required API_URL/SECRET_KEY>=10 chars/ENTITY_ROOT; best-effort
  `/ms-core/parameter/env` with timeout; `.env.example` fallback; process env wins over .env).
  Environment files are generated and gitignored. Check: offline build warns and succeeds.
- T4 (delegated) — RED observed (missing modules), GREEN: storage, interceptor, pubsub, helpers specs pass.
- T5 (delegated) — RED observed, GREEN: service (HttpTestingController), table component, list page specs pass.
- T6 (delegated) — RED observed, GREEN: 8 node:test cases; real run `--name=sample-feature`
  (+ `--expose`) builds and its generated specs pass; output reverted.
- T7 (delegated) — YAML parsed; `docker build --target runtime --build-arg DIST_STAGE=prebuilt` OK,
  `nginx -t` OK, `/health` 200, remoteEntry.json with CORS header, SPA fallback 200; image removed.
- T8 (delegated) — docs written; structural readback only (passive docs).

Final checks (with `SECRET_KEY=change-me-use-the-host-secret` exported, see open issue):
`bun install` OK; `bun run lint` 0 diagnostics; `bun run check` OK; `bun run test` 27/27 vitest +
8/8 node:test; `bun run build` OK, remoteEntry exposes `["./TemplateRoutes"]`;
`generate:module --name=sample-feature` + build OK (34/34 tests incl. generated), reverted.

Open issue: the local, untracked `.env` was created from an earlier `.env.example` whose
SECRET_KEY had 9 chars; load-env now rejects it. Fix locally with `cp .env.ignore .env`.

- Follow-up (inline, user decision 2026-10-12: "behave like frontcore") — exposed `TemplateRoutes`
  no longer provides an HttpClient; hosted requests use the host's HttpClient + interceptors
  (auth, error handler, loader), as frontcore does. `provideMfHttpClient()` stays in app.config.ts
  for standalone dev. Checks: lint OK, vitest 27/27, node:test 8/8, build OK exposing ./TemplateRoutes.
  T1–T8 were committed by the user as 5486a52.

## Next step
Parent: create the work-unit commits above, fix the local `.env`, then decide on push/MR.
