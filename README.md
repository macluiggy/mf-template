# front-template

Base of every Neocore micro-frontend: an Angular 22 remote (standalone, signals) loaded by the host
`frontcontainer` through Native Federation. Fork it to start a new MF.

## Quickstart

Requirements: [bun](https://bun.sh) 1.4+, Node 22.22+.

```bash
bun install            # dependencies + .env from .env.example
bun run start          # http://localhost:4250 (standalone, redirects to /template)
bun run test           # unit tests (vitest) + script tests
bun run lint           # Biome
bun run build          # dist/browser/remoteEntry.json exposing ./TemplateRoutes
```

Set `SECRET_KEY` in `.env` to the host's value to read the session token stored by the host.

## Start a new MF from this template

1. Fork/clone, then set `name` in `package.json` and `federation.config.mjs`, the project name and
   dev port in `angular.json`, and the `variables:` block of `.gitlab-ci.yml`.
2. Create features with `bun run generate:module -- --name=<kebab-name> --expose`.
3. Register each exposed entry as a manifest row in ms-core (see `.agents/host-integration.md`).
4. Keep in sync with this repo through `git merge` (see `.agents/merge-changes-from-front-template.md`).

## Docs

- [`AGENTS.md`](AGENTS.md) — rules and capability map (start here, also for AI agents)
- [`.agents/`](.agents/) — architecture, host integration, environment, testing, deployment
- [`src/app/modules/template/README.md`](src/app/modules/template/README.md) — reference module
