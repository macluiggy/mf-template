# Sync from upstream

This repo is a fork of the Neocore micro-frontend template (`front-template`, remote `upstream`)
with Native Federation and the host contract removed. Both share history, so generic improvements
(generator, Biome, tests, Docker hardening, the reference module) flow in with a real `git merge`,
never by copying files by hand.

```bash
git remote add upstream <front-template repository URL>   # once
git fetch upstream
git checkout -b chore/sync-upstream
git merge upstream/<branch>                                 # usually main
```

## Conflict resolution

Rule of thumb: **anything about federation or the host keeps this repo's version**; generic
tooling and reference code takes upstream's improvement, minus federation/host bits.

| Path | Wins | Why / how |
|---|---|---|
| `federation.config.mjs`, `tsconfig.federation.json`, `src/bootstrap.ts`, `.agents/host-integration.md`, `.agents/merge-changes-from-front-template.md` | this repo (keep deleted) | Federation/host only: `git rm` them again if the merge re-adds them |
| `src/main.ts` | this repo | Single-step `bootstrapApplication` |
| `angular.json` | this repo, then port generic option changes | Keep `@angular/build:application` / `dev-server` / `unit-test`, project `app-template`, port 4200; never re-add federation builders, `es-module-shims` or `zone.js` polyfills |
| `package.json` | merge both | Take upstream version bumps of shared tooling (`@angular/*`, `typescript`, `vitest`, Biome); drop `@angular-architects/native-federation`, `es-module-shims`, `zone.js`, `pubsub-js`, `ngx-device-detector`, `@softarc/*`; keep this `name`, `description`, and the `test` scripts without `SKIP_ENV_FETCH` |
| `bun.lock` | regenerate | `bun install` after resolving `package.json` |
| `src/app/shared/**` | merge both | Keep `provideAppHttpClient()` and the interceptor without `x-device-info`; drop `PubSub*`, `MsPrefixEnum`, permission headers if they come back |
| `src/app/modules/template/**` | upstream, then strip host bits | Take UI/test improvements; remove PubSub calls, `MsPrefixEnum`, permission headers |
| `scripts/generate-module*.js` | upstream, then strip `--expose` | Keep `nextSteps()` free of federation/manifest text |
| `load-env.js`, `.env.example` | this repo, then port generic fixes | No ms-core fetch, no `ENTITY_ROOT`, no "match the host" rule |
| `nginx.conf`, `Dockerfile`, `compose.yml` | merge both | Take hardening; no CORS, SPA caching kept, `app-template` names |
| `.gitlab-ci.yml` | this repo | Generic pipeline; never import Neocore registry, `.npmrc` or deploy stages |
| `AGENTS.md`, `.agents/*.md`, `README.md` | this repo, then port generic rules | No host/federation rules |
| `.agents/capabilities.local.md` | this repo | Project-only rows |
| `src/app/modules/<feature>/**` | this repo | Project business code |

After resolving:

```bash
bun install && bun run check && bun run test && bun run build
grep -rniE 'native-federation|remoteEntry|mf-template|pubsub' src scripts angular.json package.json
```

The `grep` must print nothing; `dist/browser/` must contain `index.html` and no `remoteEntry.json`.
