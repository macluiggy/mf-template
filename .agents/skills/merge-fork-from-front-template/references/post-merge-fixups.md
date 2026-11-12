# Post-merge fixups and verification

Recurring resolutions and gate failures after a front-template merge. Read this before expanding
scope: most red states are one of these categories.

## Conflict-specific fixups

### `package.json`

- Adopt the template's exact Angular/NF/tooling versions (`version-alignment.md`); keep the fork's
  `name`, `version`, `description`, extra dependencies and fork-only scripts.
- Keep the template's script names/commands (`start`, `build`, `watch`, `test`, `test:watch`,
  `test:scripts`, `lint`, `lint:fix`, `format`, `check`, `generate:module`, `env`, `prepare`).
  A fork may keep a documented flag (e.g. `node --stack-size=...` for very large builds) but the
  script name and entry command should stay aligned.
- `patchedDependencies`: keep a patch only if the exact patched package version is still in the
  tree. Upgrading NF replaces `@softarc/native-federation@4.6.0` with 4.7.x; a patch targeting
  4.6.0 no longer applies (remove the entry; keep the patch file only if it will be regenerated).
- Run `bun install`; never hand-merge `bun.lock`.

### `.env.example`, `load-env.js`, CI

- Template base + fork-specific variables. `SECRET_KEY` must equal the host's; `API_URL` and
  `ENTITY_ROOT` are required; `NODE_ENV` is `DEV`/`PROD`.
- A fork-specific variable must exist in `.env.example`, in `load-env.js` (`readBaseConfig` and the
  generated interface) and in `.gitlab-ci.yml`'s `build_app` `.env` heredoc — the latter by
  regenerating with `--extra-env-keys=KEY[,KEY]`, never by hand. Missing one makes a
  fresh CI build differ from local.
- `.gitlab-ci.yml` is generated: resolve it by regenerating, never by hand —
  `node scaffold/generate.js --service=<mf-name> --target=. --force` (overrides such as
  `--service-name=` / `--container-name=` when the server compose deviates). Reuse the exact
  command in the fork's current banner; `scripts/gitlab-ci-scaffold.test.js` re-renders from it.

### `Dockerfile`, `nginx.conf`, `compose.yml`, `.dockerignore`

- Template structure, fork service names/ports/env. Keep the `/health` `HEALTHCHECK` and the CORS /
  `no-store` rules in nginx (the host fetches `remoteEntry.json` and chunks cross-origin).
- `DIST_STAGE` (`build`/`prebuilt`) stays; the CI `build_image` job copies `dist/`.
- Never `COPY` `.npmrc` into the image; use the build secret.

### `angular.json`

- Template builders/targets/polyfills; fork project name, `serve.options.port`, assets,
  styles and `allowedCommonJsDependencies`. Do not lose `es-module-shims` (in the `federation` and
  `federation-development` configurations, NF runtime) or the federation CORS header.
- `build-test` must stay a plain `@angular/build:application`; `test` uses
  `@angular/build:unit-test` + `tsconfig.spec.json`.
- Temporal: keep `temporal-polyfill/global` in the `build`, `federation`, `federation-development`
  and `build-test` polyfills, add
  `"ESNext.Temporal"` to the fork's `tsconfig.json` `lib` (a fork that lists `lib` explicitly loses
  the types otherwise), keep `temporal-polyfill` in the federation `skip` list, and add
  `import 'temporal-polyfill/global';` to each EXPOSED entry: a host never runs the remote's
  `polyfills`. Fork code still on `Date` now fails `no-restricted-globals`; migrate it to Temporal
  as a follow-up (lint is advisory in CI), never by disabling the rule.

### `federation.config.mjs` / `tsconfig.federation.json`

- Keep the template policy and the fork's `name` + `exposes`. Add every exposed file to
  `tsconfig.federation.json` `files`; an expose missing there fails the federation build.
- Do not make a fork-only library a strict singleton unless the host shares it identically.

### `src/app/shared/**`

- Template structure, fork-only members preserved:
  - `storage.enum.ts`: keep fork-specific keys; the host/fork token names must match.
  - `response.interface.ts`: keep fork-specific envelope fields.
  - `auth.interceptor.ts` / `storage.service.ts` / `pubsub.service.ts`: template behavior; ensure
    the fork's business modules still compile.
- Run the unit tests after resolving; a dropped enum/type surfaces as a compile error or a runtime
  `undefined`.

### `app.config.ts`, `app.routes.ts`, `bootstrap.ts`, `main.ts`

- Adopt the template's NF bootstrap (`initFederation(...)` then `import('./bootstrap')`), the
  template's `app.config.ts` (`provideMfHttpClient()` etc.) and keep the fork's business routes.
- The fork's `main.ts` may have legacy bootstrap code; the target is the template's two-phase NF
  bootstrap. Do not keep a second `bootstrapApplication` path.

