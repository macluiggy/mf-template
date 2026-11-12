# Deployment

## Docker

`Dockerfile` has three routes selected by `DIST_STAGE`:

| `DIST_STAGE`      | Used by               | What happens                                                                      |
| ----------------- | --------------------- | --------------------------------------------------------------------------------- |
| `build` (default) | local / `compose.yml` | `bun install` + `bun run build` (standalone SPA) inside the image (uses `.env`, or `.env.example`) |
| `prebuilt`        | CI `build_image`      | copies `dist/` produced by `build_app`                                            |

`bun run build` emits the standalone SPA (`dist/browser/index.html`); `bun run build:federation`
adds the Native Federation manifest (`dist/browser/remoteEntry.json`) used by the host. The CI
`build_app` job runs `build:federation` when the repo has a `federation.config.mjs`.

The runtime stage takes one more build arg, `FEDERATION` (`--build-arg FEDERATION=true`): it ships
the CORS include, which only a federated remote needs (see [nginx](#nginx)).

Runtime: `nginx:alpine-slim`, non-root (`USER nginx` + `CAP_NET_BIND_SERVICE`), `tini` as PID 1,
read-only served files, `HEALTHCHECK` on `/health`. Private `@neocore` packages in a local build:
`docker build --secret id=npmrc,src=.npmrc .` (never `COPY` the `.npmrc`).

## nginx

`nginx.conf` serves `dist/browser` with:

- **Cache by file type.** Every `.js`/`.css` the build emits is content-hashed (esbuild
  `name-HASH.js`, Native Federation shared bundles `name.HASH.js`), so it is cached for a year
  (`immutable`). Everything else — `remoteEntry.json`, `importmap.json`, `index.html`, assets without
  a hash — is `no-store`, so a deploy is visible immediately. Never give a `.js`/`.css` a fixed name.
- **Headers in one place, split by need.** `nginx.conf` includes every `/etc/nginx/conf.d/*.inc` in
  the server block and in each location: nginx drops all inherited `add_header` in a location
  that declares its own, so a location without the include silently loses the headers. The
  includes are:
  - `remote-headers.inc` (`nginx.remote-headers.conf`): hardening (`X-Content-Type-Options:
    nosniff`, `Referrer-Policy`) — **always** shipped, a plain SPA needs them too.
  - `federation-cors.inc` (`nginx.federation-cors.conf`): CORS (`Access-Control-Allow-Origin: *`,
    `-Methods`, `-Headers`) — only a **federated remote** needs them (the host fetches
    `remoteEntry.json` and the chunks cross-origin). The image ships this file only with
    `--build-arg FEDERATION=true`; a plain SPA is built without it and serves no CORS.
  The `.inc` extension is deliberate: nginx's default `include /etc/nginx/conf.d/*.conf` must not
  auto-load them as server blocks.
- gzip for JS/CSS/JSON/SVG, SPA fallback to `index.html`, `OPTIONS` → 204, and `/health`.
The MF is served at the root of its own origin; do not add path prefixes (`/fvc`-style locations)
unless the reverse proxy requires it.

## CI/CD (`.gitlab-ci.yml`)

The `build_image` job passes `--build-arg FEDERATION=true` when the repo has a
`federation.config.mjs` (the same condition that makes `build_app` build the federation manifest);
a repo without it builds the plain SPA image, without CORS.

`resolve_versions → install → test (lint, format:check, test:unit) → security (SAST, secret
detection + gates) → build → docker → deploy`, on `main`, `development`, `quality`, `pre-production`
— same structure as backtemplate.

- Node/Bun versions come from `.node-version` / `.bun-version`: `resolve_versions` publishes
  `BUN_VERSION` and `NODE_MAJOR` (dotenv artifact). Bun jobs use `oven/bun:${BUN_VERSION}-slim`;
  test jobs run on `node:${NODE_MAJOR}-slim` with `npm run` (Bun only installs);
  `build_image` passes `--build-arg BUN_VERSION`. Never hardcode a version in the pipeline.
- `lint`, `format:check` and `test:unit` start in parallel right after `resolve_versions`.
  `lint` and `format:check` are advisory (`allow_failure: true`, shown as a warning): forks predate
  Oxc and carry legacy findings, so only `test:unit` and the security gates block `build_app`;
  `install_deps` only warms the cache for later pipelines.

- `.gitlab-ci.yml` is GENERATED from `scaffold/templates/gitlab-ci.yml`: never edit it by hand.
  Edit the template, then `node scaffold/generate.js --service=<mf-name> --target=<repo> --force`
  (see [`scaffold/README.md`](../scaffold/README.md)). Per-repo values (`SERVICE_NAME`,
  `CONTAINER_NAME`, `COMPOSE_IMAGE_VAR`, `COMPOSE_FILE_*`, `RUNNER_TAG`) derive from `--service`;
  `scripts/gitlab-ci-scaffold.test.js` fails when the committed file drifts from the template.
  Fork-specific build variables go into `build_app`'s `.env` with `--extra-env-keys=KEY[,KEY]`
  (values are GitLab CI/CD variables of the same name).
- Environment-scoped CI/CD variables: `API_URL`, `SECRET_KEY`, `ENTITY_ROOT`, `NODE_ENV`,
  `DEPLOY_HOST_DEV|QA|PREPROD`, `DEPLOY_SSH_PRIVATE_KEY`.
- `.npmrc` for `@neocore/*` is generated with `CI_JOB_TOKEN`; the project must be in the job-token
  allowlist of `neocore/core/libcomponents`.
- Image tags: `<version>-<env>-<sha>` and the channel tag (`stable`, `dev`, `qa`, `pre-prod`).
- Deploy: SSH to the server, export `COMPOSE_IMAGE_VAR=<exact image>`, `docker compose pull/up` the
  service from the compose file that lives on the server.
- `.env` is written in `build_app` from CI variables and is never printed nor kept as an artifact.

## Adding `@neocore/lib-components`

It is published in the private GitLab registry (project 140), so it is not a default dependency.

1. Local: create an untracked `.npmrc`:
   ```ini
   @neocore:registry=https://gitads.aseguradoradelsur.com/api/v4/projects/140/packages/npm/
   //gitads.aseguradoradelsur.com/api/v4/projects/140/packages/npm/:_authToken=<personal token>
   ```
2. `bun add @neocore/lib-components@<version>`, and add it to `minimumReleaseAgeExcludes` in
   `bunfig.toml`: it is published internally, right before the fork needs it, so it must bypass
   the 7-day minimum age.
3. In `federation.config.mjs` share it loosely, as frontcore does:
   `'@neocore/lib-components': { singleton: false, strictVersion: false, requiredVersion: false }`.
4. CI already writes the `.npmrc` (`.npmrc_setup`).
5. If it ships ESM that imports extensionless paths, add it to `server.deps.inline` in
   `vitest.config.ts`: Node's strict ESM loader rejects them, so Vite must transform them.
