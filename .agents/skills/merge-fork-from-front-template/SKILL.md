---
name: merge-fork-from-front-template
description: 'Trigger: merge front-template, sync fork with front-template, traer cambios de front-template, resolver conflictos front-template. Real git merge from front-template into a Neocore Angular micro-frontend fork, then make the fork run like the template (Native Federation, strict Angular singletons, bun scripts) without changing its route/module contracts.'
license: Apache-2.0
metadata:
  author: 'maciasl'
  version: '1.0'
---

## Activation Contract

Load when asked to bring front-template's generic/base changes into one of its forks
(frontvirtualofficebroker, frontcore, frontauthentication, frontmigrationov, ...) via a real
`git merge`, or to resolve conflicts from one already started. Forks usually share NO git history
with front-template (different root commits): the first merge needs `--allow-unrelated-histories`
and every same-path file is an add/add conflict, even when the intent is really "modified".

**Target state of every merge:** the fork RUNS LIKE FRONT-TEMPLATE — Angular 22.2.1 + Native
Federation 22.2.2, strict Angular singletons aligned with the host `frontcontainer`, the template's
bun scripts/tooling/dev server/build, and the template's shared plumbing — while every existing fork
route/module keeps its URL, lazy-loading, auth and host contract. The fork's business modules are
NOT rewritten to the template's standalone style; only their host integration is repaired.

## Hard Rules

- **NEVER commit, `git merge --continue`, `--abort`, reset/amend, push or open a PR/MR.** Your job
  ends at: conflicts resolved, gate green, everything staged with `git add`. The merge stays in the
  "all conflicts fixed but you are still merging" state; the user reviews the staged diff and runs
  `git commit` themselves. In OpenCode `git commit` (any form) and completing the merge are `deny`
  in `~/.config/opencode/opencode.jsonc`; that backstop never replaces this rule. If you slip and
  commit anyway, don't undo it unprompted — say so and let the user decide.
