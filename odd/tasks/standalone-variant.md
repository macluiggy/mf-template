# Feature: standalone-variant

## Objective
Derive a federation-free Angular template for client/personal projects from `front-template`
(Neocore MF template), reusing everything that is not tied to Native Federation or to the
Neocore host. Kept as a fork (`upstream` = front-template) so improvements can be merged later
with `git merge upstream/<branch>`.

## Why
Micro-frontends solve multi-team/independent-deploy problems. A single-team client app pays the
federation cost (pinned versions, manifest, shared SECRET_KEY, CORS, two-step bootstrap) for no
benefit. The structure stays identical so the app can be migrated back to Native Federation later.

## Scope
Remove: Native Federation (deps, federation.config.mjs, tsconfig.federation.json, two-step
bootstrap, angular.json federation builders), host coupling (PubSub host contract, ms-core
manifest docs, SECRET_KEY-equals-host rule, host-HttpClient rule, ms-core env fetch,
MsPrefixEnum/gateway permission headers if Neocore-only), Neocore CI specifics (company registry,
@neocore scope, Neocore deploy stages).
Keep: bun, Biome, vitest, standalone + signals, `src/app/modules/<feature>` layout, example
`template` module, `generate:module` (minus `--expose`), build-time env from `.env`, generic
storage + auth interceptor (own HttpClient in app.config), Docker + nginx (SPA, no CORS needed),
AGENTS.md compass + capability map + `.agents/` docs.
Add: docs on syncing from upstream and on migrating back to Native Federation.

## Decisions
- Angular deps may use normal `^` ranges (no host to match); current pins are acceptable as a start.
- App provides its own HttpClient with interceptors in `app.config.ts` (no host).
- Generic CI: a minimal provider-neutral pipeline (`.gitlab-ci.yml` install/lint/test/build/docker)
  without Neocore deploy targets.

## Tasks
- [x] S1 Remove Native Federation: deps, configs, single-step bootstrap, angular.json standard builders
- [x] S2 Remove host coupling in src/app/shared and env (PubSub host contract, ms-core fetch, Neocore enums); keep generic plumbing; tests green
- [x] S3 Generator: drop `--expose`; tests green
- [x] S4 Docker/nginx/CI made generic
- [x] S5 Docs: AGENTS.md, .agents/, README, template README; add sync-from-upstream and migrate-to-federation guides

## Route
Delegated direct (one writer): writer + preparation triggers. S1-S5 all route "delegated" (same writer).

## Acceptance criteria
- `bun install`, `bun run lint`, `bun run test`, `bun run build` pass; no `@angular-architects/native-federation`,
  `remoteEntry`, or `mf-` references left except in the migrate-to-federation guide.
- `bun run generate:module -- --name=sample-feature` builds.

## Progress / Evidence
- S1 (delegated) — package renamed `front-template-standalone`; removed native-federation,
  es-module-shims, zone.js, orchestrator; deleted `federation.config.mjs`, `tsconfig.federation.json`,
  `src/bootstrap.ts`; `main.ts` single-step `bootstrapApplication`; `angular.json` project
  `app-template` with `@angular/build:application` / `dev-server` (4200) / `unit-test`; zoneless via
  `provideZonelessChangeDetection()` (app and tests run clean without zone.js). Exception to
  test-first: config only; checked by build. Check: `bun run build` OK, `dist/browser/index.html`,
  no `remoteEntry.json`.
- S2 (delegated) — RED observed first: new `http.providers.spec.ts` (`provideAppHttpClient`
  missing), rewritten interceptor/page/service specs failed to compile. GREEN: `provideAppHttpClient`
  replaces `provideMfHttpClient`; interceptor only adds Bearer (dropped `x-device-info` +
  `ngx-device-detector`); removed PubSub service/enum + `pubsub-js`, `MsPrefixEnum`, permission
  headers helper, `TemplateAction` enum; `StorageEnum` trimmed to generic keys; template page owns
  loading/error UI; service calls `${apiUrl}/template`. `load-env.js` without ms-core fetch,
  `ENTITY_ROOT`, `SKIP_ENV_FETCH`; requires `API_URL` + `SECRET_KEY` (kept: storage encryption stays).
  Check: `bun run test` 8 files / 25 tests passed.
- S3 (delegated) — RED: new tests `nextSteps prints the lazy route` and `no federation expose step`
  failed (2/8). GREEN: removed `addExpose`/`--expose`, added exported `nextSteps(cases)`. Check:
  `bun run test:scripts` 8/8 pass.
- S4 (delegated) — Dockerfile neutral labels, no `.npmrc` secret mount; nginx SPA (no CORS,
  no-cache `index.html`, 1y immutable hashed assets, `/health` kept for HEALTHCHECK); compose service
  `app-template` on `${WEB_PORT:-8080}`; `.gitlab-ci.yml` install → lint → test → build → docker
  (default branch, `$CI_REGISTRY_IMAGE`). Exception: config only, no runnable test; Docker/nginx not
  executed in this environment (structural review only).
- S5 (delegated) — AGENTS.md rewritten (capability map between markers), `.agents/` updated,
  `host-integration.md` and `merge-changes-from-front-template.md` deleted, added
  `sync-from-upstream.md` and `migrate-to-native-federation.md`; README and template README
  rewritten. Exception: passive docs; structural readback + grep.

### Final verification (observed)
- `bun install`: OK (no changes).
- `bun run lint` / `bun run check`: OK, 36 files, no fixes.
- `bun run test`: 8 files / 25 tests passed; node:test 8/8.
- `bun run build`: OK; `dist/browser/index.html` present, no `remoteEntry.json`.
- grep `native-federation|remoteEntry|mf-template|federation.config`: hits only in the two guides,
  `odd/`, and three links to `.agents/migrate-to-native-federation.md` (AGENTS.md:8, AGENTS.md:52,
  `.agents/architecture.md:40`) — the guide's file name itself matches the pattern.
- `generate:module -- --name=sample-feature`: build OK, test 11 files / 32 tests pass; `check`
  reports format-only diffs in generated files (generator tells to run `bun run format`, same as
  upstream). Generated module removed; worktree back to prior state.

### Proposed commits (git add/commit denied in this environment)
1. `refactor!: remove native federation and bootstrap as a plain angular app` — package.json,
   bun.lock, bunfig.toml, angular.json, biome.jsonc, federation.config.mjs (D),
   tsconfig.federation.json (D), src/main.ts, src/bootstrap.ts (D), src/index.html, .gitignore
2. `refactor!: drop host coupling from shared plumbing and env` — src/app/** (shared, template
   module, app.*), load-env.js, .env.example
3. `refactor: remove federation expose step from module generator` — scripts/generate-module.js,
   scripts/generate-module.test.js
4. `ci: make docker, nginx and pipeline generic` — Dockerfile, nginx.conf, compose.yml,
   .gitlab-ci.yml, .dockerignore
5. `docs: document standalone template, upstream sync and federation migration` — AGENTS.md,
   README.md, .agents/**, src/app/modules/template/README.md, odd/tasks/standalone-variant.md
Note: commit 1 alone does not compile (shared code still imports pubsub-js / ngx-device-detector);
squash 1+2 if every commit must build.

## Next step
Parent: review, create the work-unit commits above, then decide push/MR.