### `src/index.html`, `src/styles.scss`

- Template head/base tags + the fork's title, favicon, branding and full stylesheet. Never replace a
  fork's design system with the template's empty styles. Keep the fork's global styles and external
  font/icon links.

### `README.md`

- Template base structure + fork-specific URLs, ports, module list and deployment notes. Don't drop
  fork-only instructions.

### `.gitignore`, `.dockerignore`, `.editorconfig`, `.mcp.json`, `.vscode/**`, `public/**`

- Union, fork entries win. Check that `.gitignore` does not swallow the fork's generated/test dirs
  (`dist-test`, `src/environments`, host `container.json(c)`).

### `AGENTS.md`, `.agents/**`

- `AGENTS.md` and `.agents/{architecture,host-integration,testing,environment,deployment,merge-changes-from-front-template}.md`
  are template. `.agents/capabilities.local.md` is the fork's (never overwrite it with the stub);
  add fork-only capabilities there.
- Keep the version table in `.agents/host-integration.md` in sync with the real host version.

## Gate

Run from the fork root (explicit `NODE_ENV`, see `version-alignment.md`):

```bash
bun install
NODE_ENV=DEV SKIP_ENV_FETCH=1 bun run test     # @angular/build:unit-test + node --test scripts
NODE_ENV=PROD SKIP_ENV_FETCH=1 bun run build:federation   # federation build -> dist/browser/remoteEntry.json
bun run lint                                   # oxlint
bun run verify                                 # oxlint + oxfmt --check (verify)
```

Then:

```bash
node -e "const j=require('./dist/browser/remoteEntry.json');console.log({name:j.name,exposes:j.exposes.map(e=>e.key),endpoint:j.buildNotificationsEndpoint});const c=j.shared.find(x=>x.packageName==='@angular/core');console.log(c&&{version:c.version,requiredVersion:c.requiredVersion,strict:c.strictVersion})"
```

Start the dev server on the fork port and:

```bash
curl -s http://localhost:<port>/remoteEntry.json | node -e "..."   # same checks
```

Load an exposed route in the host and confirm the component/module renders with no `NG0203`.

## Recurring failures

| Symptom                                                                        | Cause / fix                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NG0203 ... router duplicate forRoot guard`                                    | Host/fork Angular versions differ (strict singleton). Align exact versions, `bun install`, restart `ng serve`, hard-reload the host.                                                                                     |
| `NG0912` duplicate component IDs                                               | Host and fork bundle the same library (`@ng-bootstrap`, `@angular/cdk`, `ngx-otp-input`). Usually warnings; not the blank-page cause.                                                                                    |
| Route 404s although the manifest row exists                                    | `exposedModule` ≠ exported symbol, expose missing from `tsconfig.federation.json`, wrong `typeRemote`, wrong `path`, or the remote dev server is down/CORS. Check `remoteEntry.json` exposes and the host router config. |
| `HttpClient` not provided / interceptor bypassed in the host                   | The exposed route/module provides `provideHttpClient()`/`provideMfHttpClient()`. Remove it; hosted mode uses the host's HttpClient.                                                                                      |
| `RouterModule.forRoot` duplicate guard                                         | Exposed NgModule uses `forRoot`; change to `forChild` (standalone routes use plain `Routes`).                                                                                                                            |
| `NODE_ENV must be one of [DEV, PROD]`                                          | The terminal exports `NODE_ENV=production`; run with `NODE_ENV=DEV/PROD` explicitly.                                                                                                                                     |
| `SECRET_KEY` mismatch / no Authorization header                                | Fork `.env` `SECRET_KEY` differs from the host's; token reads return `undefined` silently. Copy the host's value locally.                                                                                                |
| Remote hot-swap stopped; `outFileName` hashed; no `buildNotificationsEndpoint` | A production `bun run build:federation` overwrote `dist/browser` while `ng serve` was running. Save a source file or restart `ng serve`; don't prod-build while dev-serving.                                                        |
| `Cannot find module '@angular/...'` / weird runtime after merge                | `package.json` and `bun.lock`/`node_modules` drifted. `bun install`; verify the installed version.                                                                                                                       |
| Build OOM/stack error in a large fork                                          | Keep the fork's documented `--stack-size`/memory flags in `start`/`build`; don't remove them to "match" the template blindly.                                                                                            |
| Route loads but blank page                                                     | Check the route shape (a child may require `:id`), the host router config, and the console for errors; not every blank page is a version issue.                                                                          |

## Untouchables and report

- `git diff --stat $PRE_MERGE_SHA -- src/app/modules/<feature>` must be empty for business modules
  (the template's `modules/template/**` is the only exception).
- List every file where you hand-merged instead of a pure ours/theirs pick and why.
- List the version/script alignment tables, the NF contract checks, the gate results and the host
  verification evidence.
- End with `git add -A` and STOP: no commit, no push, no PR.
