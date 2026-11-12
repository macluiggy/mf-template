# Angular 22 template

A generic Angular 22 **standalone** template: a plain SPA (standalone components, signals,
`inject()`, OnPush) with the plumbing every project ends up writing — ports with safe local
defaults, a feature-module generator, tests next to the file they cover, Temporal, Oxc
lint/format and a Docker/nginx runtime.

Two optional presets ride on top, and neither one is required:

| Preset                                    | What it adds                                                                     | Enable it with                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------ |
| Native Federation remote                  | A `remoteEntry.json` a host container loads at runtime                             | `bun run build:federation` / `bun run start:federation` |
| NEOCORE host integration (`frontcontainer`) | PubSub topics, encrypted storage with the host `SECRET_KEY`, device info, permissions | `provideNeocoreHost()` (see [`.agents/host-integration.md`](.agents/host-integration.md)) |

Without them the app runs on the core ports: console notifier, plain `localStorage`, no token,
allow-all permissions.

## Quickstart

Requirements: [bun](https://bun.sh) 1.4+, Node 26.12+ (the exact versions live in `.bun-version`
and `.node-version`).

```bash
bun install            # dependencies + .env from .env.example
bun run start          # http://localhost:4250 (standalone SPA, redirects to /template)
bun run test           # unit tests (vitest) + script tests
bun run lint           # oxlint
bun run build          # dist/browser (standalone SPA)
```

`bun install` creates `.env` from `.env.example`. The only required variable is `API_URL`; every
other one (`SECRET_KEY`, `ENTITY_ROOT`, the remote config call) is opt-in — see
[`.agents/environment.md`](.agents/environment.md).

## Start a project from this template

1. Copy/clone the template, then set `name` in `package.json` and `federation.config.mjs`, the
   project name and dev port in `angular.json`.
2. Create features with `bun run generate:module -- --name=<kebab-name>` (add `--expose` only when
   the feature must be loaded by a host).
3. Take template updates with `node scripts/template-sync.js` — a project never merges the
   template's commits (see [`.agents/projects-from-template.md`](.agents/projects-from-template.md)).

## CI

- `.github/workflows/ci.yml` — the generic pipeline: install, lint, format check, tests, build.
  No secrets, no deploy.
- `.gitlab-ci.yml` — the **NEOCORE GitLab preset** (gitads registry, `nc_core` runners, SSH
  deploy). It is generated: `node scaffold/generate.js --service=<name> --target=. --force` (see
  [`scaffold/README.md`](scaffold/README.md)).

## Docs

- [`AGENTS.md`](AGENTS.md) — rules and capability map (start here, also for AI agents)
- [`.agents/`](.agents/) — architecture, environment, testing, deployment and the NEOCORE host preset
- [`src/app/modules/template/README.md`](src/app/modules/template/README.md) — reference module
