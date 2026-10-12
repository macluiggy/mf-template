# front-template-standalone

Angular 22 single-page application template (standalone components, signals, zoneless) for client
and personal projects. It is a fork of the Neocore micro-frontend template without Native
Federation or a host: same layout, tooling and conventions, so upstream improvements can be merged
and the app can be turned into a federated remote later.

## Quickstart

Requirements: [bun](https://bun.sh) 1.4+, Node 22.22+.

```bash
bun install            # dependencies + .env from .env.example
bun run start          # http://localhost:4200 (redirects to /template)
bun run test           # unit tests (vitest) + script tests
bun run check          # Biome lint + format
bun run build          # dist/browser/index.html
```

Set `API_URL` (backend base URL) and `SECRET_KEY` (localStorage encryption key, ≥ 10 chars) in
`.env`.

## Start a new project from this template

1. Clone it, then set `name` in `package.json`, the project name and dev port in `angular.json`
   if needed, and the service name in `compose.yml`.
2. Create features with `bun run generate:module -- --name=<kebab-name>` and add the printed lazy
   route to `src/app/app.routes.ts`.
3. Keep in sync with the template through `git merge` (see `.agents/sync-from-upstream.md`).

## Docs

- [`AGENTS.md`](AGENTS.md) — rules and capability map (start here, also for AI agents)
- [`.agents/`](.agents/) — architecture, environment, testing, deployment, upstream sync,
  migration to Native Federation
- [`src/app/modules/template/README.md`](src/app/modules/template/README.md) — reference module
