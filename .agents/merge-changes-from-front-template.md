# Sync a fork with `front-template`

> **NEOCORE forks only.** This workflow merges the template's history into a fork that cloned it.
> A project created with `scripts/template-sync.js` (one snapshot commit) never merges the template's
> commits — it takes updates with `node scripts/template-sync.js` (see
> [`projects-from-template.md`](projects-from-template.md)).

Forks (`mf-template`, new MFs) are independent repos whose history may not share a root with this
one. Changes flow with a real `git merge`, never by copying files by hand.

For the automated end-to-end procedure — conflict decision gates, version alignment with the host,
Native Federation contract checks and the verification gate — load
[`.agents/skills/merge-fork-from-front-template/SKILL.md`](skills/merge-fork-from-front-template/SKILL.md).

```bash
git remote add template https://gitads.aseguradoradelsur.com/neocore/core/front-template.git  # once
git fetch template
git checkout -b chore/sync-front-template
git merge template/main --allow-unrelated-histories   # flag needed only for the first merge
```

## Conflict resolution

| Path                                                                                                       | Wins                                                | Why                                                                                   |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/app/shared/**`, `scripts/**`, `load-env.js`, `oxlint.config.ts`, `oxfmt.config.ts`, `.husky/**`, `.node-version`, `.bun-version`, `bunfig.toml`, `Dockerfile`, `nginx.conf`, `nginx.remote-headers.conf` | template                                            | Shared plumbing; fork changes belong upstream                                         |
| `src/app/modules/template/**`                                                                              | template                                            | Reference module (forks may delete it after creating their own modules)               |
| `src/app/modules/<feature>/**`                                                                             | fork                                                | Fork business code                                                                    |
| `federation.config.mjs`                                                                                    | merge both                                          | Keep the template policy (shared/skip/features) and the fork `name` + `exposes`       |
| `tsconfig.federation.json`                                                                                 | merge both                                          | Union of exposed files                                                                |
| `angular.json`                                                                                             | merge both                                          | Template targets; fork project name and port                                          |
| `package.json`                                                                                             | merge both                                          | Template versions for shared deps/tooling; keep fork `name`, `version` and extra deps |
| `bun.lock`                                                                                                 | regenerate                                          | `bun install` after resolving `package.json` (gitignored, never committed)            |
| `.gitlab-ci.yml`                                                                                           | regenerate with `scaffold/generate.js`               | Generated; per-repo values come from `--service`                                                      |
| `AGENTS.md`                                                                                                | template                                            | Fork-only rows go to `.agents/capabilities.local.md`                                  |
| `.agents/capabilities.local.md`                                                                            | fork                                                | Never edited in the template                                                          |
| `app.routes.ts`, `app.config.ts`                                                                           | merge both                                          | Keep `provideMfHttpClient()`                                                          |

After resolving: `bun install && bun run lint && bun run test && bun run build:federation`, and check
`dist/browser/remoteEntry.json` still lists every exposed key.

Report the fork's general changes (fixes, tooling, config, CI, test setup) as upstream candidates
for front-template; they land here only after the user approves them. A fork still on
Karma/Jasmine migrates to Vitest with
[`references/vitest-migration.md`](skills/merge-fork-from-front-template/references/vitest-migration.md).