- **Run the whole flow end-to-end WITHOUT asking anything.** Defaults: new branch
  `sync/front-template-base`, upstream `front-template/rama` (the current 22.2.x train). The template
  also has `development` and `feat/standalone-variant` and NO `main`; if the expected change is not
  on `rama`, find the branch with `git log --all -- <path>` / `git ls-tree -r <sha> --name-only |
  grep <feature>` and merge that one instead. If a merge is already in progress (`MERGE_HEAD`
  exists), continue it — never start a second one. Only stop when the skill genuinely does not
  cover the state (e.g. a dirty worktree before starting; report, don't stash).
- **The host's installed versions are the contract, not this doc.** The template currently pins
  `@angular/*` 22.2.1, `@angular/build`/`cli`/`compiler-cli` 22.2.1, Native Federation 22.2.2,
  TypeScript ~6.0.3, rxjs ~7.8.2. Never use `^`/`~` on Angular/NF. If `frontcontainer` runs a
  different version, align the fork to the HOST and update the template row in the same train.
  Federation shares Angular/rxjs as `singleton + strictVersion`: a drift gives the remote its own
  Angular runtime and the host throws `NG0203` (`InjectionToken router duplicate forRoot guard`) or
  logs `NG0912` duplicate-component noise. Verify the LIVE `remoteEntry.json` shared
  `@angular/core` `version`/`requiredVersion` on both host and fork, not just `package.json`.
- **Scripts and tooling align to front-template, DEFAULT on every merge.** Re-read the template's
  current `package.json` scripts (names drift — never copy from this doc). The fork ends with the
  same script NAMES and COMMANDS for `start`, `build`, `watch`, `test`, `test:watch`,
  `test:scripts`, `lint`, `lint:fix`, `format`, `format:check`, `verify`, `generate:module`,
  `env`, `prepare`.
  Fork-only scripts survive only when the template has no equivalent (e.g. `test:unit`,
  `test:browser`, `test:ci`); keep the fork's extra dependencies. Report a script alignment table.
- **The test runner is Vitest (`@angular/build:unit-test`).** A fork still on Karma/Jasmine migrates
  as part of aligning `test`: follow `references/vitest-migration.md` (schematic, zone.js vitest
  patch, `aot: false` for NgModule specs, lib-components inline, leftover fixes). Never delete or
  skip specs to get green.
- **Propose upstream candidates, proactively.** front-template must keep evolving into the best
  base for new fronts and micro-frontends. While merging, watch for fork changes that are GENERAL
  (fix, tooling, config, CI, shared plumbing, test setup, docs) and would help every MF — e.g. a
  build/test fix any fork would hit, a missing `.gitignore` entry, a safer default. List them in the
  report as "Upstream candidates" (file, what, why it is general). Never edit front-template from a
  fork merge on your own: the user decides, then it lands in front-template with its tests/docs and
  flows back to every fork on the next merge. Business code, fork names/ports/exposes and
  fork-only env vars are never candidates.
- **Native Federation only. No webpack/Module Federation config.** The fork's
  `federation.config.mjs` keeps the template policy (strict Angular/rxjs singletons, `skip` list,
  `denseChunking`) plus the fork's `name` and `exposes`. `tsconfig.federation.json` is the union of
  every exposed file. Exposed key `./X` MUST equal the exported symbol `X` — the host resolves
  `m[entry.exposedModule]`.
- **Exposed routes/modules never provide an HttpClient and never call `RouterModule.forRoot`.**
  Use `provideMfHttpClient()` only in the standalone-dev `app.config.ts`; hosted mode uses the
  host's HttpClient/interceptors. NgModule forks use `RouterModule.forChild`; standalone forks use
  `Routes`. A `forRoot`/`provideHttpClient` inside an exposed entry creates a second injector/HttpClient
  and breaks the host contract.
- **The fork's business modules under `src/app/modules/<feature>/**` are `--ours`, untouched.**
  Legacy NgModule business code stays as-is; porting it to standalone is a separate follow-up with
  characterization tests, never part of the merge. `src/app/modules/template/**` is the template's
  reference module (`--theirs`) and may stay unexposed/removed by the fork.
- **Shared plumbing is template, but hand-merge when the conflict is not truly equivalent.**
  `src/app/shared/**` may carry fork-only enum keys, response fields, storage keys, interceptors or
  providers; keep them. Config files can auto-merge and still silently lose entries (git is
  line-based): diff `tsconfig*.json`, `.gitignore`, `.env.example`, `package.json` and
  `angular.json` against the pre-merge SHA even when git never flagged them.
- **Env contract:** `SECRET_KEY` must be identical to the host (encrypted localStorage, silent
  failure otherwise); `API_URL` and `ENTITY_ROOT` are required; `NODE_ENV` accepts only `DEV`/`PROD`
  (the template's `load-env.js` rejects `production`). New variables go to `.env.example`, to
  `load-env.js` (`readBaseConfig` + generated interface) and to the CI `build_app` `.env` heredoc.
  Never commit `.env`, `.npmrc`, `src/environments/*`, `dist/` or host `container.json(c)`.
- **Generated files are never hand-merged:** `src/environments/*` (regenerated by `load-env.js`),
  `bun.lock` (regenerated by `bun install`, gitignored and never committed), host
  `src/assets/container.json(c)` (regenerated by the host's `load-env.js`). Re-run the generator
  instead.
- **Run the full gate after resolving** (details in `references/post-merge-fixups.md`): `bun install`,
  unit + script tests, production build, lint/check, inspect `dist/browser/remoteEntry.json`, start
  the dev server and verify the live shared version and an exposed route in the host (no `NG0203`).
  A green `git status` after `git add` is not enough. Restart `ng serve` after any Angular/NF version
  change; a production `bun run build:federation` while `ng serve` is running clobbers `dist/browser`.
- **Angular 17+ syntax in new/touched template code:** standalone, signals, `inject()`,
  `@if`/`@for`/`@switch`, OnPush. No new NgModules, no `*ngIf`/`*ngFor`, no constructor injection.
  Legacy fork modules are the exception: don't rewrite them as part of the merge.

## Decision Gates

| File category                                                                                                      | Resolution                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `src/app/modules/<feature>/**` (fork business: wallet, public-payment, ...)                                        | `--ours`, untouched                                                                                            |
| `src/app/modules/template/**`                                                                                      | `--theirs`, reference module kept                                                                              |
| `src/app/shared/**` (storage, pubsub, auth interceptor, response types, enums, providers, helpers)                 | Template structure + fork-only members by hand; run tests                                                      |
| `app.config.ts`, `app.routes.ts`, `bootstrap.ts`, `main.ts`                                                        | Merge both: adopt the template NF bootstrap and `provideMfHttpClient()`; keep the fork's routes/providers      |
| `federation.config.mjs`                                                                                            | Template policy + fork `name`/`exposes`; keep extra shared deps loose (e.g. `@neocore/lib-components`)         |
| `tsconfig.federation.json`                                                                                         | Union of exposed files                                                                                         |
| `angular.json`                                                                                                     | Template targets/builders/polyfills; fork project name, port, assets/styles                                    |
| `package.json`                                                                                                     | Template Angular/NF/tooling pins; fork `name`/`version`/deps; `bun install` regenerates the gitignored lock    |
| `scripts/**`, `load-env.js`, `oxlint.config.ts`, `oxfmt.config.ts`, `.husky/**`, `.node-version`, `.bun-version`, `bunfig.toml`, `.editorconfig`, `.mcp.json`, `.vscode/**`, `public/**` | Template; keep fork-specific env fields, ignores and aliases                                                   |
| `Dockerfile`, `nginx.conf`, `compose.yml`, `.dockerignore`                                                         | Template structure + fork service names/ports/env; keep `/health`                                              |
| `.gitignore`                                                                                                       | Union; fork entries win                                                                                        |
| `.env.example`                                                                                                     | Template + fork-specific variables                                                                             |
| `.gitlab-ci.yml`                                                                                                   | Regenerate: `node scaffold/generate.js --service=<mf-name> --target=. --force` (never hand-merge)               |
| `AGENTS.md`                                                                                                        | Template; fork-only capabilities in `.agents/capabilities.local.md`                                            |
| `.agents/capabilities.local.md`                                                                                    | Fork                                                                                                           |
| `.agents/*.md`                                                                                                     | Template (host-integration, architecture, testing, environment, deployment, merge doc)                         |
| `README.md`                                                                                                        | Template base + fork-specific URLs/ports/module list                                                           |
| `src/index.html`, `src/styles.scss`                                                                                | Template structure + fork branding/styles; never drop the fork's design system                                 |
| Generated (`src/environments/*`, `bun.lock`, host `container.json(c)`)                                             | Re-run generator/`bun install`; never hand-merge; `bun.lock` is gitignored, never commit it                    |
| Version files (`.node-version`, `.bun-version`)                                                                    | Fork values win (CI reads them)                                                                                |

## Execution Steps

1. **Inspect / set up.**
   a. If `git rev-parse --verify MERGE_HEAD` succeeds, a merge is already in progress: record
   `MERGE_HEAD`, list `git diff --name-only --diff-filter=U`, and continue at step 2. Do not
   abort, do not start a second merge.
   b. Otherwise: `git status` must be clean; if not, STOP and report (never stash on your own). Cut
   `sync/front-template-base` from the fork's integration branch (`pre-production` by default,
   or the branch the user named). `git remote add front-template
      https://gitads.aseguradoradelsur.com/neocore/core/front-template.git` if missing, then
   `git fetch front-template`. Default upstream `front-template/rama`; verify the branch
   actually contains the expected change before merging.
   c. Record `PRE_MERGE_SHA=$(git rev-parse HEAD)`.
   d. Start `git merge front-template/rama --allow-unrelated-histories --no-commit --no-ff`
   (first merge) or `git merge front-template/<branch> --no-commit --no-ff`. Never
   `--continue`/commit.
2. **Resolve conflicts per the Decision Gates.** Read both sides (`git show :2:<path>` for ours,
   `:3:<path>` for theirs) on every tooling/config/shared conflict and write the union yourself.
   Do not blind-pick a whole side unless it is truly equivalent. Keep business modules untouched.
   For `bun.lock`, take either side provisionally and regenerate it with `bun install`; it is
   gitignored and never committed.
3. **Align versions and scripts.** Set the Angular/NF exact versions to the host/template in
   `package.json`; run `bun install`; align the script names/commands; update `angular.json`
   (project name, port, targets), `federation.config.mjs` (name/exposes/policy) and
   `tsconfig.federation.json` (exposed files).
4. **Verify the Native Federation contract.** Every `./X` expose has `export const/class X`;
   the file is listed in `tsconfig.federation.json`; no `provideHttpClient()`/
   `provideMfHttpClient()` in exposed entries; no `RouterModule.forRoot`; the host manifest row uses
   `exposedModule` without `./` and the right `typeRemote`. See
   `references/native-federation-contract.md`.
5. **Run the gate** (`references/post-merge-fixups.md`):
   - `NODE_ENV=DEV SKIP_ENV_FETCH=1 bun run test` (unit + `test:scripts`)
   - `NODE_ENV=PROD SKIP_ENV_FETCH=1 bun run build:federation`
   - `bun run lint` / `bun run verify`
   - inspect `dist/browser/remoteEntry.json`: every expose, shared `@angular/core` version/
     `requiredVersion`, `buildNotificationsEndpoint`
   - start the dev server on the fork port, `curl /remoteEntry.json`, load the exposed route in the
     host when available; assert no `NG0203` and that the component/module renders.
6. **Fix gate failures** using `references/post-merge-fixups.md` before expanding scope. A
   pre-existing failure unrelated to the merge (same failure at `PRE_MERGE_SHA`) is reported, not
   fixed.
7. **`git add -A`** if the gate produced fixups; re-run the gate. Report and STOP — do not commit,
   push, or open a PR/MR.
8. **Offer host-side local verification** (add the row to `frontcontainer/src/assets/container.jsonc`,
   regenerate `container.json`, hard reload). Never commit host local URLs or the host's gitignored
   manifest.

## Output Contract

Report: merge status (still in progress, no commit SHA), a conflict table (file → ours/theirs/
hand-merged + why), the version and script alignment tables, the NF contract checklist, gate results
(tests/build/lint), `remoteEntry.json` evidence, dev-server/host verification (shared version,
exposed route, no NG0203), the untouchables diff (business modules empty), the "Upstream
candidates" for front-template (or "none found"), and proposed review slices for the user's commits. Never claim "done" without actually running the commands; never call
the merge "complete" — only "conflicts resolved and staged for review".

## References

- `references/version-alignment.md` — host/fork exact versions, strict singleton, NG0203/NG0912,
  live checks, restart, `dist/browser` caveat, `NODE_ENV` and lockfile drift.
- `references/native-federation-contract.md` — exposes/Routes/NgModule, `forChild` vs `forRoot`,
  `federation.config.mjs`, `tsconfig.federation.json`, `angular.json`, host manifest, dev server,
  build notifications and HMR.
- `references/post-merge-fixups.md` — conflict-specific fixups (env/CI/Docker/shared/config),
  gate commands, recurring failures and host-side verification.
- `references/vitest-migration.md` — Karma/Jasmine fork → Vitest: dependencies, `build-test`,
  zone.js patch, `aot: false`, lib-components inline and the schematic's leftovers.
