# Sync a fork with `front-template`

Forks (`mf-template`, new MFs) are independent repos whose history may not share a root with this
one. Changes flow with a real `git merge`, never by copying files by hand.

```bash
git remote add template https://gitads.aseguradoradelsur.com/neocore/core/front-template.git  # once
git fetch template
git checkout -b chore/sync-front-template
git merge template/main --allow-unrelated-histories   # flag needed only for the first merge
```

## Conflict resolution

| Path | Wins | Why |
|---|---|---|
| `src/app/shared/**`, `scripts/**`, `load-env.js`, `biome.jsonc`, `bunfig.toml`, `Dockerfile`, `nginx.conf` | template | Shared plumbing; fork changes belong upstream |
| `src/app/modules/template/**` | template | Reference module (forks may delete it after creating their own modules) |
| `src/app/modules/<feature>/**` | fork | Fork business code |
| `federation.config.mjs` | merge both | Keep the template policy (shared/skip/features) and the fork `name` + `exposes` |
| `tsconfig.federation.json` | merge both | Union of exposed files |
| `angular.json` | merge both | Template targets; fork project name and port |
| `package.json` | merge both | Template versions for shared deps/tooling; keep fork `name`, `version` and extra deps |
| `bun.lock` | regenerate | `bun install` after resolving `package.json` |
| `.gitlab-ci.yml` | template, then re-apply the fork `variables:` block | Per-repo values live only there |
| `AGENTS.md` | template | Fork-only rows go to `.agents/capabilities.local.md` |
| `.agents/capabilities.local.md` | fork | Never edited in the template |
| `app.routes.ts`, `app.config.ts` | merge both | Keep `provideMfHttpClient()` |

After resolving: `bun install && bun run lint && bun run test && bun run build`, and check
`dist/browser/remoteEntry.json` still lists every exposed key.
